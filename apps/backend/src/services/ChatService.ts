import { v4 as uuidv4 } from 'uuid';
import type { Result } from '../shared/types/index.js';
import type { ISpeechAnalyzer } from '../domain/interfaces/index.js';
import type { IChatConversationManager } from '../domain/interfaces/IChatConversationManager.js';
import type { ITTSService } from '../domain/interfaces/ITTSService.js';
import type {
  Conversation,
  ChatMessage,
  ChatMode,
  ConversationSummary,
  ProcessTurnInput,
  ProcessTurnOutput,
  ChatServiceConfig,
  PronunciationFeedback,
} from '../shared/types/chat.js';
import { AppError, ExternalServiceError } from '../shared/errors/index.js';
import { logger } from '../shared/utils/logger.js';

// Filler words to detect
const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah',
  'like', 'you know', 'i mean',
  'so', 'basically', 'actually',
  'kind of', 'sort of',
  'right', 'okay', 'well',
];

const DEFAULT_CONFIG: ChatServiceConfig = {
  maxDurationSeconds: 120,
  maxTurns: 10,
  voiceId: 'en-US-JennyNeural',
};

/**
 * Chat Service - Orchestrates voice conversation with AI
 * Manages conversation state, speech analysis, and response generation
 */
export class ChatService {
  private conversations: Map<string, Conversation> = new Map();
  private config: ChatServiceConfig;

