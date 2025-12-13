# ProSpeaker - Product & Technical Plan

> **"The 30-Second Career Accelerator"**
> *Sound like you've been in America for 10 years - in 30 seconds a day*

---

## Table of Contents
1. [Vision & Target Users](#1-vision--target-users)
2. [Problem Statement](#2-problem-statement)
3. [User Experience Design](#3-user-experience-design)
4. [Technical Architecture](#4-technical-architecture)
5. [Data Flow](#5-data-flow)
6. [Data Schema](#6-data-schema)
7. [API Integration Details](#7-api-integration-details)
8. [Phased Roadmap](#8-phased-roadmap)
9. [Success Metrics](#9-success-metrics)
10. [Cost Estimates](#10-cost-estimates)

---

## 1. Vision & Target Users

### Vision
Make it possible for every non-native English speaker to sound clear, confident, and professional—without needing tutors, long lessons, or expensive coaching.

**A tiny daily habit → a big lifelong upgrade.**

### Primary Users
- Immigrant professionals (tech, engineering, PMs, managers, nurses, consultants)
- Adults who speak English daily but want more clarity & confidence
- People preparing for interviews, presentations, meetings
- Non-native speakers who want to sound more natural and concise

### Secondary Users
- International students
- Advanced ESL learners
- Global markets: China / India / Korea / SE Asia

### Key Differentiator
Unlike ELSA (pronunciation-only) or Speeko (public speaking-only), ProSpeaker combines:
- **Phoneme-level pronunciation scoring** (how you sound)
- **Professional communication coaching** (what you say and how you structure it)
- **Career-focused context** (meetings, interviews, updates)

---

## 2. Problem Statement

Most non-native English speakers understand English well but struggle with:

| Category | Specific Issues |
|----------|-----------------|
| **Pronunciation** | R/L confusion, TH sounds, T/D endings, unclear consonants |
| **Delivery** | Speaking too fast/soft, monotone, low energy |
| **Habits** | Filler words (um, like, so, actually) |
| **Communication Style** | Not concise, poor structure, indirect |
| **Confidence** | Anxiety in meetings, fear of being judged |

**Core Insight:** Existing apps solve pieces—not the whole picture. Professionals don't want to "learn English"; they want to be taken seriously in meetings.

---

## 3. User Experience Design

### 3.1 POC User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME SCREEN                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  Good morning! Ready for your 30-second workout?        │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │  💬 FREE TALK                                        ││    │
│  │  │  Talk about anything on your mind                   ││    │
│  │  │                                                      ││    │
│  │  │              [ START SPEAKING ]                      ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  │                                                          │    │
│  │  ─────────────── or try today's prompt ───────────────  │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │  🎯 TODAY'S TOPIC                                    ││    │
│  │  │  "Share something fun you did recently"             ││    │
│  │  │                                                      ││    │
│  │  │  💡 Ideas to get you started:                       ││    │
│  │  │  • A meal you enjoyed                               ││    │
│  │  │  • Something that made you laugh                    ││    │
│  │  │  • A place you visited                              ││    │
│  │  │  • A conversation you had                           ││    │
│  │  │                                                      ││    │
│  │  │              [ START WITH TOPIC ]                    ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  │                                                          │    │
│  │  🔥 3 day streak                    📊 View Progress    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ User taps START
┌─────────────────────────────────────────────────────────────────┐
│                      RECORDING SCREEN                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  ⏱️  0:18 / 0:30                    [||||||||----]       │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ "So basically I've been working on the API      │    │    │
│  │  │ integration and um it's going pretty well..."   │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  LIVE STATS:                                             │    │
│  │  🔴 Filler words: 2                                      │    │
│  │  ⚡ Pace: 156 wpm (a bit fast)                           │    │
│  │                                                          │    │
│  │              [ ⏹️ STOP EARLY ]                           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Recording complete (30s or user stops)
┌─────────────────────────────────────────────────────────────────┐
│                      ANALYZING SCREEN                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │              🔄 Analyzing your speech...                 │    │
│  │                                                          │    │
│  │              [==============    ] 70%                    │    │
│  │                                                          │    │
│  │              Checking pronunciation...                   │    │
│  │              Analyzing communication style...            │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Analysis complete (2-4 seconds)
┌─────────────────────────────────────────────────────────────────┐
│                      FEEDBACK SCREEN                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  📊 YOUR RESULTS                                         │    │
│  │  ──────────────────────────────────────────────────────  │    │
│  │                                                          │    │
│  │  PRONUNCIATION        CLARITY          FLUENCY           │    │
│  │  ████████░░ 78       █████████░ 85    ███████░░░ 72     │    │
│  │                                                          │    │
│  │  ──────────────────────────────────────────────────────  │    │
│  │                                                          │    │
│  │  🎯 PRONUNCIATION FOCUS                                  │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ • "specifically" → stress 2nd syllable: spe-CI-fi  │ │    │
│  │  │ • "development" → ending 't' was dropped           │ │    │
│  │  │ • "integration" → try: in-tuh-GRAY-shun            │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  💬 COMMUNICATION ANALYSIS                               │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ ⚠️ Filler words: 4 ("so", "basically", "um" x2)    │ │    │
│  │  │ ⚡ Pace: 156 wpm - try slowing to ~140 wpm         │ │    │
│  │  │ 📐 Structure: Started with filler, not main point  │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  ✨ POLISHED VERSION                                     │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ "This week I completed the API integration and     │ │    │
│  │  │ began testing. We're on track for the Friday       │ │    │
│  │  │ deadline. Next, I'll focus on performance          │ │    │
│  │  │ optimization."                                      │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  🎓 ONE THING TO PRACTICE                                │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ "Lead with your conclusion. Instead of 'So        │ │    │
│  │  │ basically I've been working on...' try 'The API   │ │    │
│  │  │ integration is complete.'"                         │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  [ 🔄 TRY AGAIN ]          [ 🏠 DONE ]                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Post-POC: Additional Modes

#### Mode 1: Pronunciation Practice (Read Aloud)
```
Prompt: "Read this paragraph aloud"
Display: Text with words to read
Feedback: Phoneme-level accuracy, stress patterns, problem sounds
```

#### Mode 2: Casual Conversation
```
Prompts:
- "Tell me about your weekend"
- "Describe your favorite restaurant"
- "What are you excited about this week?"
Feedback: Natural phrasing, conversational tone, grammar
```

#### Mode 3: Professional Scenarios (Expanded)
```
Prompts:
- "Explain what you do at work to someone new"
- "Describe a challenge you solved recently"
- "Give feedback on a teammate's work"
- "Explain why a deadline will be missed"
Feedback: Structure, conciseness, professional tone, word choice
```

---

## 4. Technical Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile App)                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ Audio Capture │  │ Real-time UI  │  │ Feedback Display  │   │
│  │ (MediaRecorder)│  │ (Waveform,   │  │ (Results Cards)   │   │
│  │               │  │  Live Stats)  │  │                   │   │
│  └───────┬───────┘  └───────┬───────┘  └─────────▲─────────┘   │
│          │                  │                    │              │
│          │    WebSocket     │                    │              │
│          └──────────────────┼────────────────────┘              │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (API Server)                        │
│                      Node.js / Python FastAPI                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    WebSocket Handler                       │  │
│  │  • Receives audio chunks (streaming)                       │  │
│  │  • Forwards to Azure Speech (real-time)                    │  │
│  │  • Sends back interim results                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Analysis Orchestrator                   │  │
│  │  • Triggers Azure full analysis (post-recording)           │  │
│  │  • Sends transcript to LLM for communication feedback      │  │
│  │  • Combines results into unified response                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      AZURE SPEECH       │     │      LLM (GPT-4o)       │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │ Real-time STT     │  │     │  │ Communication     │  │
│  │ • Transcription   │  │     │  │ Analysis:         │  │
│  │ • Interim results │  │     │  │ • Grammar fixes   │  │
│  └───────────────────┘  │     │  │ • Rephrasing      │  │
│  ┌───────────────────┐  │     │  │ • Structure tips  │  │
│  │ Pronunciation     │  │     │  │ • Polished ver.   │  │
│  │ Assessment:       │  │     │  │ • Coaching tip    │  │
│  │ • Phoneme scores  │  │     │  └───────────────────┘  │
│  │ • Word accuracy   │  │     └─────────────────────────┘
│  │ • Fluency score   │  │
│  │ • Prosody score   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Mobile App** | React Native | Cross-platform, good audio APIs, large ecosystem |
| **Web App (optional)** | Next.js | For landing page + web version |
| **Backend** | Node.js + Express | Fast WebSocket support, good Azure SDK |
| **Real-time** | WebSocket (Socket.io) | Low latency for streaming audio |
| **Speech Analysis** | Azure Speech SDK | Best-in-class pronunciation assessment |
| **LLM** | OpenAI GPT-4o | Fast, good at coaching/rewriting |
| **Database** | PostgreSQL | Structured data, good for analytics |
| **Cache** | Redis | Session state, rate limiting |
| **Auth** | Firebase Auth | Quick to implement, social login |
| **Storage** | Azure Blob / S3 | Audio file storage (if needed) |
| **Hosting** | Vercel (web) + Railway/Render (backend) | Easy deployment |

---

## 5. Data Flow

### 5.1 Recording Phase (Real-time)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Mobile  │         │  Backend │         │  Azure   │
│   App    │         │  Server  │         │  Speech  │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ 1. Connect WS      │                    │
     │───────────────────>│                    │
     │                    │                    │
     │ 2. Start recording │                    │
     │    + config        │                    │
     │───────────────────>│ 3. Init Azure      │
     │                    │    session         │
     │                    │───────────────────>│
     │                    │                    │
     │ 4. Audio chunk     │                    │
     │    (every 100ms)   │ 5. Forward audio   │
     │───────────────────>│───────────────────>│
     │                    │                    │
     │                    │ 6. Interim result  │
     │ 7. Live transcript │    (transcript)    │
     │    + filler count  │<───────────────────│
     │<───────────────────│                    │
     │                    │                    │
     │    ... repeat 4-7 for 30 seconds ...    │
     │                    │                    │
     │ 8. Stop recording  │                    │
     │───────────────────>│ 9. End session     │
     │                    │───────────────────>│
     │                    │                    │
```

### 5.2 Analysis Phase (Post-recording)

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│  Mobile  │         │  Backend │         │  Azure   │         │  GPT-4o  │
│   App    │         │  Server  │         │  Speech  │         │          │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │
     │                    │ 1. Get full        │                    │
     │                    │    pronunciation   │                    │
     │                    │    assessment      │                    │
     │                    │───────────────────>│                    │
     │                    │                    │                    │
     │                    │ 2. Phoneme scores, │                    │
     │                    │    fluency, prosody│                    │
     │                    │<───────────────────│                    │
     │                    │                    │                    │
     │                    │ 3. Send transcript │                    │
     │                    │    + prompt for    │                    │
     │                    │    comm feedback   │                    │
     │                    │───────────────────────────────────────>│
     │                    │                    │                    │
     │                    │ 4. Grammar fixes,  │                    │
     │                    │    polished ver,   │                    │
     │                    │    coaching tip    │                    │
     │                    │<───────────────────────────────────────│
     │                    │                    │                    │
     │ 5. Combined        │                    │                    │
     │    feedback result │                    │                    │
     │<───────────────────│                    │                    │
     │                    │                    │                    │
```

### 5.3 Real-time Filler Word Detection

```javascript
// Client-side filler detection from interim transcripts
const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah',           // Hesitation sounds
  'like', 'you know', 'I mean',      // Discourse markers
  'so', 'basically', 'actually',     // Softeners (when overused)
  'kind of', 'sort of',              // Hedging
  'right', 'okay'                    // Filler tags
];

function countFillers(transcript: string): FillerCount {
  const words = transcript.toLowerCase().split(/\s+/);
  const counts: Record<string, number> = {};

  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = transcript.match(regex);
    if (matches) {
      counts[filler] = matches.length;
    }
  });

  return {
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    breakdown: counts
  };
}
```

---

## 6. Data Schema

### 6.1 Database Schema (PostgreSQL) - Scalable Design

```sql
-- ============================================================
-- CORE USER & AUTH
-- ============================================================

-- Users table (extensible for future features)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),

  -- Profile (for personalization)
  native_language VARCHAR(50),        -- 'Chinese', 'Spanish', 'Korean', etc.
  native_language_code VARCHAR(10),   -- 'zh-CN', 'es-MX', 'ko-KR'
  profession VARCHAR(100),            -- 'Software Engineer', 'Product Manager'
  industry VARCHAR(100),              -- 'Technology', 'Healthcare', 'Finance'
  experience_level VARCHAR(50),       -- 'entry', 'mid', 'senior', 'executive'
  target_accent VARCHAR(50) DEFAULT 'American',  -- 'American', 'British', 'Australian'

  -- Preferences
  daily_goal_minutes INTEGER DEFAULT 5,
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '09:00',
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',

  -- Subscription (for future monetization)
  subscription_tier VARCHAR(50) DEFAULT 'free',  -- 'free', 'pro', 'enterprise'
  subscription_expires_at TIMESTAMP,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User authentication providers (for social login)
CREATE TABLE user_auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,      -- 'google', 'apple', 'email'
  provider_user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(provider, provider_user_id)
);

-- ============================================================
-- PROMPTS & CONTENT
-- ============================================================

-- Prompt categories (hierarchical)
CREATE TABLE prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES prompt_categories(id),
  name VARCHAR(100) NOT NULL,         -- 'Professional', 'Casual', 'Interview'
  slug VARCHAR(100) UNIQUE NOT NULL,  -- 'professional', 'casual', 'interview'
  description TEXT,
  icon VARCHAR(50),                   -- 'briefcase', 'coffee', 'mic'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prompts table (enhanced with hints)
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES prompt_categories(id),

  -- Content
  prompt_text TEXT NOT NULL,          -- "Share something fun you did recently"
  prompt_context TEXT,                -- Additional context for AI analysis
  tip_text TEXT,                      -- "Start with the most interesting part"

  -- Hint bullets (3-4 starter ideas)
  hints JSONB,
  /*
  Example:
  [
    "A meal you enjoyed",
    "Something that made you laugh",
    "A place you visited",
    "A conversation you had"
  ]
  */

  -- Metadata
  mode VARCHAR(50) NOT NULL,          -- 'free_talk', 'professional', 'casual', 'read_aloud'
  difficulty VARCHAR(20) DEFAULT 'medium',
  estimated_duration_seconds INTEGER DEFAULT 30,
  target_professions JSONB,           -- ['engineer', 'pm', 'designer'] or null for all
  target_native_languages JSONB,      -- ['Chinese', 'Korean'] or null for all

  -- For read-aloud mode
  reference_text TEXT,                -- Text to read (for pronunciation mode)
  focus_sounds JSONB,                 -- ['θ', 'r', 'ɛ'] - sounds to practice

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,  -- For "today's prompt"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily featured prompts (rotates daily)
CREATE TABLE daily_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id),
  featured_date DATE UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SESSIONS & RECORDINGS
-- ============================================================

-- Sessions table (each speaking exercise)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id),  -- null for free talk

  -- Session info
  mode VARCHAR(50) NOT NULL,          -- 'free_talk', 'professional', 'casual', 'read_aloud'
  is_free_talk BOOLEAN DEFAULT false,
  user_topic TEXT,                    -- What user chose to talk about (for free talk)
  duration_seconds INTEGER,

  -- Audio (optional storage)
  audio_url VARCHAR(500),
  audio_duration_ms INTEGER,

  -- Transcript
  transcript TEXT,
  transcript_words_count INTEGER,

  -- Azure pronunciation scores (0-100)
  pronunciation_score DECIMAL(5,2),
  accuracy_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  prosody_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),

  -- Computed overall score (weighted average)
  overall_score DECIMAL(5,2),

  -- Detailed analysis (JSON for flexibility)
  phoneme_analysis JSONB,
  /*
  {
    "words": [
      {
        "word": "specifically",
        "accuracy": 72,
        "error_type": "mispronunciation",
        "phonemes": [
          {"phoneme": "s", "accuracy": 95, "offset": 0, "duration": 80},
          {"phoneme": "p", "accuracy": 88, "offset": 80, "duration": 60},
          {"phoneme": "ə", "accuracy": 65, "expected": "ɛ", "offset": 140, "duration": 50}
        ]
      }
    ],
    "problem_sounds": ["ɛ", "θ", "r"],
    "syllable_stress_issues": ["specifically", "development"]
  }
  */

  communication_analysis JSONB,
  /*
  {
    "filler_words": {
      "total": 4,
      "breakdown": {"um": 2, "so": 1, "basically": 1},
      "positions": [{"word": "um", "offset_ms": 1200}, ...]
    },
    "pace": {
      "wpm": 156,
      "assessment": "slightly_fast",
      "variation": "monotone"  -- or "good_variation"
    },
    "grammar_issues": [
      {
        "original": "I been working",
        "corrected": "I've been working",
        "type": "tense",
        "severity": "minor"
      }
    ],
    "structure": {
      "score": 65,
      "feedback": "Started with filler instead of main point",
      "detected_pattern": "rambling"  -- or "STAR", "clear_structure"
    },
    "vocabulary": {
      "level": "intermediate",
      "suggestions": [
        {"original": "good", "suggested": "effective", "context": "..."}
      ]
    },
    "polished_version": "This week I completed the API integration...",
    "coaching_tip": "Lead with your conclusion, then add details",
    "strengths": ["Good vocabulary range", "Clear examples"]
  }
  */

  -- For retry tracking
  parent_session_id UUID REFERENCES sessions(id),  -- If this is a retry
  retry_number INTEGER DEFAULT 0,

  -- Metadata
  device_type VARCHAR(50),            -- 'ios', 'android', 'web'
  app_version VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PROGRESS & GOALS (OKR-Style)
-- ============================================================

-- User goals (OKR style)
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Goal definition
  title VARCHAR(200) NOT NULL,        -- "Improve pronunciation to 85+"
  description TEXT,
  goal_type VARCHAR(50) NOT NULL,     -- 'pronunciation', 'fluency', 'filler_reduction', 'streak', 'custom'

  -- Target metrics
  target_metric VARCHAR(50),          -- 'pronunciation_score', 'filler_count', 'streak_days'
  target_value DECIMAL(10,2),         -- 85, 0, 30
  current_value DECIMAL(10,2),        -- Updated automatically
  starting_value DECIMAL(10,2),       -- Value when goal was created

  -- Timeline
  start_date DATE NOT NULL,
  target_date DATE,                   -- Optional deadline
  completed_at TIMESTAMP,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  progress_percentage DECIMAL(5,2),   -- 0-100

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Goal milestones (key results)
CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,        -- "Reach 75 pronunciation score"
  target_value DECIMAL(10,2),
  achieved_at TIMESTAMP,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily progress tracking
CREATE TABLE user_daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Activity metrics
  sessions_completed INTEGER DEFAULT 0,
  total_speaking_seconds INTEGER DEFAULT 0,

  -- Score averages for the day
  avg_pronunciation_score DECIMAL(5,2),
  avg_fluency_score DECIMAL(5,2),
  avg_prosody_score DECIMAL(5,2),
  avg_overall_score DECIMAL(5,2),

  -- Best scores of the day
  best_pronunciation_score DECIMAL(5,2),
  best_fluency_score DECIMAL(5,2),
  best_overall_score DECIMAL(5,2),

  -- Communication metrics
  total_filler_words INTEGER DEFAULT 0,
  avg_pace_wpm INTEGER,

  -- Problem areas tracking
  problem_sounds JSONB,               -- {"θ": 5, "r": 3} - count per sound
  grammar_issue_types JSONB,          -- {"tense": 3, "article": 2}

  -- Streak
  streak_continued BOOLEAN DEFAULT false,
  current_streak_days INTEGER DEFAULT 0,

  UNIQUE(user_id, date)
);

-- Weekly/Monthly aggregated progress
CREATE TABLE user_period_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  period_type VARCHAR(20) NOT NULL,   -- 'week', 'month', 'quarter'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Aggregated metrics
  sessions_completed INTEGER DEFAULT 0,
  total_speaking_minutes INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,

  -- Score trends
  avg_pronunciation_score DECIMAL(5,2),
  avg_fluency_score DECIMAL(5,2),
  avg_overall_score DECIMAL(5,2),

  -- Improvement from previous period
  pronunciation_change DECIMAL(5,2),  -- +5.2 or -3.1
  fluency_change DECIMAL(5,2),
  overall_change DECIMAL(5,2),

  -- Top improvements & focus areas
  improvements JSONB,
  /*
  [
    {"area": "TH sounds", "change": "+18%", "sessions_practiced": 12},
    {"area": "Filler words", "change": "-40%", "before": 5, "after": 3}
  ]
  */

  focus_areas JSONB,
  /*
  [
    {"area": "R sounds", "score": 62, "suggestion": "Practice minimal pairs"},
    {"area": "Speaking pace", "score": "too_fast", "suggestion": "Try 130 WPM"}
  ]
  */

  UNIQUE(user_id, period_type, period_start)
);

-- User streaks history
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  start_date DATE NOT NULL,
  end_date DATE,                      -- null if current streak
  streak_days INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ACHIEVEMENTS & GAMIFICATION
-- ============================================================

-- Achievement definitions
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL,         -- "First Steps"
  description TEXT,                   -- "Complete your first session"
  icon VARCHAR(100),                  -- 'trophy', 'star', 'fire'
  category VARCHAR(50),               -- 'streak', 'score', 'milestone'

  -- Unlock conditions (JSON for flexibility)
  unlock_condition JSONB,
  /*
  Examples:
  {"type": "sessions_count", "value": 1}
  {"type": "streak_days", "value": 7}
  {"type": "pronunciation_score", "value": 90}
  {"type": "filler_reduction", "from": 5, "to": 2}
  */

  points INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),

  unlocked_at TIMESTAMP DEFAULT NOW(),
  session_id UUID REFERENCES sessions(id),  -- Which session triggered it

  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- NOTIFICATIONS & REMINDERS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL,          -- 'streak_reminder', 'achievement', 'weekly_report'
  title VARCHAR(200),
  body TEXT,
  data JSONB,                         -- Additional payload

  sent_at TIMESTAMP,
  read_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS & EVENTS (for future insights)
-- ============================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  event_name VARCHAR(100) NOT NULL,   -- 'session_started', 'session_completed', 'feedback_viewed'
  event_properties JSONB,

  device_type VARCHAR(50),
  app_version VARCHAR(20),

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- Sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_sessions_user_created ON sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_mode ON sessions(mode);

-- Progress
CREATE INDEX idx_daily_progress_user_date ON user_daily_progress(user_id, date DESC);
CREATE INDEX idx_period_progress_user ON user_period_progress(user_id, period_type, period_start DESC);
CREATE INDEX idx_user_goals_user ON user_goals(user_id, status);
CREATE INDEX idx_user_streaks_user ON user_streaks(user_id, is_current);

-- Prompts
CREATE INDEX idx_prompts_category ON prompts(category_id);
CREATE INDEX idx_prompts_mode ON prompts(mode);
CREATE INDEX idx_prompts_active ON prompts(is_active, mode);
CREATE INDEX idx_daily_prompts_date ON daily_prompts(featured_date);

-- Analytics
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_event ON analytics_events(event_name);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
```

### 6.2 API Response Types (TypeScript)

```typescript
// Session creation request
interface CreateSessionRequest {
  mode: 'professional' | 'casual' | 'read_aloud';
  promptId?: string;
}

// Real-time streaming response (via WebSocket)
interface StreamingUpdate {
  type: 'interim' | 'final';
  transcript: string;
  fillerCount: number;
  currentPaceWpm: number;
  timestamp: number;
}

// Final analysis response
interface SessionAnalysis {
  sessionId: string;

  // Pronunciation (from Azure)
  pronunciation: {
    overallScore: number;      // 0-100
    accuracyScore: number;     // 0-100
    fluencyScore: number;      // 0-100
    prosodyScore: number;      // 0-100

    problemWords: Array<{
      word: string;
      score: number;
      suggestion: string;      // "spe-CI-fi-cly"
      phonemeIssues: Array<{
        expected: string;
        actual: string;
        position: number;
      }>;
    }>;

    problemSounds: string[];   // ["θ", "r", "ɛ"]
  };

  // Communication (from LLM)
  communication: {
    fillerWords: {
      total: number;
      breakdown: Record<string, number>;
    };

    pace: {
      wpm: number;
      assessment: 'too_slow' | 'good' | 'slightly_fast' | 'too_fast';
      suggestion?: string;
    };

    grammar: Array<{
      original: string;
      corrected: string;
      explanation?: string;
    }>;

    structure: {
      score: number;           // 0-100
      feedback: string;
    };

    polishedVersion: string;
    coachingTip: string;
  };
}

// Progress summary
interface UserProgressSummary {
  currentStreak: number;
  totalSessions: number;

  scores: {
    pronunciation: { current: number; trend: 'up' | 'down' | 'stable' };
    fluency: { current: number; trend: 'up' | 'down' | 'stable' };
    communication: { current: number; trend: 'up' | 'down' | 'stable' };
  };

  topImprovements: Array<{
    area: string;
    improvement: string;  // "+15% on 'th' sounds"
  }>;

  focusAreas: Array<{
    area: string;
    suggestion: string;
  }>;
}
```

---

## 7. API Integration Details

### 7.1 Azure Speech SDK - Pronunciation Assessment

```typescript
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

interface AzureConfig {
  subscriptionKey: string;
  region: string;  // e.g., 'eastus'
}

async function analyzePronunciation(
  audioBuffer: Buffer,
  referenceText: string | null,  // null for unscripted
  config: AzureConfig
): Promise<PronunciationResult> {

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.subscriptionKey,
    config.region
  );

  // Configure pronunciation assessment
  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    referenceText || '',
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true  // Enable miscue (insertion/omission detection)
  );

  // For unscripted speech (no reference text)
  if (!referenceText) {
    pronunciationConfig.enableProsodyAssessment = true;
    pronunciationConfig.enableContentAssessment = true;  // Grammar, vocabulary
  }

  // Set phoneme alphabet to IPA for international users
  pronunciationConfig.phonemeAlphabet = 'IPA';

  const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  pronunciationConfig.applyTo(recognizer);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);

        resolve({
          transcript: result.text,
          overallScore: pronunciationResult.pronunciationScore,
          accuracyScore: pronunciationResult.accuracyScore,
          fluencyScore: pronunciationResult.fluencyScore,
          prosodyScore: pronunciationResult.prosodyScore,
          completenessScore: pronunciationResult.completenessScore,
          words: pronunciationResult.detailResult.Words.map(word => ({
            word: word.Word,
            accuracy: word.PronunciationAssessment.AccuracyScore,
            phonemes: word.Phonemes.map(p => ({
              phoneme: p.Phoneme,
              accuracy: p.PronunciationAssessment.AccuracyScore,
            }))
          }))
        });
      },
      (error) => reject(error)
    );
  });
}
```

### 7.2 Real-time Streaming with Azure

```typescript
async function streamingRecognition(
  audioStream: ReadableStream,
  onInterimResult: (result: InterimResult) => void,
  config: AzureConfig
): Promise<void> {

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.subscriptionKey,
    config.region
  );

  // Optimize for low latency
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
    '300'  // Faster interim results
  );

  const pushStream = sdk.AudioInputStream.createPushStream();
  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  // Handle interim results
  recognizer.recognizing = (s, e) => {
    onInterimResult({
      type: 'interim',
      transcript: e.result.text,
      timestamp: Date.now()
    });
  };

  // Handle final results
  recognizer.recognized = (s, e) => {
    if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
      onInterimResult({
        type: 'final',
        transcript: e.result.text,
        timestamp: Date.now()
      });
    }
  };

  recognizer.startContinuousRecognitionAsync();

  // Pipe audio chunks to push stream
  const reader = audioStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pushStream.write(value);
  }

  pushStream.close();
}
```

### 7.3 LLM Communication Analysis Prompt

```typescript
const COMMUNICATION_ANALYSIS_PROMPT = `
You are an expert English communication coach specializing in helping non-native speakers sound more professional and natural in workplace settings.

Analyze the following speech transcript from a professional context and provide feedback.

TRANSCRIPT:
"""
{transcript}
"""

CONTEXT: {context}  // e.g., "30-second project update in a team meeting"

Provide analysis in the following JSON format:

{
  "grammar_issues": [
    {
      "original": "exact phrase from transcript",
      "corrected": "grammatically correct version",
      "explanation": "brief explanation (optional)"
    }
  ],

  "awkward_phrases": [
    {
      "original": "phrase that sounds unnatural",
      "improved": "more natural alternative",
      "reason": "why the original sounds off"
    }
  ],

  "structure_analysis": {
    "score": 0-100,
    "main_issue": "one sentence describing the main structural problem, if any",
    "suggestion": "specific actionable advice"
  },

  "polished_version": "A rewritten version of what they said that sounds professional, concise, and natural. Keep the same meaning but improve clarity and impact. Should be similar length or shorter.",

  "coaching_tip": "ONE specific, actionable tip they can apply immediately in their next attempt. Make it concrete and encouraging."
}

Guidelines:
- Be encouraging but honest
- Focus on 2-3 most impactful improvements, not everything
- The polished version should feel achievable, not dramatically different
- Coaching tip should be specific (not "speak more clearly" but "start with your main conclusion before explaining details")
- Consider American workplace communication norms (direct, concise, structured)
`;

async function analyzeComommunication(
  transcript: string,
  context: string
): Promise<CommunicationAnalysis> {

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: COMMUNICATION_ANALYSIS_PROMPT
          .replace('{transcript}', transcript)
          .replace('{context}', context)
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## 8. Phased Roadmap

### Phase 0: Technical Spike (1-2 days)
**Goal:** Validate Azure SDK works as expected

- [ ] Set up Azure Speech Services account
- [ ] Test pronunciation assessment with sample audio
- [ ] Verify phoneme-level scoring output
- [ ] Test real-time streaming latency
- [ ] Test GPT-4o communication analysis prompt

**Deliverable:** Working code snippets, confirmed API outputs

---

### Phase 1: POC v0.1 - Core Loop (1-2 weeks)
**Goal:** Prove the core experience works

#### Features
- [ ] Single mode: Professional Update
- [ ] Single prompt: "Give a 30-second project update"
- [ ] Recording with timer (max 30 seconds)
- [ ] Real-time transcript display
- [ ] Real-time filler word counter
- [ ] Post-recording analysis (pronunciation + communication)
- [ ] Feedback display card

#### Technical
- [ ] React Native app shell (iOS first)
- [ ] Audio recording + WebSocket streaming
- [ ] Backend: Node.js + Express
- [ ] Azure Speech integration
- [ ] GPT-4o integration
- [ ] Basic UI (functional, not polished)

#### NOT included
- No user accounts
- No data persistence
- No progress tracking
- No multiple modes

**Success Criteria:** Users voluntarily try 2-3 times in first session

---

### Phase 2: POC v0.2 - Polish & Validate (1-2 weeks)
**Goal:** Make it feel good enough for user testing

#### Features
- [ ] 5-10 professional prompts (rotation)
- [ ] Improved feedback UI
- [ ] "Try again" flow optimized
- [ ] Basic onboarding (language background)
- [ ] Audio playback of recording

#### Technical
- [ ] Improved error handling
- [ ] Loading states
- [ ] Offline handling
- [ ] Basic analytics (Mixpanel/Amplitude)

**Success Criteria:** 20+ users complete 3+ sessions; qualitative feedback positive

---

### Phase 3: MVP - Multi-mode & Retention (2-3 weeks)
**Goal:** Add modes, accounts, and progress tracking

#### Features
- [ ] User accounts (email + Google/Apple sign-in)
- [ ] Three modes: Professional, Casual, Read Aloud
- [ ] 30+ prompts across modes
- [ ] Progress dashboard
- [ ] Daily streak tracking
- [ ] Score history graphs
- [ ] "Your problem sounds" tracking
- [ ] Push notifications (daily reminder)

#### Technical
- [ ] PostgreSQL database
- [ ] User authentication (Firebase Auth)
- [ ] Session storage and retrieval
- [ ] Progress aggregation queries

---

### Phase 4: Growth Features (Post-MVP)

#### 4.1 OKR-Style Progress & Goals
- [ ] Personal speaking goals ("Reach 85 pronunciation score by Q2")
- [ ] Goal milestones with progress tracking
- [ ] Weekly/monthly progress reports
- [ ] Improvement trends visualization
- [ ] Focus areas recommendation based on data
- [ ] "Your speaking journey" timeline view
- [ ] Comparison: where you started vs. now
- [ ] Exportable progress reports (PDF)

**Goal Examples:**
| Goal Type | Example | Metrics |
|-----------|---------|---------|
| Pronunciation | "Master TH sounds" | θ accuracy: 60 → 85 |
| Fluency | "Sound more natural" | Fluency score: 70 → 85 |
| Filler Reduction | "Eliminate um/uh" | Fillers per session: 5 → 1 |
| Consistency | "30-day streak" | Streak days: 0 → 30 |
| Pace | "Slow down speech" | WPM: 170 → 140 |

**Progress Dashboard Wireframe:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 YOUR SPEAKING JOURNEY                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  🎯 CURRENT GOALS                                        │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ Master "TH" sounds              ████████░░ 78%     │ │    │
│  │  │ Started: 62 → Current: 78 → Target: 85             │ │    │
│  │  │ 🔥 7 more points to go!                            │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ Reduce filler words             ██████████ 100% ✓  │ │    │
│  │  │ Started: 5/session → Current: 1/session            │ │    │
│  │  │ 🎉 Goal achieved on Dec 1!                         │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  📈 THIS MONTH'S PROGRESS                                │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │  Pronunciation  +8 pts  ▲                          │ │    │
│  │  │  Fluency        +5 pts  ▲                          │ │    │
│  │  │  Filler words   -60%    ▼ (good!)                  │ │    │
│  │  │  Sessions       23 completed                       │ │    │
│  │  │  Streak         12 days (personal best!)           │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  💪 TOP IMPROVEMENTS                                     │    │
│  │  • "R" sounds improved 22% this month                   │    │
│  │  • Speaking pace now in ideal range (138 WPM)          │    │
│  │  • Structure scores up 15 points                        │    │
│  │                                                          │    │
│  │  🎯 FOCUS AREAS                                          │    │
│  │  • "TH" sounds still need work (try TH drills)         │    │
│  │  • Ending consonants sometimes dropped                  │    │
│  │                                                          │    │
│  │  [ + SET NEW GOAL ]        [ VIEW FULL REPORT ]         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Enhanced Pronunciation Training
- [ ] Targeted drills for problem sounds
- [ ] Minimal pairs practice (R/L, TH, etc.)
- [ ] Word stress patterns
- [ ] Intonation practice
- [ ] "Repeat after me" with comparison

#### 4.3 Conversation Mode
- [ ] AI-powered conversation simulation
- [ ] 2-3 turn exchanges
- [ ] Interview practice scenarios
- [ ] Meeting roleplay
- [ ] Feedback after conversation

#### 4.4 Gamification
- [ ] Achievement badges
- [ ] Leaderboards (optional)
- [ ] Challenges (weekly goals)
- [ ] XP system

#### 4.5 Social & Premium
- [ ] Share progress
- [ ] Premium tier (unlimited sessions, advanced features)
- [ ] Team/corporate version
- [ ] 1:1 AI coaching sessions (longer form)

---

## 9. Success Metrics

### POC Metrics
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Repeat usage in first session | 2+ attempts | Analytics event |
| Session completion rate | >80% | Started vs completed |
| Time to first feedback | <5 seconds | Timestamp diff |
| User satisfaction | "Useful" rating | Post-session survey |

### MVP Metrics
| Metric | Target | How to Measure |
|--------|--------|----------------|
| D1 retention | >40% | Return next day |
| D7 retention | >20% | Return within 7 days |
| Sessions per user per week | 3+ | Average calculation |
| NPS score | >40 | Survey |
| Streak maintenance | 5+ days avg | Database query |

### Growth Metrics
| Metric | Target | How to Measure |
|--------|--------|----------------|
| MAU | 10K+ | Unique users/month |
| Paid conversion | >5% | Free to paid |
| Referral rate | >10% | Invite tracking |
| Score improvement | +15pts/month | Before/after comparison |

---

## 10. Cost Estimates

### Per-Session Cost (30 seconds)

| Service | Cost | Notes |
|---------|------|-------|
| Azure Speech (Short Audio) | $0.005 | 30 sec @ $0.66/hr |
| GPT-4o (1K tokens) | $0.008 | Input + output |
| **Total per session** | **~$0.013** | |

### Monthly Infrastructure (at scale)

| Users | Sessions/mo | Azure | GPT-4o | Infra | Total |
|-------|-------------|-------|--------|-------|-------|
| 100 | 1,000 | $5 | $8 | $20 | ~$33 |
| 1,000 | 10,000 | $50 | $80 | $50 | ~$180 |
| 10,000 | 100,000 | $500 | $800 | $200 | ~$1,500 |
| 100,000 | 1,000,000 | $5,000 | $8,000 | $1,000 | ~$14,000 |

### POC Budget
- Azure Speech: $50 credits (free tier available)
- OpenAI API: $20 credits
- Hosting (Vercel + Railway): $0-20/month
- Apple Developer: $99/year
- **Total POC budget: <$200**

---

## Appendix A: Sample Prompts (with Hints)

### Professional Mode

**1. Project Status Update**
> "Give a 30-second project status update"

💡 Ideas to cover:
- What you accomplished this week
- Any blockers or challenges
- What's coming next
- Timeline status

---

**2. Self Introduction**
> "Introduce yourself to a new teammate"

💡 Things to mention:
- Your name and role
- What you work on day-to-day
- How long you've been with the team
- Something you're excited about

---

**3. Team Overview**
> "Explain what your team does to someone outside your company"

💡 Points to cover:
- The problem your team solves
- Who benefits from your work
- A recent win or project
- What makes your team unique

---

**4. Problem Solving Story**
> "Describe a technical problem you solved recently"

💡 Structure your answer:
- What was the problem?
- What made it challenging?
- How did you approach it?
- What was the result?

---

**5. Giving Feedback**
> "Give constructive feedback on a proposal"

💡 Framework to use:
- Start with something positive
- Share your concern clearly
- Suggest a specific improvement
- End supportively

---

**6. Deadline Extension**
> "Explain why a deadline needs to be extended"

💡 Key points:
- Acknowledge the original timeline
- Explain what changed
- Propose a new realistic date
- Share what you'll do to prevent this next time

---

**7. Meeting Summary**
> "Summarize the key points from a meeting"

💡 Include:
- Main decisions made
- Action items assigned
- Next steps
- Any open questions

---

**8. Idea Pitch**
> "Pitch an idea to your manager"

💡 Structure:
- The problem you've noticed
- Your proposed solution
- Why it would help
- What you need to try it

---

**9. Interview Introduction**
> "Respond to 'Tell me about yourself'"

💡 Cover:
- Your current role (briefly)
- A key accomplishment
- Why you're interested in this opportunity
- What you bring to the table

---

**10. Explaining Complexity**
> "Explain a complex concept to a non-technical person"

💡 Tips:
- Use a simple analogy
- Avoid jargon
- Give a real-world example
- Check for understanding

---

### Casual Mode

**1. Weekend Recap**
> "Tell me about your weekend"

💡 You could share:
- Something relaxing you did
- A place you went
- People you spent time with
- Something unexpected that happened

---

**2. Food Recommendation**
> "Describe your favorite place to eat"

💡 Talk about:
- What kind of food they serve
- Your go-to dish
- The atmosphere/vibe
- Why you keep going back

---

**3. Looking Forward**
> "What's something you're looking forward to?"

💡 Could be:
- An upcoming trip or event
- A project you're excited about
- Something small like a show or meal
- A personal goal you're working toward

---

**4. Hobby Deep Dive**
> "Tell me about a hobby you enjoy"

💡 Share:
- How you got into it
- What you enjoy about it
- How often you do it
- Something you've learned from it

---

**5. Morning Routine**
> "Describe your morning routine"

💡 Walk through:
- What time you wake up
- First thing you do
- How you get ready
- What helps you start the day right

---

**6. Entertainment Pick**
> "What's the last good movie or show you watched?"

💡 Include:
- What it's about (no spoilers!)
- What made it good
- Who you'd recommend it to
- How you discovered it

---

**7. Hometown Story**
> "Tell me about your hometown"

💡 Describe:
- Where it is
- What it's known for
- A favorite memory from there
- How it shaped you

---

**8. Dream Vacation**
> "Describe your perfect vacation"

💡 Paint a picture:
- Where would you go?
- What would you do there?
- Who would you bring?
- What makes this perfect for you?

---

**9. Free Day**
> "What would you do with an extra day off?"

💡 Be specific:
- Would you stay in or go out?
- Any activities or places?
- Who would you spend it with?
- Why this choice?

---

**10. Learning Goal**
> "Tell me about a skill you'd like to learn"

💡 Explain:
- What skill interests you
- Why you want to learn it
- What's stopping you now
- How you'd start

---

**11. Lesson Learned**
> "Share a lesson you learned recently"

💡 Reflect on:
- What happened?
- What surprised you?
- What would you do differently?
- How has it changed your approach?

---

**12. Fun Experience**
> "Share something fun you did recently"

💡 Tell us about:
- A meal you really enjoyed
- Something that made you laugh
- A place you visited
- An interesting conversation you had

---

**13. Small Win**
> "Describe a small win you had this week"

💡 Could be:
- Something you finished
- A problem you solved
- A compliment you received
- A healthy habit you maintained

---

**14. Recommendation**
> "Recommend something you've discovered lately"

💡 Share:
- What is it? (app, place, product, etc.)
- How did you find it?
- What makes it great?
- Who would you recommend it to?

---

**15. Gratitude**
> "Share something you're grateful for today"

💡 Think about:
- A person who helped you
- Something that went well
- A simple pleasure
- An opportunity you have

---

### Read Aloud Mode (Pronunciation Focus)

**1. TH Sounds**
> "I think they thought through the theory thoroughly"

🎯 Focus: TH (θ and ð) sounds
💡 Tip: Tongue should touch upper teeth

---

**2. R/L Contrasts**
> "The railway runs parallel to the rural road"

🎯 Focus: R and L distinction
💡 Tip: R = tongue doesn't touch roof; L = tongue touches

---

**3. Word Stress**
> "The record will record the photographer's photograph"

🎯 Focus: Stress shifts meaning (RE-cord vs re-CORD)
💡 Tip: Nouns stress first syllable, verbs stress second

---

**4. Connected Speech**
> "What do you want to do today?"

🎯 Focus: Natural linking and reduction
💡 Tip: "want to" → "wanna", "do you" → "d'you"

---

**5. Professional Vocabulary**
> "The infrastructure development specifically requires significant investment"

🎯 Focus: Multi-syllable professional words
💡 Tip: in-fra-STRUC-ture, spe-CI-fi-cally, sig-NI-fi-cant

---

## Appendix B: Competitor Analysis

| App | Focus | Strengths | Weaknesses |
|-----|-------|-----------|------------|
| **ELSA Speak** | Pronunciation | Excellent phoneme detection | No professional context, no communication coaching |
| **Speeko** | Public speaking | Good pace/pause analysis | No pronunciation scoring |
| **Yoodli** | Presentations | Enterprise features | Not for daily practice, complex |
| **BoldVoice** | Accent coaching | Human coach quality | Expensive, not scalable |
| **Duolingo** | Language learning | Gamification, habit | Too basic for fluent speakers |

### ProSpeaker's Unique Position
- **Only app combining** pronunciation scoring + professional communication coaching
- **Career-focused** positioning vs. general language learning
- **30-second micro-format** vs. long lessons
- **Immigrant professional** niche vs. broad ESL market

---

## Appendix C: Future Considerations

### Localization
- UI in native languages (Chinese, Spanish, Korean, etc.)
- Language-specific pronunciation guidance (e.g., Chinese speakers often struggle with R/L)
- Cultural communication style bridging

### Enterprise Version
- Team dashboards
- Manager visibility (opt-in)
- Custom prompts for company context
- SSO integration
- Bulk licensing

### Platform Expansion
- Android app
- Web app (desktop)
- Browser extension (practice before meetings)
- Slack/Teams integration

### AI Advancements
- Voice cloning for "how you could sound"
- Real-time in-meeting feedback
- Personalized curriculum based on ML
- Accent customization (American vs. British vs. Australian)

---

## Development Log

### December 13, 2025 - Mobile App Phase 1 Complete

#### Features Implemented

**1. Complete Mobile App Navigation & Screens**
| File | Description |
|------|-------------|
| `apps/mobile/App.tsx` | Main app with auth flow, tab navigation, Home screen hub |
| `apps/mobile/src/screens/SpeakScreen.tsx` | 1-Minute Workout with prompts & free talk |
| `apps/mobile/src/screens/ListenReadScreen.tsx` | News articles with Listen/Read modes |
| `apps/mobile/src/screens/ArticleDetailScreen.tsx` | Article view with TTS playback & word sync |
| `apps/mobile/src/screens/ChatScreen.tsx` | AI Chat Coach (Coming Soon) |
| `apps/mobile/src/screens/ProfileScreen.tsx` | User profile, stats, settings |
| `apps/mobile/src/screens/HomeScreen.tsx` | Home hub with 4 tile navigation |
| `apps/mobile/src/screens/AuthScreen.tsx` | Supabase login/signup |
| `apps/mobile/src/screens/PaywallScreen.tsx` | Trial expired / subscription upsell |

**2. Authentication & Access Control**
| File | Description |
|------|-------------|
| `apps/mobile/src/context/AuthContext.tsx` | Supabase auth + trial/subscription checking |
| `apps/mobile/src/lib/supabase.ts` | Supabase client configuration |

**3. Listen Mode Audio Playback (TTS)**
- Uses backend Azure TTS API: `GET /api/news/:id/audio`
- Word boundary sync: `GET /api/news/:id/boundaries`
- Real-time word highlighting during playback
- Implemented in `ArticleDetailScreen.tsx`

**4. UI Improvements - Consistent Header Layout**
All screens now have:
- Hamburger (☰) icon at top-left
- Page title centered on same row
- Description centered below
- Tab bar: lighter gray `#6B7280`

Header pattern:
```tsx
<View style={styles.headerRow}>
  <TouchableOpacity onPress={handleGoHome} style={styles.homeButton}>
    <Text style={styles.homeIcon}>☰</Text>
  </TouchableOpacity>
  <Text style={styles.title}>Page Title</Text>
  <View style={styles.headerSpacer} />
</View>
<Text style={styles.subtitle}>Description</Text>
```

**5. Configuration**
| File | Description |
|------|-------------|
| `apps/mobile/src/config/constants.ts` | API URLs, recording config, legal URLs |
| `apps/mobile/.env.example` | Environment variables template |

---

### Navigation Structure

```
RootNavigator
├── AuthScreen (if not logged in)
├── PaywallScreen (if trial expired)
└── MainNavigator (if has access)
    ├── Home (HomeScreen - hub with 4 tiles)
    └── MainTabs
        ├── SpeakTab → SpeakHome → Recording → Feedback
        ├── ListenReadTab → ListenReadHome → ArticleDetail → Recording → Feedback
        ├── ChatTab (Coming Soon)
        └── ProfileTab
```

---

### Backend API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/news` | Fetch news articles list |
| `GET /api/news/:id/audio` | Get TTS audio (MP3) |
| `GET /api/news/:id/boundaries` | Get word timing for sync |
| `POST /api/sessions/analyze` | Analyze recorded speech |

---

### Remaining Tasks / Known Issues

**High Priority:**
1. Recording requires physical iPhone (iOS Simulator has no microphone access)
2. expo-av deprecation warning in SDK 54 (still functional)

**To Implement:**
1. Read Aloud mode - recording flow exists, needs device testing
2. Chat AI Coach - currently placeholder
3. Settings screens - placeholders for Notifications, Daily Goal, Voice Settings
4. Push notifications
5. RevenueCat integration for in-app purchases

**Nice to Have:**
1. Session history persistence
2. Offline mode
3. Share feedback feature

---

### Development Commands

```bash
# Start Metro bundler
cd apps/mobile && npx expo start

# Run on iOS Simulator
npx expo start --ios

# Run on physical device (REQUIRED for microphone)
npx expo run:ios --device
```

---

### Git Status

Latest commit: `cb3829f` - feat(mobile): complete Phase 1 mobile app implementation
Branch: `main` (auto-deploys to Railway)

---

### Notes for Next Session

1. **Web app works for testing speaking** - visit https://pro-speakerbackend-production.up.railway.app/
2. **Mobile recording needs physical iPhone** - Simulator has no mic access
3. **All screens have consistent header layout** - hamburger left, title center, description below
4. **Backend TTS is Azure-based** - already implemented and working
5. **Supabase handles auth** - check `.env` for credentials
