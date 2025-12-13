import OpenAI from 'openai';
import type { Result } from '../../shared/types/index.js';
import type { IChatConversationManager } from '../../domain/interfaces/index.js';
import type {
  ChatMessage,
  ChatMode,
  Conversation,
  ConversationSummary,
  GenerateResponseInput,
  GenerateResponseOutput,
} from '../../shared/types/chat.js';
import { ExternalServiceError } from '../../shared/errors/index.js';
import { logger } from '../../shared/utils/logger.js';

interface ChatConversationManagerConfig {
  apiKey: string;
  model?: string;
}

interface ConversationLLMResponse {
  response: string;
  coaching_tip?: string;
  coaching_type?: 'pronunciation' | 'communication' | 'encouragement';
}

interface SummaryLLMResponse {
  clarity_score: number;
  fluency_score: number;
  structure_score: number;
  structure_feedback: string;
  filler_suggestion: string;
  pace_suggestion: string;
  communication_observation: string;
  style_indicator?: string;
  communication_suggestion: string;
  coaching_tip: string;
  strengths: string[];
}

/**
 * GPT-4o based conversation manager for chat feature
 * Handles both conversational responses and summary generation
 */
export class ChatConversationManager implements IChatConversationManager {
  private client: OpenAI;
  private model: string;

  constructor(config: ChatConversationManagerConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gpt-4o';
  }

  async isReady(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================
  // GENERATE CONVERSATIONAL RESPONSE
  // ============================================================

  async generateResponse(
    input: GenerateResponseInput
  ): Promise<Result<GenerateResponseOutput>> {
    const endTimer = logger.time('ChatConversationManager.generateResponse');

    try {
      const systemPrompt = this.buildSystemPrompt(input.mode);
      const messages = this.buildMessages(input);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        endTimer();
        return {
          success: false,
          error: new ExternalServiceError('OpenAI', new Error('Empty response from GPT-4o')),
        };
      }

      const parsed = this.parseConversationResponse(content);
      endTimer();

      return {
        success: true,
        data: {
          response: parsed.response,
          inlineCoaching: parsed.coaching_tip
            ? {
                type: parsed.coaching_type || 'encouragement',
                tip: parsed.coaching_tip,
              }
            : undefined,
        },
      };
    } catch (error) {
      endTimer();
      logger.error('Failed to generate response', { error });
      return {
        success: false,
        error: new ExternalServiceError(
          'OpenAI',
          error instanceof Error ? error : new Error(String(error))
        ),
      };
    }
  }

  // ============================================================
  // GENERATE CONVERSATION SUMMARY
  // ============================================================