  constructor(
    private speechAnalyzer: ISpeechAnalyzer,
    private ttsService: ITTSService,
    private conversationManager: IChatConversationManager,
    config: Partial<ChatServiceConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================
  // START CONVERSATION
  // ============================================================

  async startConversation(
    mode: ChatMode,
    userId?: string
  ): Promise<Result<{ conversationId: string; greeting: { text: string; audioBase64: string } }>> {
    const endTimer = logger.time('ChatService.startConversation');

    try {
      const conversationId = uuidv4();

      // Generate greeting based on mode
      const greetingText = this.getGreeting(mode);

      // Synthesize greeting audio
      const audioResult = await this.ttsService.synthesize(greetingText, {
        voiceId: this.config.voiceId,
      });

      if (!audioResult.success) {
        endTimer();
        return { success: false, error: audioResult.error };
      }

      // Initialize conversation
      const conversation: Conversation = {
        id: conversationId,
        userId: userId || 'anonymous',
        mode,
        startedAt: Date.now(),
        durationSeconds: 0,
        messages: [
          {
            id: uuidv4(),
            conversationId,
            role: 'assistant',
            content: greetingText,
            timestamp: Date.now(),
          },
        ],
      };

      this.conversations.set(conversationId, conversation);

      endTimer();
      logger.info('Chat conversation started', { conversationId, mode, userId });

      return {
        success: true,
        data: {
          conversationId,
          greeting: {
            text: greetingText,
            audioBase64: audioResult.data.audioBase64,
          },
        },
      };
    } catch (error) {
      endTimer();
      logger.error('Failed to start conversation', { error });
      return {
        success: false,
        error: new ExternalServiceError(
          'ChatService',
          error instanceof Error ? error : new Error('Failed to start conversation')
        ),
      };
    }
  }

  // ============================================================
  // PROCESS USER TURN
  // ============================================================

  async processUserTurn(input: ProcessTurnInput): Promise<Result<ProcessTurnOutput>> {
    const endTimer = logger.time('ChatService.processUserTurn');

    try {
      const conversation = this.conversations.get(input.conversationId);
      if (!conversation) {
        endTimer();
        return { success: false, error: new AppError('Conversation not found', 'NOT_FOUND', 404) };
      }

      // Check turn limit
      const currentTurns = Math.floor(conversation.messages.length / 2);
      if (currentTurns >= this.config.maxTurns) {
        endTimer();
        return { success: false, error: new AppError('Maximum turns reached', 'MAX_TURNS_REACHED', 400) };
      }

      // Step 1: Decode audio and analyze pronunciation
      const audioBuffer = Buffer.from(input.audioBase64, 'base64');

      const speechResult = await this.speechAnalyzer.assessPronunciation(audioBuffer, {
        referenceText: null, // Unscripted mode
        enableProsody: true,
      });

      const transcript = speechResult.transcript;
      if (!transcript || transcript.trim().length === 0) {
        endTimer();
        return { success: false, error: new AppError('No speech detected', 'NO_SPEECH', 400) };
      }

      // Map pronunciation result to feedback format
      const pronunciation = this.mapPronunciationFeedback(speechResult, transcript);

      // Step 2: Generate AI response
      const aiResult = await this.conversationManager.generateResponse({
        mode: input.mode,
        conversationHistory: conversation.messages,
        userMessage: transcript,
        pronunciationContext: {
          mispronounced: pronunciation.mispronounced.map((w) => ({
            word: w.word,
            score: w.score,
          })),
          fillerCount: pronunciation.fillerWords.count,
        },
      });

      if (!aiResult.success) {
        endTimer();
        return { success: false, error: aiResult.error };
      }

      // Step 3: Synthesize AI response audio
      const ttsResult = await this.ttsService.synthesize(aiResult.data.response, {
        voiceId: this.config.voiceId,
      });

      if (!ttsResult.success) {
        endTimer();
        return { success: false, error: ttsResult.error };
      }

      // Step 4: Create and store messages
      const userMessage: ChatMessage = {
        id: uuidv4(),
        conversationId: input.conversationId,
        role: 'user',
        content: transcript,
        timestamp: Date.now(),
        pronunciation,
      };

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        conversationId: input.conversationId,
        role: 'assistant',
        content: aiResult.data.response,
        timestamp: Date.now(),
        inlineCoaching: aiResult.data.inlineCoaching,
      };

      conversation.messages.push(userMessage, assistantMessage);
      conversation.durationSeconds = Math.floor((Date.now() - conversation.startedAt) / 1000);

      endTimer();
      logger.info('Chat turn processed', {
        conversationId: input.conversationId,
        turnNumber: currentTurns + 1,
        transcriptLength: transcript.length,
      });

      return {
        success: true,
        data: {
          userTranscript: transcript,
          pronunciation,
          aiResponse: aiResult.data.response,
          aiAudioBase64: ttsResult.data.audioBase64,
          inlineCoaching: aiResult.data.inlineCoaching,
        },
      };
    } catch (error) {
      endTimer();
      logger.error('Failed to process user turn', { error, conversationId: input.conversationId });
      return {
        success: false,
        error: new ExternalServiceError(
          'ChatService',
          error instanceof Error ? error : new Error('Failed to process turn')
        ),
      };
    }
  }

  // ============================================================
  // END CONVERSATION & GENERATE SUMMARY
  // ============================================================

  async endConversation(conversationId: string): Promise<Result<ConversationSummary>> {
    const endTimer = logger.time('ChatService.endConversation');

    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        endTimer();
        return { success: false, error: new AppError('Conversation not found', 'NOT_FOUND', 404) };
      }

      conversation.endedAt = Date.now();
      conversation.durationSeconds = Math.floor(
        (conversation.endedAt - conversation.startedAt) / 1000
      );

      // Generate comprehensive summary
      const summaryResult = await this.conversationManager.generateSummary(conversation);

      if (!summaryResult.success) {
        endTimer();
        return { success: false, error: summaryResult.error };
      }

      conversation.summary = summaryResult.data;

      // TODO: Persist to database here
      // await this.conversationRepository.save(conversation);

      const turns = Math.floor(conversation.messages.length / 2);

      endTimer();
      logger.info('Chat conversation ended', {
        conversationId,
        durationSeconds: conversation.durationSeconds,
        turns,
        overallScore: summaryResult.data.overallScore,
      });

      // Clean up in-memory storage
      this.conversations.delete(conversationId);

