import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../shared/utils/logger.js';

export interface WordBoundary {
  word: string;
  startMs: number;
  endMs: number;
}

export interface TTSResult {
  audioBuffer: Buffer;
  wordBoundaries: WordBoundary[];
  durationMs: number;
}

interface AzureTTSConfig {
  subscriptionKey: string;
  region: string;
  voice?: string;
  audioDir?: string;
}

/**
 * Azure Text-to-Speech Service
 * Synthesizes speech with word-level timing information for synchronization
 */
export class AzureTTSService {
  private config: AzureTTSConfig;
  private audioDir: string;

  constructor(config: AzureTTSConfig) {
    this.config = {
      ...config,
      voice: config.voice || 'en-US-JennyNeural', // Natural female voice
    };
    // Use process.cwd() for ESM compatibility - assumes running from apps/backend
    this.audioDir = config.audioDir || path.join(process.cwd(), 'data/audio');
  }

  /**
   * Synthesize text to speech with word boundaries
   */
  async synthesize(text: string, articleId?: string): Promise<TTSResult> {
    const wordBoundaries: WordBoundary[] = [];

    return new Promise(async (resolve, reject) => {
      try {
        const speechConfig = sdk.SpeechConfig.fromSubscription(
          this.config.subscriptionKey,
          this.config.region
        );

        // Use high-quality audio format
        speechConfig.speechSynthesisOutputFormat =
          sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
        speechConfig.speechSynthesisVoiceName = this.config.voice!;

        // Create synthesizer with no audio output (we'll capture the buffer)
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);

        // Track word boundaries
        synthesizer.wordBoundary = (_sender, event) => {
          wordBoundaries.push({
            word: event.text,
            startMs: Math.round(event.audioOffset / 10000), // Convert from 100ns to ms
            endMs: Math.round((event.audioOffset + event.duration) / 10000),
          });
        };

        // Build SSML for better control
        const ssml = this.buildSSML(text);

        synthesizer.speakSsmlAsync(
          ssml,
          async (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              const audioBuffer = Buffer.from(result.audioData);
              const durationMs = result.audioDuration / 10000; // Convert from 100ns to ms

              // Optionally save to disk for caching
              if (articleId) {
                await this.saveAudioFile(articleId, audioBuffer);
              }

              synthesizer.close();
              resolve({
                audioBuffer,
                wordBoundaries,
                durationMs,
              });
            } else {
              synthesizer.close();
              reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
            }
          },
          (error) => {
            synthesizer.close();
            reject(new Error(`Speech synthesis error: ${error}`));
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get cached audio file if exists
   */
  async getCachedAudio(articleId: string): Promise<Buffer | null> {
    try {
      const filePath = this.getAudioFilePath(articleId);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Get cached word boundaries if exists
   */
  async getCachedWordBoundaries(articleId: string): Promise<WordBoundary[] | null> {
    try {
      const filePath = this.getWordBoundariesFilePath(articleId);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Synthesize and cache audio for an article
   */
  async synthesizeAndCache(text: string, articleId: string): Promise<TTSResult> {
    // Check if already cached
    const cachedAudio = await this.getCachedAudio(articleId);
    const cachedBoundaries = await this.getCachedWordBoundaries(articleId);

    if (cachedAudio && cachedBoundaries) {
      logger.info('Returning cached TTS audio', { articleId });
      return {
        audioBuffer: cachedAudio,
        wordBoundaries: cachedBoundaries,
        durationMs: 0, // Not stored, but not critical
      };
    }

    // Generate new
    const result = await this.synthesize(text, articleId);

    // Save word boundaries
    await this.saveWordBoundaries(articleId, result.wordBoundaries);

    return result;
  }

  /**
   * Build SSML for better pronunciation and pacing
   */
  private buildSSML(text: string): string {
    // Clean up text for better TTS
    const cleanText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${this.config.voice}">
          <prosody rate="0%" pitch="0%">
            ${cleanText}
          </prosody>
        </voice>
      </speak>
    `.trim();
  }

  /**
   * Get audio file path for article
   */
  private getAudioFilePath(articleId: string): string {
    return path.join(this.audioDir, `${articleId}.mp3`);
  }

  /**
   * Get word boundaries file path for article
   */
  private getWordBoundariesFilePath(articleId: string): string {
    return path.join(this.audioDir, `${articleId}-boundaries.json`);
  }

  /**
   * Save audio file to disk
   */
  private async saveAudioFile(articleId: string, buffer: Buffer): Promise<void> {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.writeFile(this.getAudioFilePath(articleId), buffer);
      logger.info('Saved TTS audio file', { articleId });
    } catch (error) {
      logger.error('Failed to save audio file', { articleId, error });
    }
  }

  /**
   * Save word boundaries to disk
   */
  private async saveWordBoundaries(articleId: string, boundaries: WordBoundary[]): Promise<void> {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.writeFile(
        this.getWordBoundariesFilePath(articleId),
        JSON.stringify(boundaries, null, 2)
      );
      logger.info('Saved word boundaries', { articleId, count: boundaries.length });
    } catch (error) {
      logger.error('Failed to save word boundaries', { articleId, error });
    }
  }
}
