/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Session modes
 */
export type SessionMode = 'free_talk' | 'professional' | 'casual' | 'read_aloud' | 'read_practice';

/**
 * Pronunciation result from Azure Speech
 */
export interface PronunciationResult {
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  prosodyScore: number;
  completenessScore: number;
  transcript: string;
  words: WordAnalysis[];
  problemSounds: string[];
}

export interface WordAnalysis {
  word: string;
  accuracyScore: number;
  errorType?: 'mispronunciation' | 'omission' | 'insertion' | 'none';
  phonemes: PhonemeAnalysis[];
}

export interface PhonemeAnalysis {
  phoneme: string;
  accuracyScore: number;
  expected?: string;
  offset?: number;
  duration?: number;
}

/**
 * Communication analysis result from LLM
 */
export interface CommunicationResult {
  fillerWords: {
    total: number;
    breakdown: Record<string, number>;
  };
  pace: {
    wpm: number;
    assessment: 'too_slow' | 'good' | 'slightly_fast' | 'too_fast';
    suggestion?: string;
  };
  grammarIssues: GrammarIssue[];
  structure: {
    score: number;
    feedback: string;
  };
  polishedVersion: string;
  coachingTip: string;
  strengths: string[];
}

export interface GrammarIssue {
  original: string;
  corrected: string;
  type?: string;
  explanation?: string;
}

/**
 * Combined session analysis
 */
export interface SessionAnalysis {
  sessionId: string;
  mode: SessionMode;
  duration: number;
  transcript: string;
  pronunciation: PronunciationResult;
  communication: CommunicationResult;
  overallScore: number;
  createdAt: Date;
}

/**
 * Streaming update during recording
 */
export interface StreamingUpdate {
  type: 'interim' | 'final';
  transcript: string;
  fillerCount: number;
  currentPaceWpm: number;
  timestamp: number;
}
