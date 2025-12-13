# ProSpeaker Chat Feature - Implementation Plan

> **Voice-to-Voice AI Conversation Coach**
> Real-time conversational practice with pronunciation and communication feedback

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Design](#2-architecture-design)
3. [Phase 1: Azure + GPT-4o (Turn-Based)](#3-phase-1-azure--gpt-4o-turn-based)
4. [Phase 2: OpenAI Realtime (Natural Conversation)](#4-phase-2-openai-realtime-natural-conversation)
5. [Data Schema](#5-data-schema)
6. [API Specifications](#6-api-specifications)
7. [Mobile Implementation](#7-mobile-implementation)
8. [Testing Strategy](#8-testing-strategy)
9. [Risks & Mitigations](#9-risks--mitigations)
10. [Cost Analysis](#10-cost-analysis)

---

## 1. Overview

### Feature Summary

The Chat feature enables users to have free-form voice conversations with an AI coach. Unlike the structured 1-minute workout, Chat provides:

- **Natural conversation practice** - Talk about anything on your mind
- **Real-time pronunciation feedback** - See mispronounced words as you speak
- **Communication coaching** - MBTI-informed style suggestions
- **Reflective thinking support** - Clarify thoughts through conversation

### User Flow

```
START → AI Greets (audio) → User holds-to-talk → User releases
    → AI thinks (1-2s) → AI responds (audio) → Repeat
    → END → Full Summary Report
```

### Technical Approach

| Phase | Tech Stack | Experience | Cost/Session |
|-------|------------|------------|--------------|
| Phase 1 | Azure STT + GPT-4o + Azure TTS | Turn-based (1-2s latency) | ~$0.12 |
| Phase 2 | OpenAI Realtime + Azure (parallel) | Phone-call style (~300ms) | ~$0.62 |

---

## 2. Architecture Design

### 2.1 Phase 1 Architecture (Turn-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            MOBILE APP                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ChatScreen                                                      │   │
│  │  ├── Hold-to-talk button                                        │   │
│  │  ├── Live transcript display                                     │   │
│  │  ├── Conversation history                                        │   │
│  │  └── Timer (2:00 countdown)                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                    WebSocket │ (Socket.IO)                              │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  WebSocket Handler (chat events)                                 │   │
│  │  ├── chat:start    → Initialize conversation                     │   │
│  │  ├── chat:audio    → Process user audio turn                     │   │
│  │  ├── chat:end      → Generate summary                            │   │
│  │  └── chat:error    → Error handling                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ChatService (Orchestrator)                                      │   │
│  │  ├── processUserTurn(audio) → transcript + pronunciation        │   │
│  │  ├── generateResponse(context) → AI response text               │   │
│  │  ├── synthesizeSpeech(text) → AI audio                          │   │
│  │  └── generateSummary(conversation) → Full report                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│         ┌────────────────────┼────────────────────┐                     │
│         ▼                    ▼                    ▼                     │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐            │
│  │ Azure STT   │    │ GPT-4o          │    │ Azure TTS   │            │
│  │ + Pronun.   │    │ Conversation    │    │ Neural      │            │
│  │ Assessment  │    │ + Coaching      │    │ Voice       │            │
│  └─────────────┘    └─────────────────┘    └─────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 System Design Principles

Following existing codebase patterns:

1. **Layered Architecture**
   - Domain: Pure TypeScript interfaces/types
   - Infrastructure: Azure, OpenAI adapters
   - Services: Business logic orchestration
   - API: Route handlers, WebSocket events

2. **Dependency Injection**
   - Services receive dependencies via constructor/factory
   - Enables testing with mocks

3. **Result Pattern**
   - No throwing exceptions in service layer
   - Return `Result<T, E>` for error handling

4. **Zod Validation**
   - All API/WebSocket inputs validated
   - Type-safe at runtime boundaries

5. **Event-Driven Real-Time**
   - Socket.IO for bidirectional communication
   - Clear event naming: `chat:start`, `chat:audio`, etc.

---

## 3. Phase 1: Azure + GPT-4o (Turn-Based)

### 3.1 Backend Implementation

#### 3.1.1 New Files Structure

```
apps/backend/src/
├── api/
│   ├── routes/
│   │   └── chat.ts                    # REST endpoints (history, summary)
│   └── websocket/
│       └── handlers/
│           └── chat.ts                # WebSocket event handlers
├── services/
│   └── ChatService.ts                 # Main orchestrator
├── infrastructure/
│   └── llm/
│       └── ChatConversationManager.ts # GPT-4o conversation logic
├── domain/
│   └── interfaces/
│       └── IConversationManager.ts    # Interface for conversation
└── shared/
    └── types/
        └── chat.ts                    # Chat-specific types
```

#### 3.1.2 Domain Types (`shared/types/chat.ts`)

```typescript
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

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  audioUrl?: string;           // For TTS playback
  timestamp: number;

  // User message metadata
  pronunciation?: PronunciationFeedback;
  durationMs?: number;

  // Assistant message metadata
  inlineCoaching?: InlineCoaching;
}

export interface PronunciationFeedback {
  overallScore: number;
  mispronounced: Array<{
    word: string;
    score: number;
    suggestion: string;        // e.g., "pre-zen-TAY-shun"
    position: number;          // Character position in transcript
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
    observation: string;        // "You communicate directly..."
    styleIndicator?: string;    // "T-type" (optional, not always shown)
    suggestion: string;         // "When speaking with F-types, try..."
  };

  // Actionable takeaway
  coachingTip: string;

  // Strengths observed
  strengths: string[];
}

// ============================================================
// WEBSOCKET EVENT PAYLOADS
// ============================================================

export const chatStartSchema = z.object({
  mode: z.enum(['free_talk', 'reflective', 'professional']).default('free_talk'),
  userId: z.string().uuid().optional(),
});

export type ChatStartPayload = z.infer<typeof chatStartSchema>;

export const chatAudioSchema = z.object({
  conversationId: z.string().uuid(),
  audio: z.string().min(1),    // Base64 encoded WAV
  isLastTurn: z.boolean().default(false),
});

export type ChatAudioPayload = z.infer<typeof chatAudioSchema>;

export const chatEndSchema = z.object({
  conversationId: z.string().uuid(),
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
  audioBase64: string;         // AI response audio
}

export interface ChatSummaryResponse {
  conversationId: string;
  summary: ConversationSummary;
}

// ============================================================
// SERVICE TYPES
// ============================================================

export interface ChatServiceConfig {
  maxDurationSeconds: number;  // 120 (2 minutes)
  maxTurns: number;            // 10
  voiceId: string;             // Azure TTS voice
}

export interface ProcessTurnInput {
  conversationId: string;
  audioBase64: string;
  conversationHistory: ChatMessage[];
  mode: ChatMode;
}

export interface ProcessTurnOutput {
  userTranscript: string;
  pronunciation: PronunciationFeedback;
  aiResponse: string;
  aiAudioBase64: string;
  inlineCoaching?: InlineCoaching;
}
```

#### 3.1.3 ChatService (`services/ChatService.ts`)

```typescript
import { v4 as uuidv4 } from 'uuid';
import { Result } from '../shared/types';
import {
  Conversation,
  ChatMessage,
  ChatMode,
  ConversationSummary,
  ProcessTurnInput,
  ProcessTurnOutput,
  ChatServiceConfig,
  PronunciationFeedback,
} from '../shared/types/chat';
import { ISpeechAnalyzer } from '../domain/interfaces/ISpeechAnalyzer';
import { ITTSService } from '../domain/interfaces/ITTSService';
import { IConversationManager } from '../domain/interfaces/IConversationManager';
import { AppError, ExternalServiceError } from '../shared/errors';
import { logger } from '../shared/utils/logger';

const DEFAULT_CONFIG: ChatServiceConfig = {
  maxDurationSeconds: 120,
  maxTurns: 10,
  voiceId: 'en-US-JennyNeural',
};

export class ChatService {
  private conversations: Map<string, Conversation> = new Map();
  private config: ChatServiceConfig;

  constructor(
    private speechAnalyzer: ISpeechAnalyzer,
    private ttsService: ITTSService,
    private conversationManager: IConversationManager,
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
    try {
      const conversationId = uuidv4();

      // Generate greeting based on mode
      const greetingText = this.getGreeting(mode);

      // Synthesize greeting audio
      const audioResult = await this.ttsService.synthesize(greetingText, {
        voiceId: this.config.voiceId,
      });

      if (!audioResult.success) {
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

      logger.info('Chat conversation started', { conversationId, mode });

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
      logger.error('Failed to start conversation', { error });
      return {
        success: false,
        error: new ExternalServiceError('Failed to start conversation'),
      };
    }
  }

  // ============================================================
  // PROCESS USER TURN
  // ============================================================

  async processUserTurn(input: ProcessTurnInput): Promise<Result<ProcessTurnOutput>> {
    try {
      const conversation = this.conversations.get(input.conversationId);
      if (!conversation) {
        return { success: false, error: new AppError('Conversation not found', 404) };
      }

      // Check limits
      if (conversation.messages.length >= this.config.maxTurns * 2) {
        return { success: false, error: new AppError('Maximum turns reached', 400) };
      }

      // Step 1: Transcribe and analyze pronunciation (Azure STT)
      const speechResult = await this.speechAnalyzer.analyzeWithPronunciation(
        input.audioBase64,
        null // Unscripted mode
      );

      if (!speechResult.success) {
        return { success: false, error: speechResult.error };
      }

      const { transcript, pronunciationAssessment } = speechResult.data;

      // Step 2: Generate AI response (GPT-4o)
      const aiResult = await this.conversationManager.generateResponse({
        mode: input.mode,
        conversationHistory: conversation.messages,
        userMessage: transcript,
        pronunciationContext: pronunciationAssessment,
      });

      if (!aiResult.success) {
        return { success: false, error: aiResult.error };
      }

      // Step 3: Synthesize AI response (Azure TTS)
      const ttsResult = await this.ttsService.synthesize(aiResult.data.response, {
        voiceId: this.config.voiceId,
      });

      if (!ttsResult.success) {
        return { success: false, error: ttsResult.error };
      }

      // Step 4: Create message records
      const userMessage: ChatMessage = {
        id: uuidv4(),
        conversationId: input.conversationId,
        role: 'user',
        content: transcript,
        timestamp: Date.now(),
        pronunciation: this.mapPronunciationFeedback(pronunciationAssessment),
      };

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        conversationId: input.conversationId,
        role: 'assistant',
        content: aiResult.data.response,
        timestamp: Date.now(),
        inlineCoaching: aiResult.data.inlineCoaching,
      };

      // Update conversation
      conversation.messages.push(userMessage, assistantMessage);
      conversation.durationSeconds = Math.floor(
        (Date.now() - conversation.startedAt) / 1000
      );

      logger.info('Chat turn processed', {
        conversationId: input.conversationId,
        turnNumber: Math.floor(conversation.messages.length / 2),
      });

      return {
        success: true,
        data: {
          userTranscript: transcript,
          pronunciation: userMessage.pronunciation!,
          aiResponse: aiResult.data.response,
          aiAudioBase64: ttsResult.data.audioBase64,
          inlineCoaching: aiResult.data.inlineCoaching,
        },
      };
    } catch (error) {
      logger.error('Failed to process user turn', { error, input });
      return {
        success: false,
        error: new ExternalServiceError('Failed to process turn'),
      };
    }
  }

  // ============================================================
  // END CONVERSATION & GENERATE SUMMARY
  // ============================================================

  async endConversation(conversationId: string): Promise<Result<ConversationSummary>> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        return { success: false, error: new AppError('Conversation not found', 404) };
      }

      conversation.endedAt = Date.now();
      conversation.durationSeconds = Math.floor(
        (conversation.endedAt - conversation.startedAt) / 1000
      );

      // Generate comprehensive summary via GPT-4o
      const summaryResult = await this.conversationManager.generateSummary(conversation);

      if (!summaryResult.success) {
        return { success: false, error: summaryResult.error };
      }

      conversation.summary = summaryResult.data;

      // TODO: Persist to database
      // await this.conversationRepository.save(conversation);

      logger.info('Chat conversation ended', {
        conversationId,
        durationSeconds: conversation.durationSeconds,
        turns: Math.floor(conversation.messages.length / 2),
      });

      // Clean up in-memory storage
      this.conversations.delete(conversationId);

      return { success: true, data: summaryResult.data };
    } catch (error) {
      logger.error('Failed to end conversation', { error, conversationId });
      return {
        success: false,
        error: new ExternalServiceError('Failed to generate summary'),
      };
    }
  }

  // ============================================================
  // HELPER METHODS
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

  private mapPronunciationFeedback(assessment: any): PronunciationFeedback {
    // Map Azure pronunciation assessment to our format
    const mispronounced = (assessment.words || [])
      .filter((w: any) => w.accuracy < 70)
      .map((w: any, index: number) => ({
        word: w.word,
        score: w.accuracy,
        suggestion: w.phonemeHint || w.word,
        position: index,
      }));

    return {
      overallScore: assessment.pronunciationScore || 0,
      mispronounced,
      fillerWords: {
        count: assessment.fillerCount || 0,
        breakdown: assessment.fillerBreakdown || {},
      },
      pace: {
        wpm: assessment.wpm || 0,
        assessment: this.assessPace(assessment.wpm || 0),
      },
    };
  }

  private assessPace(wpm: number): 'too_slow' | 'good' | 'slightly_fast' | 'too_fast' {
    if (wpm < 100) return 'too_slow';
    if (wpm <= 150) return 'good';
    if (wpm <= 170) return 'slightly_fast';
    return 'too_fast';
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; services: Record<string, boolean> }> {
    const [speech, tts, llm] = await Promise.all([
      this.speechAnalyzer.healthCheck(),
      this.ttsService.healthCheck(),
      this.conversationManager.healthCheck(),
    ]);

    return {
      healthy: speech && tts && llm,
      services: { speech, tts, llm },
    };
  }
}
```

#### 3.1.4 Conversation Manager with GPT-4o (`infrastructure/llm/ChatConversationManager.ts`)

```typescript
import OpenAI from 'openai';
import { Result } from '../../shared/types';
import {
  ChatMessage,
  ChatMode,
  ConversationSummary,
  Conversation,
  InlineCoaching,
} from '../../shared/types/chat';
import { IConversationManager } from '../../domain/interfaces/IConversationManager';
import { ExternalServiceError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';

interface GenerateResponseInput {
  mode: ChatMode;
  conversationHistory: ChatMessage[];
  userMessage: string;
  pronunciationContext?: any;
}

interface GenerateResponseOutput {
  response: string;
  inlineCoaching?: InlineCoaching;
}

export class ChatConversationManager implements IConversationManager {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  // ============================================================
  // GENERATE CONVERSATIONAL RESPONSE
  // ============================================================

  async generateResponse(
    input: GenerateResponseInput
  ): Promise<Result<GenerateResponseOutput>> {
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
        return { success: false, error: new ExternalServiceError('Empty response from GPT-4o') };
      }

      const parsed = JSON.parse(content);

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
      logger.error('Failed to generate response', { error });
      return { success: false, error: new ExternalServiceError('Failed to generate AI response') };
    }
  }

  // ============================================================
  // GENERATE CONVERSATION SUMMARY
  // ============================================================

  async generateSummary(conversation: Conversation): Promise<Result<ConversationSummary>> {
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
          : 0;

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
          : 0;

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
        return { success: false, error: new ExternalServiceError('Empty summary from GPT-4o') };
      }

      const analysis = JSON.parse(content);

      const summary: ConversationSummary = {
        pronunciationScore: Math.round(avgPronunciation),
        clarityScore: analysis.clarity_score || 75,
        fluencyScore: analysis.fluency_score || 75,
        overallScore: Math.round(
          (avgPronunciation * 0.3 + (analysis.clarity_score || 75) * 0.35 + (analysis.fluency_score || 75) * 0.35)
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
      logger.error('Failed to generate summary', { error });
      return { success: false, error: new ExternalServiceError('Failed to generate summary') };
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
3. Occasionally provide brief, helpful communication tips (but don't overdo it)
4. Adapt to the user's pace and comfort level

IMPORTANT: Respond conversationally, not like a teacher. Keep responses concise (2-3 sentences typically).

Based on the conversation, you may occasionally notice communication patterns related to personality types (like MBTI). If you notice a pattern, you can gently suggest adjustments, but frame it positively.

Respond in JSON format:
{
  "response": "Your conversational response here",
  "coaching_tip": "Optional brief tip if relevant (null if not needed)",
  "coaching_type": "pronunciation | communication | encouragement"
}`;

    const modeAdditions: Record<ChatMode, string> = {
      free_talk: '\n\nMode: Free Talk - Let the user guide the topic. Be curious and engaged.',
      reflective:
        '\n\nMode: Reflective Thinking - Help the user think through their thoughts. Ask clarifying questions. Help them organize their ideas.',
      professional:
        '\n\nMode: Professional Communication - Focus on workplace scenarios. Help with clear, confident, professional expression.',
    };

    return basePrompt + modeAdditions[mode];
  }

  private buildMessages(input: GenerateResponseInput): Array<{ role: 'user' | 'assistant'; content: string }> {
    // Convert conversation history to OpenAI format
    const messages = input.conversationHistory
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Add current user message with pronunciation context
    let userContent = input.userMessage;
    if (input.pronunciationContext?.mispronounced?.length > 0) {
      const mispronounced = input.pronunciationContext.mispronounced
        .slice(0, 2)
        .map((w: any) => w.word)
        .join(', ');
      userContent += `\n[Context: User had some difficulty with: ${mispronounced}]`;
    }

    messages.push({ role: 'user', content: userContent });

    return messages;
  }

  private buildSummaryPrompt(
    conversation: Conversation,
    userText: string
  ): { system: string; user: string } {
    const system = `You are an expert communication coach analyzing a conversation. Provide detailed but constructive feedback.

Consider:
1. Communication clarity and structure
2. Fluency and natural expression
3. Any patterns that suggest communication style preferences (use MBTI as a loose framework)
4. Strengths to encourage
5. One specific, actionable improvement

Respond in JSON format:
{
  "clarity_score": 0-100,
  "fluency_score": 0-100,
  "structure_score": 0-100,
  "structure_feedback": "Brief feedback on organization",
  "filler_suggestion": "Specific advice about filler words",
  "pace_suggestion": "Advice about speaking pace",
  "communication_observation": "What you noticed about their communication style",
  "style_indicator": "Optional: T-type, F-type, etc. if clearly evident",
  "communication_suggestion": "How to adapt for different audiences",
  "coaching_tip": "ONE specific, actionable tip for improvement",
  "strengths": ["strength1", "strength2"]
}`;

    const user = `Analyze this ${conversation.mode} conversation (${conversation.durationSeconds} seconds):

USER'S MESSAGES:
${userText}

CONVERSATION CONTEXT:
- Number of turns: ${Math.floor(conversation.messages.length / 2)}
- Duration: ${conversation.durationSeconds} seconds

Please provide your analysis.`;

    return { system, user };
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

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });
      return !!response.choices[0]?.message?.content;
    } catch {
      return false;
    }
  }
}
```

#### 3.1.5 WebSocket Handler (`api/websocket/handlers/chat.ts`)

```typescript
import { Server, Socket } from 'socket.io';
import { ChatService } from '../../../services/ChatService';
import {
  chatStartSchema,
  chatAudioSchema,
  chatEndSchema,
  ChatStartPayload,
  ChatAudioPayload,
  ChatEndPayload,
  ChatStartResponse,
  ChatTurnResponse,
  ChatSummaryResponse,
} from '../../../shared/types/chat';
import { logger } from '../../../shared/utils/logger';

interface ChatSession {
  conversationId: string;
  mode: string;
  startedAt: number;
}

export function setupChatHandlers(io: Server, chatService: ChatService): void {
  const activeSessions = new Map<string, ChatSession>();

  io.on('connection', (socket: Socket) => {
    logger.info('Chat client connected', { socketId: socket.id });

    // ============================================================
    // CHAT:START - Initialize conversation
    // ============================================================
    socket.on('chat:start', async (payload: unknown) => {
      try {
        const validation = chatStartSchema.safeParse(payload);
        if (!validation.success) {
          socket.emit('chat:error', {
            code: 'VALIDATION_ERROR',
            message: validation.error.message,
          });
          return;
        }

        const { mode, userId } = validation.data;

        const result = await chatService.startConversation(mode, userId);

        if (!result.success) {
          socket.emit('chat:error', {
            code: 'START_FAILED',
            message: result.error.message,
          });
          return;
        }

        // Track active session
        activeSessions.set(socket.id, {
          conversationId: result.data.conversationId,
          mode,
          startedAt: Date.now(),
        });

        const response: ChatStartResponse = {
          conversationId: result.data.conversationId,
          greeting: result.data.greeting,
        };

        socket.emit('chat:started', response);

        logger.info('Chat started', {
          socketId: socket.id,
          conversationId: result.data.conversationId,
        });
      } catch (error) {
        logger.error('chat:start error', { error, socketId: socket.id });
        socket.emit('chat:error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to start chat',
        });
      }
    });

    // ============================================================
    // CHAT:AUDIO - Process user audio turn
    // ============================================================
    socket.on('chat:audio', async (payload: unknown) => {
      try {
        const validation = chatAudioSchema.safeParse(payload);
        if (!validation.success) {
          socket.emit('chat:error', {
            code: 'VALIDATION_ERROR',
            message: validation.error.message,
          });
          return;
        }

        const { conversationId, audio } = validation.data;
        const session = activeSessions.get(socket.id);

        if (!session || session.conversationId !== conversationId) {
          socket.emit('chat:error', {
            code: 'SESSION_NOT_FOUND',
            message: 'No active chat session',
          });
          return;
        }

        // Emit processing state
        socket.emit('chat:processing', { conversationId });

        const result = await chatService.processUserTurn({
          conversationId,
          audioBase64: audio,
          conversationHistory: [], // Service maintains history internally
          mode: session.mode as any,
        });

        if (!result.success) {
          socket.emit('chat:error', {
            code: 'PROCESS_FAILED',
            message: result.error.message,
          });
          return;
        }

        const response: ChatTurnResponse = {
          userMessage: {
            id: '',
            conversationId,
            role: 'user',
            content: result.data.userTranscript,
            timestamp: Date.now(),
            pronunciation: result.data.pronunciation,
          },
          assistantMessage: {
            id: '',
            conversationId,
            role: 'assistant',
            content: result.data.aiResponse,
            timestamp: Date.now(),
            inlineCoaching: result.data.inlineCoaching,
          },
          audioBase64: result.data.aiAudioBase64,
        };

        socket.emit('chat:turn', response);

        logger.info('Chat turn processed', {
          socketId: socket.id,
          conversationId,
        });
      } catch (error) {
        logger.error('chat:audio error', { error, socketId: socket.id });
        socket.emit('chat:error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process audio',
        });
      }
    });

    // ============================================================
    // CHAT:END - End conversation and get summary
    // ============================================================
    socket.on('chat:end', async (payload: unknown) => {
      try {
        const validation = chatEndSchema.safeParse(payload);
        if (!validation.success) {
          socket.emit('chat:error', {
            code: 'VALIDATION_ERROR',
            message: validation.error.message,
          });
          return;
        }

        const { conversationId } = validation.data;
        const session = activeSessions.get(socket.id);

        if (!session || session.conversationId !== conversationId) {
          socket.emit('chat:error', {
            code: 'SESSION_NOT_FOUND',
            message: 'No active chat session',
          });
          return;
        }

        // Emit generating state
        socket.emit('chat:generating-summary', { conversationId });

        const result = await chatService.endConversation(conversationId);

        if (!result.success) {
          socket.emit('chat:error', {
            code: 'SUMMARY_FAILED',
            message: result.error.message,
          });
          return;
        }

        const response: ChatSummaryResponse = {
          conversationId,
          summary: result.data,
        };

        socket.emit('chat:summary', response);

        // Clean up
        activeSessions.delete(socket.id);

        logger.info('Chat ended', {
          socketId: socket.id,
          conversationId,
          durationSeconds: Math.floor((Date.now() - session.startedAt) / 1000),
        });
      } catch (error) {
        logger.error('chat:end error', { error, socketId: socket.id });
        socket.emit('chat:error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to end chat',
        });
      }
    });

    // ============================================================
    // DISCONNECT - Clean up
    // ============================================================
    socket.on('disconnect', () => {
      const session = activeSessions.get(socket.id);
      if (session) {
        logger.warn('Chat disconnected without ending', {
          socketId: socket.id,
          conversationId: session.conversationId,
        });
        // TODO: Could auto-generate summary and store
        activeSessions.delete(socket.id);
      }
      logger.info('Chat client disconnected', { socketId: socket.id });
    });
  });
}
```

### 3.2 Mobile Implementation

#### 3.2.1 New Files Structure

```
apps/mobile/src/
├── screens/
│   ├── ChatScreen.tsx          # Main chat UI (replace placeholder)
│   └── ChatSummaryScreen.tsx   # Post-chat summary display
├── hooks/
│   └── useChat.ts              # Chat state management
├── components/
│   └── chat/
│       ├── ChatMessageBubble.tsx
│       ├── ChatTranscript.tsx
│       ├── HoldToTalkButton.tsx
│       └── ChatTimer.tsx
├── services/
│   └── chatService.ts          # WebSocket chat methods
└── types/
    └── chat.ts                 # Chat types (mirror backend)
```

#### 3.2.2 Chat Hook (`hooks/useChat.ts`)

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { chatService } from '../services/chatService';
import {
  ChatMessage,
  ChatMode,
  ConversationSummary,
  PronunciationFeedback,
} from '../types/chat';

interface UseChatState {
  // Connection state
  isConnected: boolean;
  conversationId: string | null;

  // Recording state
  isRecording: boolean;
  isProcessing: boolean;

  // Conversation state
  messages: ChatMessage[];
  currentTranscript: string;

  // Timer
  remainingSeconds: number;

  // Results
  summary: ConversationSummary | null;

  // Error
  error: string | null;
}

interface UseChatReturn extends UseChatState {
  startChat: (mode?: ChatMode) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  endChat: () => Promise<void>;
  playAudio: (audioBase64: string) => Promise<void>;
}

const MAX_DURATION_SECONDS = 120;
const AUDIO_CONFIG = {
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
};

export function useChat(): UseChatReturn {
  const [state, setState] = useState<UseChatState>({
    isConnected: false,
    conversationId: null,
    isRecording: false,
    isProcessing: false,
    messages: [],
    currentTranscript: '',
    remainingSeconds: MAX_DURATION_SECONDS,
    summary: null,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync();
      if (soundRef.current) soundRef.current.unloadAsync();
      chatService.disconnect();
    };
  }, []);

  // ============================================================
  // START CHAT
  // ============================================================

  const startChat = useCallback(async (mode: ChatMode = 'free_talk') => {
    try {
      setState((s) => ({ ...s, error: null, isProcessing: true }));

      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setState((s) => ({ ...s, error: 'Microphone permission required', isProcessing: false }));
        return;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Connect to WebSocket
      await chatService.connect();

      // Set up event handlers
      chatService.onStarted((response) => {
        setState((s) => ({
          ...s,
          isConnected: true,
          conversationId: response.conversationId,
          messages: [
            {
              id: '0',
              conversationId: response.conversationId,
              role: 'assistant',
              content: response.greeting.text,
              timestamp: Date.now(),
            },
          ],
          isProcessing: false,
        }));

        // Play greeting
        playAudioInternal(response.greeting.audioBase64);

        // Start timer
        timerRef.current = setInterval(() => {
          setState((s) => {
            if (s.remainingSeconds <= 1) {
              // Auto-end when time runs out
              endChatInternal(s.conversationId!);
              return { ...s, remainingSeconds: 0 };
            }
            return { ...s, remainingSeconds: s.remainingSeconds - 1 };
          });
        }, 1000);
      });

      chatService.onTurn((response) => {
        setState((s) => ({
          ...s,
          messages: [...s.messages, response.userMessage, response.assistantMessage],
          currentTranscript: '',
          isProcessing: false,
        }));

        // Play AI response
        playAudioInternal(response.audioBase64);
      });

      chatService.onProcessing(() => {
        setState((s) => ({ ...s, isProcessing: true }));
      });

      chatService.onSummary((response) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setState((s) => ({
          ...s,
          summary: response.summary,
          isProcessing: false,
        }));
      });

      chatService.onError((error) => {
        setState((s) => ({
          ...s,
          error: error.message,
          isProcessing: false,
        }));
      });

      // Start the conversation
      chatService.startChat(mode);
    } catch (error: any) {
      setState((s) => ({
        ...s,
        error: error.message || 'Failed to start chat',
        isProcessing: false,
      }));
    }
  }, []);

  // ============================================================
  // RECORDING
  // ============================================================

  const startRecording = useCallback(async () => {
    if (!state.conversationId || state.isRecording) return;

    try {
      // Stop any playing audio
      if (soundRef.current) {
        await soundRef.current.stopAsync();
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          sampleRate: AUDIO_CONFIG.sampleRate,
          numberOfChannels: AUDIO_CONFIG.numberOfChannels,
          bitRate: AUDIO_CONFIG.bitRate,
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        },
        ios: {
          extension: '.wav',
          sampleRate: AUDIO_CONFIG.sampleRate,
          numberOfChannels: AUDIO_CONFIG.numberOfChannels,
          bitRate: AUDIO_CONFIG.bitRate,
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
        },
        web: {},
      });

      await recording.startAsync();
      recordingRef.current = recording;

      setState((s) => ({ ...s, isRecording: true, currentTranscript: '' }));
    } catch (error: any) {
      setState((s) => ({ ...s, error: error.message || 'Failed to start recording' }));
    }
  }, [state.conversationId, state.isRecording]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current || !state.conversationId) return;

    try {
      setState((s) => ({ ...s, isRecording: false, isProcessing: true }));

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        setState((s) => ({ ...s, error: 'No recording found', isProcessing: false }));
        return;
      }

      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Clean up file
      await FileSystem.deleteAsync(uri, { idempotent: true });

      // Send to backend
      chatService.sendAudio(state.conversationId, base64);
    } catch (error: any) {
      setState((s) => ({
        ...s,
        error: error.message || 'Failed to process recording',
        isProcessing: false,
      }));
    }
  }, [state.conversationId]);

  // ============================================================
  // END CHAT
  // ============================================================

  const endChat = useCallback(async () => {
    if (!state.conversationId) return;
    endChatInternal(state.conversationId);
  }, [state.conversationId]);

  const endChatInternal = (conversationId: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState((s) => ({ ...s, isProcessing: true }));
    chatService.endChat(conversationId);
  };

  // ============================================================
  // AUDIO PLAYBACK
  // ============================================================

  const playAudio = useCallback(async (audioBase64: string) => {
    await playAudioInternal(audioBase64);
  }, []);

  const playAudioInternal = async (audioBase64: string) => {
    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Write to temp file
      const fileUri = FileSystem.cacheDirectory + 'ai_response.wav';
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Play
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;
      await sound.playAsync();

      // Cleanup after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  return {
    ...state,
    startChat,
    startRecording,
    stopRecording,
    endChat,
    playAudio,
  };
}
```

#### 3.2.3 ChatScreen (`screens/ChatScreen.tsx`)

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../hooks/useChat';
import { ChatMode } from '../types/chat';

const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
};

