import type { CommunicationResult, SessionMode } from '../../shared/types/index.js';

/**
 * Analysis context for communication feedback
 */
export interface AnalysisContext {
  /**
   * Session mode affects feedback style
   */
  mode: SessionMode;

  /**
   * The prompt/topic user was responding to
   */
  promptText?: string;

  /**
   * User's native language (for targeted feedback)
   */
  nativeLanguage?: string;

  /**
   * User's profession (for context-aware suggestions)
   */
  profession?: string;
}

/**
 * Communication analyzer interface - abstraction for LLM-based analysis
 * Implementations: OpenAICommunicationAnalyzer, MockCommunicationAnalyzer
 */
export interface ICommunicationAnalyzer {
  /**
   * Analyze transcript for communication quality
   * @param transcript The transcribed speech text
   * @param context Analysis context (mode, prompt, etc.)
   * @returns Communication analysis result
   */
  analyze(
    transcript: string,
    context: AnalysisContext
  ): Promise<CommunicationResult>;

  /**
   * Check if the analyzer is properly configured and ready
   */
  isReady(): Promise<boolean>;
}
