import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { EventEmitter } from 'events';
import { logger } from '../../shared/utils/logger.js';

interface AzureConfig {
  subscriptionKey: string;
  region: string;
}

export interface StreamingResult {
  type: 'recognizing' | 'recognized' | 'pronunciation';
  transcript: string;
  isFinal: boolean;
  timestamp: number;
  pronunciationScore?: number;
  words?: Array<{
    word: string;
    accuracy: number;
  }>;
}

export interface StreamingEvents {
  result: (result: StreamingResult) => void;
  error: (error: Error) => void;
  ended: () => void;
}

/**
 * Real-time streaming speech analyzer using Azure Speech SDK
 * Provides continuous recognition with interim results
 */
export class AzureStreamingSpeechAnalyzer extends EventEmitter {
  private config: AzureConfig;
  private recognizer: sdk.SpeechRecognizer | null = null;
  private pushStream: sdk.PushAudioInputStream | null = null;
  private isRunning = false;

  constructor(config: AzureConfig) {
    super();
    this.config = config;
  }

  /**
   * Start streaming recognition session
   */
  async start(options: {
    locale?: string;
    enablePronunciation?: boolean;
  } = {}): Promise<void> {
    if (this.isRunning) {
      throw new Error('Streaming session already running');
    }

    const { locale = 'en-US', enablePronunciation = true } = options;

    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        this.config.subscriptionKey,
        this.config.region
      );
      speechConfig.speechRecognitionLanguage = locale;

      // Create push stream for audio input
      this.pushStream = sdk.AudioInputStream.createPushStream(
        sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
      );

      const audioConfig = sdk.AudioConfig.fromStreamInput(this.pushStream);
      this.recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      // Configure pronunciation assessment if enabled
      if (enablePronunciation) {
        const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
          '', // Empty reference text for continuous assessment
          sdk.PronunciationAssessmentGradingSystem.HundredMark,
          sdk.PronunciationAssessmentGranularity.Phoneme,
          true
        );
        pronunciationConfig.phonemeAlphabet = 'IPA';
        pronunciationConfig.enableProsodyAssessment = true;
        pronunciationConfig.applyTo(this.recognizer);
      }

      // Handle interim results (while speaking)
      this.recognizer.recognizing = (_sender, event) => {
        if (event.result.reason === sdk.ResultReason.RecognizingSpeech) {
          this.emit('result', {
            type: 'recognizing',
            transcript: event.result.text,
            isFinal: false,
            timestamp: Date.now(),
          } satisfies StreamingResult);
        }
      };

      // Handle final results (after pause/silence)
      this.recognizer.recognized = (_sender, event) => {
        if (event.result.reason === sdk.ResultReason.RecognizedSpeech) {
          const result: StreamingResult = {
            type: 'recognized',
            transcript: event.result.text,
            isFinal: true,
            timestamp: Date.now(),
          };

          // Try to get pronunciation assessment
          try {
            const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(event.result);
            if (pronunciationResult) {
              result.type = 'pronunciation';
              result.pronunciationScore = pronunciationResult.pronunciationScore;

              // Get word-level details
              const detailJson = event.result.properties.getProperty(
                sdk.PropertyId.SpeechServiceResponse_JsonResult
              );
              if (detailJson) {
                const detail = JSON.parse(detailJson);
                const nBest = detail.NBest?.[0];
                if (nBest?.Words) {
                  result.words = nBest.Words.map((w: { Word: string; PronunciationAssessment?: { AccuracyScore: number } }) => ({
                    word: w.Word,
                    accuracy: w.PronunciationAssessment?.AccuracyScore || 0,
                  }));
                }
              }
            }
          } catch (e) {
            logger.debug('No pronunciation data in result');
          }

          this.emit('result', result);
        } else if (event.result.reason === sdk.ResultReason.NoMatch) {
          // Silence detected, emit empty result
          this.emit('result', {
            type: 'recognized',
            transcript: '',
            isFinal: true,
            timestamp: Date.now(),
          } satisfies StreamingResult);
        }
      };

      // Handle errors
      this.recognizer.canceled = (_sender, event) => {
        if (event.reason === sdk.CancellationReason.Error) {
          this.emit('error', new Error(`Recognition error: ${event.errorDetails}`));
        }
        this.cleanup();
        this.emit('ended');
      };

      // Handle session end
      this.recognizer.sessionStopped = () => {
        this.cleanup();
        this.emit('ended');
      };

      // Start continuous recognition
      await new Promise<void>((resolve, reject) => {
        this.recognizer!.startContinuousRecognitionAsync(
          () => {
            this.isRunning = true;
            logger.info('Streaming recognition started');
            resolve();
          },
          (error) => {
            reject(new Error(error));
          }
        );
      });
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Write audio chunk to the stream
   * @param chunk Raw PCM audio data (16kHz, 16-bit, mono)
   */
  writeAudioChunk(chunk: Buffer): void {
    if (!this.pushStream || !this.isRunning) {
      throw new Error('Streaming session not running');
    }

    const uint8Array = new Uint8Array(chunk);
    this.pushStream.write(uint8Array.buffer as ArrayBuffer);
  }

  /**
   * Stop streaming recognition
   */
  async stop(): Promise<void> {
    if (!this.recognizer || !this.isRunning) {
      return;
    }

    // Close the push stream to signal end of audio
    if (this.pushStream) {
      this.pushStream.close();
    }

    await new Promise<void>((resolve) => {
      this.recognizer!.stopContinuousRecognitionAsync(
        () => {
          logger.info('Streaming recognition stopped');
          resolve();
        },
        () => {
          resolve();
        }
      );
    });

    this.cleanup();
  }

  private cleanup(): void {
    this.isRunning = false;

    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
    }

    this.pushStream = null;
  }

  /**
   * Check if currently streaming
   */
  get running(): boolean {
    return this.isRunning;
  }
}
