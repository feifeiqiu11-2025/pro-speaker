import OpenAI from 'openai';
import type { ICommunicationAnalyzer, AnalysisContext } from '../../domain/interfaces/index.js';
import type { CommunicationResult, GrammarIssue } from '../../shared/types/index.js';
import { ExternalServiceError, ValidationError } from '../../shared/errors/index.js';
import { logger } from '../../shared/utils/logger.js';
import { getCommunicationAnalysisPrompt, getAnalysisUserPrompt } from './prompts.js';

interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

interface LLMResponse {
  filler_words: {
    total: number;
    breakdown: Record<string, number>;
  };
  pace: {
    wpm: number;
    assessment: 'too_slow' | 'good' | 'slightly_fast' | 'too_fast';
    suggestion?: string;
  };
  grammar_issues: Array<{
    original: string;
    corrected: string;
    type?: string;
    explanation?: string;
  }>;
  structure: {
    score: number;
    feedback: string;
  };
  polished_version: string;
  coaching_tip: string;
  strengths: string[];
}

/**
 * OpenAI-based communication analyzer
 */
export class OpenAICommunicationAnalyzer implements ICommunicationAnalyzer {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'gpt-4o';
  }

  async isReady(): Promise<boolean> {
    try {
      // Simple check - list models to verify API key works
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async analyze(
    transcript: string,
    context: AnalysisContext
  ): Promise<CommunicationResult> {
    const endTimer = logger.time('OpenAI communication analysis');

    if (!transcript || transcript.trim().length === 0) {
      throw new ValidationError('Transcript is empty');
    }

    try {
      const systemPrompt = getCommunicationAnalysisPrompt(context.mode);
      const userPrompt = getAnalysisUserPrompt(transcript, {
        mode: context.mode,
        promptText: context.promptText,
        nativeLanguage: context.nativeLanguage,
        profession: context.profession,
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = this.parseResponse(content);
      endTimer();

      return this.mapToResult(parsed);
    } catch (error) {
      endTimer();

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ExternalServiceError(
        'OpenAI',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private parseResponse(content: string): LLMResponse {
    try {
      const parsed = JSON.parse(content) as LLMResponse;

      // Validate required fields
      if (!parsed.filler_words || typeof parsed.filler_words.total !== 'number') {
        throw new Error('Missing or invalid filler_words');
      }
      if (!parsed.pace || typeof parsed.pace.wpm !== 'number') {
        throw new Error('Missing or invalid pace');
      }
      if (!Array.isArray(parsed.grammar_issues)) {
        throw new Error('Missing or invalid grammar_issues');
      }
      if (!parsed.structure || typeof parsed.structure.score !== 'number') {
        throw new Error('Missing or invalid structure');
      }
      if (typeof parsed.polished_version !== 'string') {
        throw new Error('Missing polished_version');
      }
      if (typeof parsed.coaching_tip !== 'string') {
        throw new Error('Missing coaching_tip');
      }
      if (!Array.isArray(parsed.strengths)) {
        throw new Error('Missing strengths');
      }

      return parsed;
    } catch (error) {
      logger.error('Failed to parse OpenAI response', {
        error: error instanceof Error ? error.message : String(error),
        content: content.substring(0, 500),
      });
      throw new Error(`Invalid response format: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private mapToResult(parsed: LLMResponse): CommunicationResult {
    return {
      fillerWords: {
        total: parsed.filler_words.total,
        breakdown: parsed.filler_words.breakdown,
      },
      pace: {
        wpm: parsed.pace.wpm,
        assessment: parsed.pace.assessment,
        suggestion: parsed.pace.suggestion,
      },
      grammarIssues: parsed.grammar_issues.map((issue): GrammarIssue => ({
        original: issue.original,
        corrected: issue.corrected,
        type: issue.type,
        explanation: issue.explanation,
      })),
      structure: {
        score: parsed.structure.score,
        feedback: parsed.structure.feedback,
      },
      polishedVersion: parsed.polished_version,
      coachingTip: parsed.coaching_tip,
      strengths: parsed.strengths,
    };
  }
}
