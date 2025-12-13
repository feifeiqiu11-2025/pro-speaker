import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import type { Result } from '../../shared/types/index.js';
import type { ITTSService, TTSSynthesizeOptions, TTSSynthesizeResult } from '../../domain/interfaces/index.js';
import { ExternalServiceError } from '../../shared/errors/index.js';
import { logger } from '../../shared/utils/logger.js';

interface AzureChatTTSConfig {
  subscriptionKey: string;
  region: string;
  defaultVoice?: string;
}

/**
 * Azure TTS Service adapter for chat feature
 * Implements ITTSService interface for clean dependency injection
 */
export class AzureChatTTSService implements ITTSService {
  private config: AzureChatTTSConfig;

  constructor(config: AzureChatTTSConfig) {
    this.config = {
      ...config,
      defaultVoice: config.defaultVoice || 'en-US-JennyNeural',
    };
  }

  async isReady(): Promise<boolean> {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        this.config.subscriptionKey,
        this.config.region
      );
      speechConfig.close();
      return true;
    } catch {
      return false;
    }
  }

  async synthesize(
    text: string,
    options: TTSSynthesizeOptions = {}
  ): Promise<Result<TTSSynthesizeResult>> {
    const endTimer = logger.time('AzureChatTTSService.synthesize');

    if (!text || text.trim().length === 0) {
      endTimer();
      return {
        success: false,
        error: new Error('Text is empty'),
      };
    }

    const voiceId = options.voiceId || this.config.defaultVoice!;
    const rate = options.rate ?? 0;
    const pitch = options.pitch ?? 0;

    try {
      const result = await this.synthesizeWithAzure(text, voiceId, rate, pitch);
      endTimer();
      return { success: true, data: result };
    } catch (error) {
      endTimer();
      logger.error('TTS synthesis failed', { error, textLength: text.length });
      return {
        success: false,
        error: new ExternalServiceError(
          'Azure TTS',
          error instanceof Error ? error : new Error(String(error))
        ),
      };
    }
  }

  private synthesizeWithAzure(
    text: string,
    voiceId: string,
    rate: number,
    pitch: number
  ): Promise<TTSSynthesizeResult> {
    return new Promise((resolve, reject) => {
      try {
        const speechConfig = sdk.SpeechConfig.fromSubscription(
          this.config.subscriptionKey,
          this.config.region
        );

        // Use MP3 format for smaller file size
        speechConfig.speechSynthesisOutputFormat =
          sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
        speechConfig.speechSynthesisVoiceName = voiceId;

        // Create synthesizer without audio output (we capture the buffer)
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);

        // Build SSML for better control
        const ssml = this.buildSSML(text, voiceId, rate, pitch);

        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            synthesizer.close();
            speechConfig.close();

            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              const audioBuffer = Buffer.from(result.audioData);
              const audioBase64 = audioBuffer.toString('base64');
              const durationMs = Math.round(result.audioDuration / 10000); // 100ns to ms

              resolve({
                audioBase64,
                durationMs,
              });
            } else {
              reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
            }
          },
          (error) => {
            synthesizer.close();
            speechConfig.close();
            reject(new Error(`Speech synthesis error: ${error}`));
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildSSML(text: string, voiceId: string, rate: number, pitch: number): string {
    // Escape XML special characters
    const cleanText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Format rate and pitch as percentages
    const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
    const pitchStr = pitch >= 0 ? `+${pitch}%` : `${pitch}%`;

    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voiceId}">
          <prosody rate="${rateStr}" pitch="${pitchStr}">
            ${cleanText}
          </prosody>
        </voice>
      </speak>
    `.trim();
  }
}
