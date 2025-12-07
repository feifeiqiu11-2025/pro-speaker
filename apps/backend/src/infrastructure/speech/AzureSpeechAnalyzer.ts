import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import type { ISpeechAnalyzer, AssessmentOptions } from '../../domain/interfaces/index.js';
import type { PronunciationResult, WordAnalysis, PhonemeAnalysis } from '../../shared/types/index.js';
import { ExternalServiceError, AudioProcessingError } from '../../shared/errors/index.js';
import { logger } from '../../shared/utils/logger.js';

interface AzureConfig {
  subscriptionKey: string;
  region: string;
}

interface AzureWordResult {
  Word: string;
  PronunciationAssessment: {
    AccuracyScore: number;
    ErrorType: string;
  };
  Phonemes?: AzurePhonemeResult[];
}

interface AzurePhonemeResult {
  Phoneme: string;
  PronunciationAssessment: {
    AccuracyScore: number;
  };
  Offset?: number;
  Duration?: number;
}

/**
 * Azure Speech SDK implementation for pronunciation assessment
 */
export class AzureSpeechAnalyzer implements ISpeechAnalyzer {
  private config: AzureConfig;

  constructor(config: AzureConfig) {
    this.config = config;
  }

  async isReady(): Promise<boolean> {
    try {
      // Simple check - if we can create a speech config, we're ready
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

  async assessPronunciation(
    audio: Buffer,
    options: AssessmentOptions = {}
  ): Promise<PronunciationResult> {
    const endTimer = logger.time('Azure pronunciation assessment');

    if (!audio || audio.length === 0) {
      throw new AudioProcessingError('Audio buffer is empty');
    }

    const {
      referenceText = null,
      locale = 'en-US',
      phonemeAlphabet = 'IPA',
      enableProsody = true,
      // enableContent is reserved for future use
    } = options;

    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        this.config.subscriptionKey,
        this.config.region
      );
      speechConfig.speechRecognitionLanguage = locale;

      // Configure pronunciation assessment
      const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
        referenceText || '',
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true // Enable miscue detection
      );

      // Set phoneme alphabet to IPA for international users
      pronunciationConfig.phonemeAlphabet = phonemeAlphabet;

      // Enable additional assessments for unscripted speech
      if (!referenceText) {
        pronunciationConfig.enableProsodyAssessment = enableProsody;
        // Note: Content assessment may require specific API version
      }

      // Create audio config from buffer
      const audioConfig = this.createAudioConfigFromBuffer(audio);
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      // Apply pronunciation assessment configuration
      pronunciationConfig.applyTo(recognizer);

      // Run recognition
      const result = await this.recognizeOnceAsync(recognizer);

      // Clean up
      recognizer.close();
      speechConfig.close();

      endTimer();
      return result;
    } catch (error) {
      endTimer();

      if (error instanceof AudioProcessingError) {
        throw error;
      }

      throw new ExternalServiceError(
        'Azure Speech',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private createAudioConfigFromBuffer(audio: Buffer): sdk.AudioConfig {
    // Create a push stream for the audio data
    const pushStream = sdk.AudioInputStream.createPushStream(
      sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1) // 16kHz, 16-bit, mono
    );

    // Write the audio data (skip WAV header if present)
    const audioData = this.stripWavHeader(audio);
    // Convert Buffer to Uint8Array then to ArrayBuffer for the SDK
    const uint8Array = new Uint8Array(audioData);
    pushStream.write(uint8Array.buffer as ArrayBuffer);
    pushStream.close();

    return sdk.AudioConfig.fromStreamInput(pushStream);
  }

  private stripWavHeader(buffer: Buffer): Buffer {
    // WAV files start with "RIFF"
    if (buffer.length > 44 && buffer.toString('ascii', 0, 4) === 'RIFF') {
      // Find the data chunk
      let offset = 12; // Skip RIFF header
      while (offset < buffer.length - 8) {
        const chunkId = buffer.toString('ascii', offset, offset + 4);
        const chunkSize = buffer.readUInt32LE(offset + 4);

        if (chunkId === 'data') {
          return buffer.slice(offset + 8, offset + 8 + chunkSize);
        }
        offset += 8 + chunkSize;
      }
    }
    // Return as-is if not a WAV file or no data chunk found
    return buffer;
  }

  private recognizeOnceAsync(recognizer: sdk.SpeechRecognizer): Promise<PronunciationResult> {
    return new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            try {
              const pronunciationResult = this.parseResult(result);
              resolve(pronunciationResult);
            } catch (parseError) {
              reject(new AudioProcessingError(
                `Failed to parse pronunciation result: ${parseError instanceof Error ? parseError.message : String(parseError)}`
              ));
            }
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            reject(new AudioProcessingError(
              'No speech could be recognized. Please speak clearly and try again.'
            ));
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cancellation = sdk.CancellationDetails.fromResult(result);
            reject(new ExternalServiceError(
              'Azure Speech',
              new Error(`Recognition canceled: ${cancellation.reason} - ${cancellation.errorDetails}`)
            ));
          } else {
            reject(new AudioProcessingError(`Unexpected result reason: ${result.reason}`));
          }
        },
        (error: string) => {
          reject(new ExternalServiceError('Azure Speech', new Error(error)));
        }
      );
    });
  }

  private parseResult(result: sdk.SpeechRecognitionResult): PronunciationResult {
    // Get pronunciation assessment result
    const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);

    // Parse detailed results from JSON
    const detailJson = result.properties.getProperty(
      sdk.PropertyId.SpeechServiceResponse_JsonResult
    );

    let words: WordAnalysis[] = [];
    let problemSounds: string[] = [];

    if (detailJson) {
      try {
        const detail = JSON.parse(detailJson);
        const nBest = detail.NBest?.[0];

        if (nBest?.Words) {
          words = this.parseWords(nBest.Words);
          problemSounds = this.identifyProblemSounds(words);
        }
      } catch (e) {
        logger.warn('Failed to parse detailed pronunciation results', {
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }

    return {
      overallScore: pronunciationResult.pronunciationScore || 0,
      accuracyScore: pronunciationResult.accuracyScore || 0,
      fluencyScore: pronunciationResult.fluencyScore || 0,
      prosodyScore: pronunciationResult.prosodyScore || 0,
      completenessScore: pronunciationResult.completenessScore || 0,
      transcript: result.text || '',
      words,
      problemSounds,
    };
  }

  private parseWords(azureWords: AzureWordResult[]): WordAnalysis[] {
    return azureWords.map((word) => ({
      word: word.Word,
      accuracyScore: word.PronunciationAssessment?.AccuracyScore || 0,
      errorType: this.mapErrorType(word.PronunciationAssessment?.ErrorType),
      phonemes: this.parsePhonemes(word.Phonemes || []),
    }));
  }

  private parsePhonemes(azurePhonemes: AzurePhonemeResult[]): PhonemeAnalysis[] {
    return azurePhonemes.map((phoneme) => ({
      phoneme: phoneme.Phoneme,
      accuracyScore: phoneme.PronunciationAssessment?.AccuracyScore || 0,
      offset: phoneme.Offset,
      duration: phoneme.Duration,
    }));
  }

  private mapErrorType(
    errorType?: string
  ): 'mispronunciation' | 'omission' | 'insertion' | 'none' {
    switch (errorType?.toLowerCase()) {
      case 'mispronunciation':
        return 'mispronunciation';
      case 'omission':
        return 'omission';
      case 'insertion':
        return 'insertion';
      default:
        return 'none';
    }
  }

  private identifyProblemSounds(words: WordAnalysis[]): string[] {
    const problemPhonemes = new Set<string>();

    for (const word of words) {
      for (const phoneme of word.phonemes) {
        // Consider phonemes with accuracy below 70 as problematic
        if (phoneme.accuracyScore < 70) {
          problemPhonemes.add(phoneme.phoneme);
        }
      }
    }

    return Array.from(problemPhonemes);
  }
}
