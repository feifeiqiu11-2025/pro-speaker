import { v4 as uuid } from 'uuid';
import type { ISpeechAnalyzer, ICommunicationAnalyzer, AnalysisContext } from '../domain/interfaces/index.js';
import type {
  SessionAnalysis,
  SessionMode,
  PronunciationResult,
  CommunicationResult,
  Result,
} from '../shared/types/index.js';
import { ValidationError } from '../shared/errors/index.js';
import { logger } from '../shared/utils/logger.js';

interface AnalysisInput {
  audio: Buffer;
  mode: SessionMode;
  promptText?: string;
  referenceText?: string;
  nativeLanguage?: string;
  profession?: string;
}

/**
 * Main analysis service - orchestrates pronunciation and communication analysis
 */
export class AnalysisService {
  constructor(
    private speechAnalyzer: ISpeechAnalyzer,
    private communicationAnalyzer: ICommunicationAnalyzer
  ) {}

  /**
   * Perform full session analysis (pronunciation + communication)
   */
  async analyzeSession(input: AnalysisInput): Promise<Result<SessionAnalysis>> {
    const endTimer = logger.time('Full session analysis');

    // Validate input
    if (!input.audio || input.audio.length === 0) {
      return {
        success: false,
        error: new ValidationError('Audio is required'),
      };
    }

    try {
      // Run pronunciation assessment first to get transcript
      const pronunciationResult = await this.speechAnalyzer.assessPronunciation(
        input.audio,
        {
          referenceText: input.referenceText,
          enableProsody: true,
          enableContent: true,
        }
      );

      // Skip communication analysis if no transcript (e.g., silence)
      if (!pronunciationResult.transcript || pronunciationResult.transcript.trim().length === 0) {
        return {
          success: false,
          error: new ValidationError('No speech detected. Please speak clearly and try again.'),
        };
      }

      // Run communication analysis in parallel (already have transcript)
      const context: AnalysisContext = {
        mode: input.mode,
        promptText: input.promptText,
        nativeLanguage: input.nativeLanguage,
        profession: input.profession,
      };

      const communicationResult = await this.communicationAnalyzer.analyze(
        pronunciationResult.transcript,
        context
      );

      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        pronunciationResult,
        communicationResult,
        input.mode
      );

      // Calculate duration from audio (approximate - 16kHz, 16-bit, mono)
      const durationSeconds = Math.round(input.audio.length / (16000 * 2));

      const sessionAnalysis: SessionAnalysis = {
        sessionId: uuid(),
        mode: input.mode,
        duration: durationSeconds,
        transcript: pronunciationResult.transcript,
        pronunciation: pronunciationResult,
        communication: communicationResult,
        overallScore,
        createdAt: new Date(),
      };

      endTimer();

      return {
        success: true,
        data: sessionAnalysis,
      };
    } catch (error) {
      endTimer();
      logger.error('Analysis failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Analyze pronunciation only (faster, for real-time feedback)
   */
  async analyzePronunciationOnly(
    audio: Buffer,
    referenceText?: string
  ): Promise<Result<PronunciationResult>> {
    try {
      const result = await this.speechAnalyzer.assessPronunciation(audio, {
        referenceText,
        enableProsody: true,
      });

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Analyze communication only (from existing transcript)
   */
  async analyzeCommunicationOnly(
    transcript: string,
    context: AnalysisContext
  ): Promise<Result<CommunicationResult>> {
    try {
      const result = await this.communicationAnalyzer.analyze(transcript, context);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Calculate weighted overall score based on mode
   */
  private calculateOverallScore(
    pronunciation: PronunciationResult,
    communication: CommunicationResult,
    mode: SessionMode
  ): number {
    // Different weights based on mode
    const weights = this.getWeightsForMode(mode);

    const pronunciationComponent =
      (pronunciation.overallScore * weights.pronunciation) / 100;

    const fluencyComponent =
      (pronunciation.fluencyScore * weights.fluency) / 100;

    const structureComponent =
      (communication.structure.score * weights.structure) / 100;

    // Filler penalty (max 10 points off)
    const fillerPenalty = Math.min(communication.fillerWords.total * 2, 10);

    const rawScore =
      pronunciationComponent * 100 +
      fluencyComponent * 100 +
      structureComponent * 100 -
      fillerPenalty;

    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  private getWeightsForMode(mode: SessionMode): {
    pronunciation: number;
    fluency: number;
    structure: number;
  } {
    switch (mode) {
      case 'read_aloud':
        // Pronunciation mode - focus on pronunciation
        return { pronunciation: 0.7, fluency: 0.2, structure: 0.1 };

      case 'professional':
        // Professional - balanced with emphasis on structure
        return { pronunciation: 0.3, fluency: 0.3, structure: 0.4 };

      case 'casual':
        // Casual - focus on fluency and naturalness
        return { pronunciation: 0.3, fluency: 0.4, structure: 0.3 };

      case 'free_talk':
      default:
        // Free talk - balanced
        return { pronunciation: 0.35, fluency: 0.35, structure: 0.3 };
    }
  }

  /**
   * Check if services are ready
   */
  async healthCheck(): Promise<{ speech: boolean; communication: boolean }> {
    const [speechReady, communicationReady] = await Promise.all([
      this.speechAnalyzer.isReady(),
      this.communicationAnalyzer.isReady(),
    ]);

    return {
      speech: speechReady,
      communication: communicationReady,
    };
  }
}
