import { z } from 'zod';

// ============================================================
// ENUMS & CONSTANTS
// ============================================================

export const ChatMode = {
  FREE_TALK: 'free_talk',
  REFLECTIVE: 'reflective',
  PROFESSIONAL: 'professional',
} as const;

export type ChatMode = (typeof ChatMode)[keyof typeof ChatMode];

export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

// ============================================================
// CORE TYPES
// ============================================================

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

export interface InlineCoaching {
  type: 'pronunciation' | 'communication' | 'encouragement';
  tip: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  audioUrl?: string;
  timestamp: number;

  // User message metadata
  pronunciation?: PronunciationFeedback;
  durationMs?: number;

  // Assistant message metadata
  inlineCoaching?: InlineCoaching;
}

export interface Conversation {
  id: string;
  userId: string;
  mode: ChatMode;
  startedAt: number;
  endedAt?: number;
  durationSeconds: number;
  messages: ChatMessage[];
  summary?: ConversationSummary;
}

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
// WEBSOCKET EVENT PAYLOADS (Zod Schemas)
// ============================================================

export const chatStartSchema = z.object({
  mode: z.enum(['free_talk', 'reflective', 'professional']).default('free_talk'),
  userId: z.string().optional(),
});

export type ChatStartPayload = z.infer<typeof chatStartSchema>;

export const chatAudioSchema = z.object({
  conversationId: z.string().min(1),
  audio: z.string().min(1), // Base64 encoded WAV
});

export type ChatAudioPayload = z.infer<typeof chatAudioSchema>;

export const chatEndSchema = z.object({
  conversationId: z.string().min(1),
});

export type ChatEndPayload = z.infer<typeof chatEndSchema>;

// ============================================================
// WEBSOCKET RESPONSE TYPES
// ============================================================

export interface ChatStartResponse {
  conversationId: string;
  greeting: {
    text: string;
    audioBase64: string;
  };
}

export interface ChatTurnResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  audioBase64: string;
}

export interface ChatSummaryResponse {
  conversationId: string;
  summary: ConversationSummary;
}

export interface ChatErrorResponse {
  code: string;
  message: string;
}

// ============================================================
// SERVICE TYPES
// ============================================================

export interface ChatServiceConfig {
  maxDurationSeconds: number;
  maxTurns: number;
  voiceId: string;
}

export interface ProcessTurnInput {
  conversationId: string;
  audioBase64: string;
  mode: ChatMode;
}

export interface ProcessTurnOutput {
  userTranscript: string;
  pronunciation: PronunciationFeedback;
  aiResponse: string;
  aiAudioBase64: string;
  inlineCoaching?: InlineCoaching;
}

// ============================================================
// CONVERSATION MANAGER TYPES
// ============================================================

export interface GenerateResponseInput {
  mode: ChatMode;
  conversationHistory: ChatMessage[];
  userMessage: string;
  pronunciationContext?: {
    mispronounced?: Array<{ word: string; score: number }>;
    fillerCount?: number;
  };
}

export interface GenerateResponseOutput {
  response: string;
  inlineCoaching?: InlineCoaching;
}