  async generateSummary(conversation: Conversation): Promise<Result<ConversationSummary>> {
    const endTimer = logger.time('ChatConversationManager.generateSummary');

    try {
      const userMessages = conversation.messages.filter((m) => m.role === 'user');
      const allText = userMessages.map((m) => m.content).join('\n\n');

      // Aggregate pronunciation data
      const allPronunciationScores = userMessages
        .map((m) => m.pronunciation?.overallScore || 0)
        .filter((s) => s > 0);

      const avgPronunciation =
        allPronunciationScores.length > 0
          ? allPronunciationScores.reduce((a, b) => a + b, 0) / allPronunciationScores.length
          : 75; // Default if no pronunciation data

      // Aggregate filler words
      const totalFillers = userMessages.reduce(
        (sum, m) => sum + (m.pronunciation?.fillerWords.count || 0),
        0
      );

      // Aggregate mispronounced words
      const allMispronounced = userMessages.flatMap(
        (m) => m.pronunciation?.mispronounced || []
      );

      // Group by word and count occurrences
      const wordOccurrences = allMispronounced.reduce((acc, item) => {
        const key = item.word.toLowerCase();
        if (!acc[key]) {
          acc[key] = { word: item.word, suggestion: item.suggestion, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, { word: string; suggestion: string; count: number }>);

      const pronunciationNotes = Object.values(wordOccurrences)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => ({
          word: item.word,
          suggestion: item.suggestion,
          occurrences: item.count,
        }));

      // Calculate average WPM
      const allWpm = userMessages
        .map((m) => m.pronunciation?.pace.wpm || 0)
        .filter((w) => w > 0);
      const avgWpm =
        allWpm.length > 0
          ? Math.round(allWpm.reduce((a, b) => a + b, 0) / allWpm.length)
          : 140; // Default

      // Generate communication analysis via GPT-4o
      const analysisPrompt = this.buildSummaryPrompt(conversation, allText);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: analysisPrompt.system },
          { role: 'user', content: analysisPrompt.user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        endTimer();
        return {
          success: false,
          error: new ExternalServiceError('OpenAI', new Error('Empty summary from GPT-4o')),
        };
      }

      const analysis = this.parseSummaryResponse(content);
      endTimer();

      const summary: ConversationSummary = {
        pronunciationScore: Math.round(avgPronunciation),
        clarityScore: analysis.clarity_score || 75,
        fluencyScore: analysis.fluency_score || 75,
        overallScore: Math.round(
          avgPronunciation * 0.3 +
            (analysis.clarity_score || 75) * 0.35 +
            (analysis.fluency_score || 75) * 0.35
        ),
        pronunciationNotes,
        communicationAnalysis: {
          fillerWords: {
            total: totalFillers,
            breakdown: this.aggregateFillerBreakdown(userMessages),
            suggestion: analysis.filler_suggestion || 'Try pausing instead of using filler words.',
          },
          pace: {
            averageWpm: avgWpm,
            assessment: this.assessPaceText(avgWpm),
            suggestion: analysis.pace_suggestion || '',
          },
          structure: {
            score: analysis.structure_score || 70,
            feedback: analysis.structure_feedback || '',
          },
        },
        communicationStyle: {
          observation: analysis.communication_observation || '',
          styleIndicator: analysis.style_indicator,
          suggestion: analysis.communication_suggestion || '',
        },
        coachingTip: analysis.coaching_tip || '',
        strengths: analysis.strengths || [],
      };

      return { success: true, data: summary };
    } catch (error) {
      endTimer();
      logger.error('Failed to generate summary', { error });
      return {
        success: false,
        error: new ExternalServiceError(
          'OpenAI',
          error instanceof Error ? error : new Error(String(error))
        ),
      };
    }
  }

  // ============================================================
  // PROMPT BUILDERS
  // ============================================================

  private buildSystemPrompt(mode: ChatMode): string {
    const basePrompt = `You are a friendly AI conversation coach helping non-native English speakers improve their communication skills.

Your goals:
1. Keep the conversation flowing naturally with relevant follow-up questions
2. Be genuinely interested and supportive
3. Occasionally provide brief, helpful communication tips (but don't overdo it - maybe 1 in 3 responses)
4. Adapt to the user's pace and comfort level

IMPORTANT: Respond conversationally, not like a teacher. Keep responses concise (2-3 sentences typically).

Based on the conversation, you may occasionally notice communication patterns related to personality types (like MBTI framework). If you notice a strong pattern, you can gently suggest adjustments, but frame it positively and naturally.

You MUST respond in valid JSON format:
{
  "response": "Your conversational response here",
  "coaching_tip": "Optional brief tip if relevant, or null if not needed this turn",
  "coaching_type": "pronunciation | communication | encouragement"
}

Guidelines for coaching_tip:
- Only include about 30% of the time, when genuinely helpful
- Keep it brief (1 sentence max)
- Make it specific and actionable
- Never be condescending`;

    const modeAdditions: Record<ChatMode, string> = {
      free_talk: '\n\nMode: Free Talk - Let the user guide the topic. Be curious and engaged. Ask follow-up questions about whatever they want to discuss.',
      reflective:
        '\n\nMode: Reflective Thinking - Help the user think through their thoughts. Ask clarifying questions. Help them organize their ideas and see different perspectives.',
      professional:
        '\n\nMode: Professional Communication - Focus on workplace scenarios. Help with clear, confident, professional expression. Practice meeting updates, presentations, difficult conversations.',
    };

    return basePrompt + modeAdditions[mode];
  }

  private buildMessages(
    input: GenerateResponseInput
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    // Convert conversation history to OpenAI format
    const messages = input.conversationHistory
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Add current user message with pronunciation context if relevant
    let userContent = input.userMessage;

    // Add subtle context about pronunciation issues (AI doesn't announce this)
    if (input.pronunciationContext?.mispronounced && input.pronunciationContext.mispronounced.length > 0) {
      const words = input.pronunciationContext.mispronounced
        .slice(0, 2)
        .map((w) => w.word)
        .join(', ');
      userContent += `\n\n[Internal context - user had some difficulty pronouncing: ${words}. Consider a gentle tip if natural.]`;
    }

    messages.push({ role: 'user', content: userContent });

    return messages;
  }

  private buildSummaryPrompt(
    conversation: Conversation,
    userText: string
  ): { system: string; user: string } {
    const system = `You are an expert communication coach analyzing a conversation between a non-native English speaker and an AI assistant. Provide detailed but constructive feedback.

Consider:
1. Communication clarity and how well they expressed their thoughts
2. Fluency and natural expression patterns
3. Any patterns that suggest communication style preferences (use MBTI as a loose framework - T/F for direct vs empathetic, J/P for structured vs spontaneous)
4. Strengths to encourage and build confidence
5. One specific, actionable improvement they can work on

Be encouraging but honest. Focus on what they did well while identifying one area for growth.

You MUST respond in valid JSON format:
{
  "clarity_score": 0-100,
  "fluency_score": 0-100,
  "structure_score": 0-100,
  "structure_feedback": "Brief feedback on how they organized their thoughts",
  "filler_suggestion": "Specific advice about filler words if applicable",
  "pace_suggestion": "Advice about speaking pace if relevant",
  "communication_observation": "What you noticed about their communication style - be specific and positive",
  "style_indicator": "Optional: T-type, F-type, J-type, P-type if clearly evident, otherwise null",
  "communication_suggestion": "How they might adapt when speaking with different types of people",
  "coaching_tip": "ONE specific, actionable tip for improvement - make it concrete and achievable",
  "strengths": ["strength1", "strength2", "strength3"]
}`;

    const user = `Analyze this ${conversation.mode.replace('_', ' ')} conversation:

Duration: ${conversation.durationSeconds} seconds
Number of exchanges: ${Math.floor(conversation.messages.length / 2)}

USER'S MESSAGES (what they said):
---
${userText}
---

Please provide your analysis focusing on their communication effectiveness and style.`;

    return { system, user };
  }

  // ============================================================
  // RESPONSE PARSERS
  // ============================================================

  private parseConversationResponse(content: string): ConversationLLMResponse {
    try {
      const parsed = JSON.parse(content);

      if (!parsed.response || typeof parsed.response !== 'string') {
        throw new Error('Missing or invalid response field');
      }

      return {
        response: parsed.response,
        coaching_tip: parsed.coaching_tip || undefined,
        coaching_type: parsed.coaching_type || undefined,
      };
    } catch (error) {
      logger.error('Failed to parse conversation response', {
        error: error instanceof Error ? error.message : String(error),
        content: content.substring(0, 500),
      });
      // Return a fallback response
      return {
        response: "I understand. Could you tell me more about that?",
      };
    }
  }

  private parseSummaryResponse(content: string): SummaryLLMResponse {
    try {
      const parsed = JSON.parse(content);

      // Provide defaults for any missing fields
      return {
        clarity_score: parsed.clarity_score ?? 75,
        fluency_score: parsed.fluency_score ?? 75,
        structure_score: parsed.structure_score ?? 70,
        structure_feedback: parsed.structure_feedback ?? 'Good effort expressing your thoughts.',
        filler_suggestion: parsed.filler_suggestion ?? 'Try pausing instead of using filler words.',
        pace_suggestion: parsed.pace_suggestion ?? '',
        communication_observation: parsed.communication_observation ?? 'You communicated your ideas clearly.',
        style_indicator: parsed.style_indicator,
        communication_suggestion: parsed.communication_suggestion ?? '',
        coaching_tip: parsed.coaching_tip ?? 'Keep practicing natural conversation!',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Good effort', 'Clear communication'],
      };
    } catch (error) {
      logger.error('Failed to parse summary response', {
        error: error instanceof Error ? error.message : String(error),
        content: content.substring(0, 500),
      });
      // Return defaults
      return {
        clarity_score: 75,
        fluency_score: 75,
        structure_score: 70,
        structure_feedback: 'Good effort expressing your thoughts.',
        filler_suggestion: 'Try pausing instead of using filler words.',
        pace_suggestion: '',
        communication_observation: 'You communicated your ideas during the conversation.',
        communication_suggestion: '',
        coaching_tip: 'Keep practicing natural conversation!',
        strengths: ['Engaged in conversation', 'Expressed thoughts clearly'],
      };
    }
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private aggregateFillerBreakdown(messages: ChatMessage[]): Record<string, number> {
    const result: Record<string, number> = {};
    messages.forEach((m) => {
      const breakdown = m.pronunciation?.fillerWords.breakdown || {};
      Object.entries(breakdown).forEach(([word, count]) => {
        result[word] = (result[word] || 0) + count;
      });
    });
    return result;
  }

  private assessPaceText(wpm: number): string {
    if (wpm < 100) return 'A bit slow - try speaking with more energy';
    if (wpm <= 150) return 'Good pace - clear and easy to follow';
    if (wpm <= 170) return 'Slightly fast - consider slowing down for clarity';
    return 'Too fast - slow down to be better understood';
  }
}