      return { success: true, data: summaryResult.data };
    } catch (error) {
      endTimer();
      logger.error('Failed to end conversation', { error, conversationId });
      return {
        success: false,
        error: new ExternalServiceError(
          'ChatService',
          error instanceof Error ? error : new Error('Failed to generate summary')
        ),
      };
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Get conversation by ID (for debugging/status checks)
   */
  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Check if a conversation exists and is active
   */
  isConversationActive(conversationId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    // Check if within time limit
    const elapsed = (Date.now() - conversation.startedAt) / 1000;
    return elapsed < this.config.maxDurationSeconds;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; services: Record<string, boolean> }> {
    const [speech, tts, llm] = await Promise.all([
      this.speechAnalyzer.isReady(),
      this.ttsService.isReady(),
      this.conversationManager.isReady(),
    ]);

    return {
      healthy: speech && tts && llm,
      services: { speech, tts, llm },
    };
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  private getGreeting(mode: ChatMode): string {
    const greetings: Record<ChatMode, string> = {
      free_talk:
        "Hi! I'm here to help you practice speaking naturally. What's on your mind today?",
      reflective:
        "Hello! I'm here to help you think through something. What would you like to talk about?",
      professional:
        "Hi! Let's practice professional communication. What work situation would you like to discuss?",
    };
    return greetings[mode];
  }

  private mapPronunciationFeedback(
    result: {
      overallScore: number;
      words: Array<{
        word: string;
        accuracyScore: number;
        phonemes: Array<{ phoneme: string; accuracyScore: number }>;
      }>;
      transcript: string;
    },
    transcript: string
  ): PronunciationFeedback {
    // Find mispronounced words (accuracy < 70)
    const mispronounced = (result.words || [])
      .filter((w) => w.accuracyScore < 70)
      .map((w, index) => ({
        word: w.word,
        score: w.accuracyScore,
        suggestion: this.generatePronunciationSuggestion(w.word),
        position: index,
      }))
      .slice(0, 5); // Limit to top 5

    // Detect filler words
    const fillerAnalysis = this.detectFillerWords(transcript);

    // Calculate WPM (rough estimate: assume 30 seconds of speech)
    const wordCount = transcript.split(/\s+/).filter((w) => w.length > 0).length;
    const estimatedDurationSeconds = 15; // Rough estimate for a turn
    const wpm = Math.round((wordCount / estimatedDurationSeconds) * 60);

    return {
      overallScore: result.overallScore,
      mispronounced,
      fillerWords: fillerAnalysis,
      pace: {
        wpm,
        assessment: this.assessPace(wpm),
      },
    };
  }

  private generatePronunciationSuggestion(word: string): string {
    // Simple syllable-based suggestion
    // In a production system, this would use a pronunciation dictionary
    const syllables = this.approximateSyllables(word);
    return syllables.join('-');
  }

  private approximateSyllables(word: string): string[] {
    // Simple syllable approximation
    const vowels = 'aeiouy';
    const result: string[] = [];
    let current = '';
    let prevWasVowel = false;

    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);

      if (isVowel && !prevWasVowel && current.length > 0) {
        current += char;
        result.push(current.toUpperCase());
        current = '';
      } else {
        current += char;
      }
      prevWasVowel = isVowel;
    }

    if (current.length > 0) {
      if (result.length > 0) {
        result[result.length - 1] += current.toUpperCase();
      } else {
        result.push(current.toUpperCase());
      }
    }

    return result.length > 0 ? result : [word.toUpperCase()];
  }

  private detectFillerWords(transcript: string): { count: number; breakdown: Record<string, number> } {
    const lower = transcript.toLowerCase();
    const breakdown: Record<string, number> = {};
    let total = 0;

    for (const filler of FILLER_WORDS) {
      // Use word boundary matching
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches && matches.length > 0) {
        breakdown[filler] = matches.length;
        total += matches.length;
      }
    }

    return { count: total, breakdown };
  }

  private assessPace(wpm: number): 'too_slow' | 'good' | 'slightly_fast' | 'too_fast' {
    if (wpm < 100) return 'too_slow';
    if (wpm <= 150) return 'good';
    if (wpm <= 170) return 'slightly_fast';
    return 'too_fast';
  }
}
