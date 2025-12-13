/**
 * Session modes supported by the app
 */
export type SessionMode = 'free_talk' | 'professional' | 'casual' | 'read_aloud' | 'read_practice';

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
 * News article from backend
 */
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  category: string;
  published_at: string;
  image_url?: string;
  reading_time_minutes: number;
}

/**
 * Bottom Tab Navigator param list
 */
export type TabParamList = {
  SpeakTab: undefined;
  ListenReadTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

/**
 * Speak Stack Navigator param list
 */
export type SpeakStackParamList = {
  SpeakHome: undefined;
  Recording: { mode: SessionMode; prompt?: DailyPrompt };
  Feedback: { result: SessionResult };
};

/**
 * Listen & Read Stack Navigator param list
 */
export type ListenReadStackParamList = {
  ListenReadHome: undefined;
  ArticleDetail: { article: NewsArticle };
  Recording: { mode: SessionMode; prompt?: DailyPrompt };
  Feedback: { result: SessionResult };
};

/**
 * Root Stack param list (for legacy support)
 * @deprecated Use TabParamList, SpeakStackParamList, or ListenReadStackParamList instead
 */
export type RootStackParamList = {
  Home: undefined;
  Recording: { mode: SessionMode; prompt?: DailyPrompt };
  Feedback: { result: SessionResult };
};