export default function ChatScreen() {
  const navigation = useNavigation();
  const {
    isConnected,
    conversationId,
    isRecording,
    isProcessing,
    messages,
    remainingSeconds,
    summary,
    error,
    startChat,
    startRecording,
    stopRecording,
    endChat,
  } = useChat();

  const [chatStarted, setChatStarted] = useState(false);

  // Navigate to summary when ready
  useEffect(() => {
    if (summary) {
      navigation.navigate('ChatSummary', { summary });
    }
  }, [summary, navigation]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartChat = async (mode: ChatMode = 'free_talk') => {
    setChatStarted(true);
    await startChat(mode);
  };

  const handleEndChat = () => {
    endChat();
  };

  // ============================================================
  // IDLE STATE - Not started
  // ============================================================
  if (!chatStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.title}>AI Chat Coach</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.subtitle}>Practice natural conversation</Text>

        <View style={styles.content}>
          <Text style={styles.introText}>
            Have a free-form conversation with your AI coach. Practice speaking
            naturally while getting real-time feedback on pronunciation and
            communication style.
          </Text>

          <View style={styles.modeSelector}>
            <Text style={styles.modeLabel}>Choose a mode:</Text>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => handleStartChat('free_talk')}
            >
              <Text style={styles.modeEmoji}>💬</Text>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Free Talk</Text>
                <Text style={styles.modeDescription}>
                  Talk about anything on your mind
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => handleStartChat('reflective')}
            >
              <Text style={styles.modeEmoji}>🧠</Text>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Think Out Loud</Text>
                <Text style={styles.modeDescription}>
                  Work through a decision or idea
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => handleStartChat('professional')}
            >
              <Text style={styles.modeEmoji}>💼</Text>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Professional</Text>
                <Text style={styles.modeDescription}>
                  Practice workplace communication
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>How it works:</Text>
            <Text style={styles.tipText}>• Hold the button to speak</Text>
            <Text style={styles.tipText}>• Release to hear AI respond</Text>
            <Text style={styles.tipText}>• 2 minute conversation limit</Text>
            <Text style={styles.tipText}>
              • Get a full summary at the end
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // ACTIVE CHAT STATE
  // ============================================================
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <Text
          style={[
            styles.timer,
            remainingSeconds <= 30 && styles.timerWarning,
          ]}
        >
          {formatTime(remainingSeconds)}
        </Text>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndChat}
          disabled={isProcessing}
        >
          <Text style={styles.endButtonText}>End Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message, index) => (
          <View
            key={message.id || index}
            style={[
              styles.messageBubble,
              message.role === 'user'
                ? styles.userBubble
                : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.role === 'user'
                  ? styles.userText
                  : styles.assistantText,
              ]}
            >
              {message.content}
            </Text>

            {/* Show mispronounced words for user messages */}
            {message.role === 'user' &&
              message.pronunciation?.mispronounced?.length > 0 && (
                <View style={styles.pronunciationHint}>
                  {message.pronunciation.mispronounced.slice(0, 2).map((word, i) => (
                    <Text key={i} style={styles.pronunciationText}>
                      "{word.word}" → {word.suggestion}
                    </Text>
                  ))}
                </View>
              )}

            {/* Show inline coaching for assistant messages */}
            {message.role === 'assistant' && message.inlineCoaching && (
              <View style={styles.coachingHint}>
                <Text style={styles.coachingText}>
                  💡 {message.inlineCoaching.tip}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.processingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Hold to talk button */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={[
            styles.talkButton,
            isRecording && styles.talkButtonActive,
            isProcessing && styles.talkButtonDisabled,
          ]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={isProcessing || !isConnected}
        >
          <Text style={styles.talkButtonIcon}>
            {isRecording ? '🔴' : '🎙️'}
          </Text>
          <Text style={styles.talkButtonText}>
            {isRecording
              ? 'Release to send'
              : isProcessing
              ? 'AI responding...'
              : 'Hold to speak'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.text,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  modeSelector: {
    marginBottom: 24,
  },
  modeLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tipContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  // Active chat styles
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timer: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timerWarning: {
    color: COLORS.warning,
  },
  endButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  endButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.text,
  },
  assistantText: {
    color: COLORS.text,
  },
  pronunciationHint: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  pronunciationText: {
    fontSize: 12,
    color: COLORS.warning,
    fontStyle: 'italic',
  },
  coachingHint: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  coachingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  processingText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: COLORS.error,
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorText: {
    color: COLORS.text,
    fontSize: 14,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  talkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    borderRadius: 16,
  },
  talkButtonActive: {
    backgroundColor: COLORS.error,
  },
  talkButtonDisabled: {
    backgroundColor: COLORS.backgroundSecondary,
    opacity: 0.7,
  },
  talkButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  talkButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
});
```

---

## 4. Phase 2: OpenAI Realtime (Natural Conversation)

### 4.1 Architecture Changes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            PHASE 2 ARCHITECTURE                          │
│                                                                          │
│  User Audio ──┬──► OpenAI Realtime API (conversation) ──► AI Audio      │
│               │         │                                                │
│               │         └──► Transcript (for UI)                        │
│               │                                                          │
│               └──► Azure STT + Pronunciation (parallel)                  │
│                         │                                                │
│                         └──► Real-time pronunciation scores              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Differences

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| Interaction | Hold-to-talk | Always listening |
| Latency | 1-2 seconds | ~300-500ms |
| Turn detection | Manual (button release) | Automatic (VAD) |
| Interruptions | Not supported | Supported |
| Audio pipeline | Sequential (STT→LLM→TTS) | Parallel (Realtime + Azure) |
| Cost | ~$0.12/session | ~$0.62/session |

### 4.3 OpenAI Realtime Integration

```typescript
// infrastructure/realtime/OpenAIRealtimeClient.ts

import WebSocket from 'ws';
import { EventEmitter } from 'events';

interface RealtimeConfig {
  apiKey: string;
  model: string; // 'gpt-4o-realtime-preview'
  voice: string; // 'alloy', 'echo', 'shimmer', etc.
  systemPrompt: string;
}

export class OpenAIRealtimeClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;

  constructor(config: RealtimeConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    const url = 'wss://api.openai.com/v1/realtime?model=' + this.config.model;

    this.ws = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    this.ws.on('open', () => {
      // Configure session
      this.send({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: this.config.systemPrompt,
          voice: this.config.voice,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      });

      this.emit('connected');
    });

    this.ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      this.handleEvent(event);
    });

    this.ws.on('error', (error) => {
      this.emit('error', error);
    });

    this.ws.on('close', () => {
      this.emit('disconnected');
    });
  }

  sendAudio(audioChunk: Buffer): void {
    if (!this.ws) return;

    this.send({
      type: 'input_audio_buffer.append',
      audio: audioChunk.toString('base64'),
    });
  }

  private handleEvent(event: any): void {
    switch (event.type) {
      case 'response.audio.delta':
        // Streaming audio response
        this.emit('audio', Buffer.from(event.delta, 'base64'));
        break;

      case 'response.audio_transcript.delta':
        // AI transcript as it speaks
        this.emit('transcript', event.delta);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User's speech transcribed
        this.emit('user_transcript', event.transcript);
        break;

      case 'response.done':
        // Response complete
        this.emit('response_complete', event.response);
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking
        this.emit('speech_started');
        break;

      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        this.emit('speech_stopped');
        break;

      case 'error':
        this.emit('error', event.error);
        break;
    }
  }

  private send(event: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### 4.4 Phase 2 Migration Triggers

Move to Phase 2 when:

1. **Retention signals**: Chat D7 retention > 30%
2. **User feedback**: >10% request "more natural" conversation
3. **Revenue**: Can support ~$0.62/session cost
4. **API maturity**: OpenAI Realtime stable for 3+ months

---

## 5. Data Schema

### 5.1 Supabase Tables

```sql
-- ============================================================
-- CONVERSATIONS TABLE
-- ============================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session info
  mode VARCHAR(50) NOT NULL DEFAULT 'free_talk',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- Summary scores (0-100)
  pronunciation_score DECIMAL(5,2),
  clarity_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),

  -- Detailed analysis (JSON)
  summary JSONB,
  /*
  {
    "pronunciationNotes": [...],
    "communicationAnalysis": {...},
    "communicationStyle": {...},
    "coachingTip": "...",
    "strengths": [...]
  }
  */

  -- Metadata
  device_type VARCHAR(50),
  app_version VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CONVERSATION MESSAGES TABLE
-- ============================================================

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

  -- Message content
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,

  -- User message metadata
  pronunciation JSONB, -- { overallScore, mispronounced, fillerWords, pace }
  duration_ms INTEGER,

  -- Assistant message metadata
  inline_coaching JSONB, -- { type, tip }

  -- Ordering
  sequence_number INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_user_date ON conversations(user_id, started_at DESC);
CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_sequence ON conversation_messages(conversation_id, sequence_number);
```

---

## 6. API Specifications

### 6.1 REST Endpoints

```typescript
// GET /api/chat/history
// Get user's conversation history

Request:
  Query: { limit?: number; offset?: number }

Response:
  {
    conversations: Array<{
      id: string;
      mode: string;
      startedAt: string;
      durationSeconds: number;
      overallScore: number;
    }>;
    total: number;
  }

// GET /api/chat/:conversationId
// Get single conversation with messages

Response:
  {
    conversation: Conversation;
    messages: ChatMessage[];
  }
```

### 6.2 WebSocket Events

```typescript
// Client → Server

'chat:start'
  Payload: { mode: ChatMode; userId?: string }

'chat:audio'
  Payload: { conversationId: string; audio: string (base64) }

'chat:end'
  Payload: { conversationId: string }

// Server → Client

'chat:started'
  Payload: { conversationId: string; greeting: { text, audioBase64 } }

'chat:processing'
  Payload: { conversationId: string }

'chat:turn'
  Payload: { userMessage, assistantMessage, audioBase64 }

'chat:summary'
  Payload: { conversationId: string; summary: ConversationSummary }

'chat:error'
  Payload: { code: string; message: string }
```

---

## 7. Mobile Implementation

### 7.1 Navigation Updates

```typescript
// App.tsx - Add ChatSummary screen

const ChatStack = createNativeStackNavigator();

function ChatStackScreen() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatMain" component={ChatScreen} />
      <ChatStack.Screen name="ChatSummary" component={ChatSummaryScreen} />
    </ChatStack.Navigator>
  );
}
```

### 7.2 Types to Add (`types/chat.ts`)

Mirror the backend types for type safety across the stack.

---

## 8. Testing Strategy

### 8.1 Backend Tests

```typescript
// Unit tests
- ChatService.startConversation()
- ChatService.processUserTurn()
- ChatService.endConversation()
- ChatConversationManager prompt generation
- WebSocket event handlers

// Integration tests
- Full conversation flow (start → turns → end)
- Azure STT mock responses
- GPT-4o mock responses
- Error handling paths
```

### 8.2 Mobile Tests

```typescript
// Component tests
- ChatScreen renders correctly
- Mode selection works
- Message bubbles display
- Timer countdown

// Hook tests
- useChat state transitions
- Recording start/stop
- WebSocket event handling
```

### 8.3 E2E Tests

```typescript
// Happy path
1. Start chat → Receive greeting
2. Record audio → Receive response
3. Multiple turns
4. End chat → Receive summary

// Error paths
1. Network disconnection
2. Audio recording failure
3. Timeout handling
```

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Latency frustration** | High | High | Show "AI thinking..." UI, optimize prompts |
| **Azure STT misses words** | Medium | Medium | "Did you say...?" confirmation for unclear audio |
| **GPT-4o slow response** | Medium | Medium | 5s timeout, graceful fallback |
| **TTS failure** | Low | Medium | Show text response as fallback |
| **Conversation off-topic** | Medium | Low | System prompt guardrails |
| **Cost overrun** | Medium | Medium | Hard 2-min cap, session limits |
| **User speaks inappropriate content** | Low | Medium | Content moderation in prompt |
| **Mobile battery drain** | Medium | Low | Optimize audio recording |

---

## 10. Cost Analysis

### Phase 1 (Per 2-min Session)

| Service | Usage | Cost |
|---------|-------|------|
| Azure STT | ~1 min user audio | $0.016 |
| Azure Pronunciation | ~1 min | $0.016 |
| Azure TTS | ~1 min AI audio | $0.024 |
| GPT-4o | ~5 turns × 500 tokens | $0.05 |
| **Total** | | **~$0.12** |

### Phase 2 (Per 2-min Session)

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI Realtime (input) | 1 min | $0.06 |
| OpenAI Realtime (output) | 1 min | $0.24 |
| Azure Pronunciation (parallel) | 1 min | $0.016 |
| **Total** | | **~$0.32** |

### Monthly Projections

| Users | Sessions/mo | Phase 1 Cost | Phase 2 Cost |
|-------|-------------|--------------|--------------|
| 100 | 500 | $60 | $160 |
| 1,000 | 5,000 | $600 | $1,600 |
| 10,000 | 50,000 | $6,000 | $16,000 |

---

## Implementation Checklist

### Phase 1 (Estimated: 3-4 weeks)

**Week 1: Backend Foundation**
- [ ] Create `shared/types/chat.ts`
- [ ] Create `domain/interfaces/IConversationManager.ts`
- [ ] Create `domain/interfaces/ITTSService.ts`
- [ ] Implement `ChatConversationManager`
- [ ] Implement `ChatService`
- [ ] Add unit tests

**Week 2: WebSocket & API**
- [ ] Create `api/websocket/handlers/chat.ts`
- [ ] Create `api/routes/chat.ts`
- [ ] Wire up in `index.ts`
- [ ] Add integration tests
- [ ] Test with Postman/wscat

**Week 3: Mobile Implementation**
- [ ] Create `types/chat.ts`
- [ ] Create `services/chatService.ts`
- [ ] Implement `useChat` hook
- [ ] Implement `ChatScreen`
- [ ] Implement `ChatSummaryScreen`
- [ ] Update navigation

**Week 4: Polish & Testing**
- [ ] E2E testing on device
- [ ] Error handling refinement
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deploy to staging

### Phase 2 (Estimated: 2-3 weeks)

- [ ] Implement OpenAI Realtime client
- [ ] Parallel Azure pronunciation stream
- [ ] Update mobile for continuous audio
- [ ] A/B test latency improvements
- [ ] Cost monitoring dashboard

---

*Document created: December 2024*
*Last updated: December 2024*
