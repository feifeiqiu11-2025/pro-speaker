/**
 * Session modes supported by the app
 */
export type SessionMode = 'free_talk' | 'professional' | 'casual' | 'read_aloud';

/**
 * Real-time update from streaming session
 */
export interface SessionUpdate {
  type: 'interim' | 'final';
  transcript: string;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  wordCount: number;
  wpm: number;
  durationMs: number;
  pronunciationScore?: number;
  words?: Array<{ word: string; accuracy: number }>;
  timestamp: number;
}

/**
 * Final session result after analysis
 */
export interface SessionResult {
  transcript: string;
  duration: number;
  wordCount: number;
  wpm: number;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  communication?: CommunicationResult;
  error?: string;
}

/**
 * Communication analysis result from OpenAI
 */
export interface CommunicationResult {
  fillerWords: {
    count: number;
    instances: string[];
    suggestion: string;
  };
  pace: {
    wordsPerMinute: number;
    assessment: 'too_slow' | 'good' | 'too_fast';
    suggestion: string;
  };
  grammar: {
    issueCount: number;
    issues: Array<{
      original: string;
      corrected: string;
      explanation: string;
    }>;
  };
  structure: {
    score: number;
    assessment: string;
    suggestion: string;
  };
  polishedVersion: string;
  coachingTip: string;
  strengths: string[];
}

/**
 * Daily prompt for speaking practice
 */
export interface DailyPrompt {
  id: string;
  mode: SessionMode;
  title: string;
  prompt: string;
  hints: string[];
  category: string;
}

/**
 * App navigation param list
 */
export type RootStackParamList = {
  Home: undefined;
  Recording: { mode: SessionMode; prompt?: DailyPrompt };
  Feedback: { result: SessionResult };
};
