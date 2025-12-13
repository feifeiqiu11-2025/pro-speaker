/**
 * Chat modes for different conversation styles
 */
export type ChatMode = 'free_talk' | 'reflective' | 'professional';

/**
 * Message role in conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Pronunciation feedback for user messages
 */
export interface PronunciationFeedback {
  overallScore: number;
  mispronounced: Array<{
    word: string;
    score: number;
    suggestion: string;
    position: number;
  }>;
  fillerWords: {
    count: number;
    breakdown: Record<string, number>;
  };
  pace: {
    wpm: number;
    assessment: 'too_slow' | 'good' | 'slightly_fast' | 'too_fast';
  };
}

/**
 * Inline coaching tip from AI
 */
export interface InlineCoaching {
  type: 'pronunciation' | 'communication' | 'encouragement';
  tip: string;
}

/**
 * A single message in the conversation
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: number;

  // User message metadata
  pronunciation?: PronunciationFeedback;
  durationMs?: number;

  // Assistant message metadata
  inlineCoaching?: InlineCoaching;
}

/**
 * Summary generated at end of conversation
 */
export interface ConversationSummary {
  // Scores (0-100)
  pronunciationScore: number;
  clarityScore: number;
  fluencyScore: number;
  overallScore: number;

  // Pronunciation details
  pronunciationNotes: Array<{
    word: string;
    suggestion: string;
    occurrences: number;
  }>;

  // Communication analysis
  communicationAnalysis: {
    fillerWords: {
      total: number;
      breakdown: Record<string, number>;
      suggestion: string;
    };
    pace: {
      averageWpm: number;
      assessment: string;
      suggestion: string;
    };
    structure: {
      score: number;
      feedback: string;
    };
  };

  // MBTI-style insight
  communicationStyle: {
    observation: string;
    styleIndicator?: string;
    suggestion: string;
  };

  // Actionable takeaway
  coachingTip: string;

  // Strengths observed
  strengths: string[];
}

// ============================================================
// WEBSOCKET EVENT TYPES
// ============================================================

/**
 * Payload for chat:start event
 */
export interface ChatStartPayload {
  mode: ChatMode;
  userId?: string;
}

/**
 * Payload for chat:audio event
 */
export interface ChatAudioPayload {
  conversationId: string;
  audio: string; // Base64 encoded WAV
}

/**
 * Payload for chat:end event
 */
export interface ChatEndPayload {
  conversationId: string;
}

/**
 * Response from chat:started event
 */
export interface ChatStartResponse {
  conversationId: string;
  greeting: {
    text: string;
    audioBase64: string;
  };
}

/**
 * Response from chat:turn event
 */
export interface ChatTurnResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  audioBase64: string;
}

/**
 * Response from chat:summary event
 */
export interface ChatSummaryResponse {
  conversationId: string;
  summary: ConversationSummary;
}

/**
 * Error response from chat:error event
 */
export interface ChatErrorResponse {
  code: string;
  message: string;
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

/**
 * Chat Stack Navigator param list
 */
export type ChatStackParamList = {
  ChatMain: undefined;
  ChatSummary: { summary: ConversationSummary };
};
