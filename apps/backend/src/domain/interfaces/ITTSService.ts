import type { Result } from '../../shared/types/index.js';

/**
 * Options for text-to-speech synthesis
 */
export interface TTSSynthesizeOptions {
  /**
   * Voice ID to use (e.g., 'en-US-JennyNeural')
   */
  voiceId?: string;

  /**
   * Speech rate adjustment (-100% to 100%)
   */
  rate?: number;

  /**
   * Pitch adjustment (-100% to 100%)
   */
  pitch?: number;
}

/**
 * Result of TTS synthesis
 */
export interface TTSSynthesizeResult {
  /**
   * Base64 encoded audio
   */
  audioBase64: string;

  /**
   * Duration of audio in milliseconds
   */
  durationMs: number;
}

/**
 * Interface for Text-to-Speech service
 */
export interface ITTSService {
  /**
   * Synthesize text to speech
   * @param text Text to synthesize
   * @param options Synthesis options
   * @returns Audio buffer as base64 and duration
   */
  synthesize(
    text: string,
    options?: TTSSynthesizeOptions
  ): Promise<Result<TTSSynthesizeResult>>;

  /**
   * Check if the TTS service is ready
   */
  isReady(): Promise<boolean>;
}
