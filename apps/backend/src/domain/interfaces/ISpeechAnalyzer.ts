import type { PronunciationResult } from '../../shared/types/index.js';

/**
 * Assessment options for pronunciation analysis
 */
export interface AssessmentOptions {
  /**
   * Reference text for read-aloud mode (null for free speech)
   */
  referenceText?: string | null;

  /**
   * Target language/locale
   */
  locale?: string;

  /**
   * Phoneme alphabet (IPA recommended for international users)
   */
  phonemeAlphabet?: 'IPA' | 'SAPI';

  /**
   * Enable prosody (rhythm, intonation) assessment
   */
  enableProsody?: boolean;

  /**
   * Enable content assessment (grammar, vocabulary)
   */
  enableContent?: boolean;
}

/**
 * Speech analyzer interface - abstraction for pronunciation assessment
 * Implementations: AzureSpeechAnalyzer, MockSpeechAnalyzer (for testing)
 */
export interface ISpeechAnalyzer {
  /**
   * Analyze pronunciation from audio buffer
   * @param audio Audio buffer (WAV format recommended)
   * @param options Assessment options
   * @returns Pronunciation analysis result
   */
  assessPronunciation(
    audio: Buffer,
    options?: AssessmentOptions
  ): Promise<PronunciationResult>;

  /**
   * Check if the analyzer is properly configured and ready
   */
  isReady(): Promise<boolean>;
}
