# ProSpeaker: Listen & Read Feature Plan

## Overview

Transform ProSpeaker from a "30-Second Workout" to a "1-Minute Workout" and add a new "Listen & Read" feature with dynamic tech/AI news content.

---

## Part 1: Timer Update (30s → 60s)

### Changes Required
- Update timer duration constant from 30000ms to 60000ms
- Update UI text: "30-Second Workout" → "1-Minute Workout"
- Update prompts/hints that reference 30 seconds

### Files to Modify
- `apps/backend/public/test.html` - Timer constant, UI text
- `apps/mobile/src/screens/HomeScreen.tsx` - Title text
- `apps/mobile/src/screens/RecordingScreen.tsx` - Timer constant (if exists)

---

## Part 2: Listen & Read Feature

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ News Service │───▶│ Cache Layer  │───▶│ News Router  │       │
│  │              │    │ (Daily TTL)  │    │ /api/news    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                       │                │
│         ▼                                       ▼                │
│  ┌──────────────┐                      ┌──────────────┐         │
│  │ Web Search   │                      │ Azure TTS    │         │
│  │ (Bing/etc)   │                      │ Service      │         │
│  └──────────────┘                      └──────────────┘         │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ OpenAI       │                                               │
│  │ Summarizer   │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Home Screen                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  "1-Minute Workout" (existing prompts)                   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  "Listen & Read" Section                                 │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │    │
│  │  │ News 1  │ │ News 2  │ │ News 3  │  ... (horizontal)  │    │
│  │  │ 📰      │ │ 🤖      │ │ 💡      │                    │    │
│  │  │ Title   │ │ Title   │ │ Title   │                    │    │
│  │  └─────────┘ └─────────┘ └─────────┘                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  Listen & Read Screen                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [Listen Mode] [Read Mode] (toggle)                      │    │
│  │                                                          │    │
│  │  News Title                                              │    │
│  │  ─────────────                                           │    │
│  │  News content with word highlighting...                  │    │
│  │  Current word highlighted as TTS plays or user reads     │    │
│  │                                                          │    │
│  │  [Play/Pause] ───●────────── 0:32 / 1:00                │    │
│  │                                                          │    │
│  │  In Read Mode: Real-time pronunciation feedback          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Backend Components

#### 2.2.1 News Service (`apps/backend/src/services/NewsService.ts`)

```typescript
interface NewsArticle {
  id: string;
  title: string;
  summary: string;        // ~150 words (1-min read)
  fullContent: string;    // ~150 words detailed version
  source: string;
  sourceUrl: string;
  category: 'ai' | 'tech' | 'startup' | 'influencer';
  publishedAt: string;
  audioUrl?: string;      // Pre-generated TTS audio URL
}

interface NewsService {
  fetchDailyNews(): Promise<NewsArticle[]>;
  getNewsById(id: string): Promise<NewsArticle | null>;
  generateAudio(articleId: string): Promise<string>; // Returns audio URL
}
```

**Responsibilities:**
- Fetch news from multiple sources (web search, X/Twitter API, tech blogs)
- Use OpenAI to summarize articles to ~150 words (1-minute reading pace)
- Cache results with 24-hour TTL
- Generate TTS audio on-demand or batch

#### 2.2.2 News Sources Strategy

```typescript
// Priority order for news gathering
const NEWS_SOURCES = [
  {
    type: 'web_search',
    query: 'AI news today site:techcrunch.com OR site:theverge.com OR site:wired.com',
    limit: 4
  },
  {
    type: 'web_search',
    query: 'OpenAI Anthropic Google AI news',
    limit: 3
  },
  {
    type: 'twitter_search',  // If X API available
    query: 'from:elonmusk OR from:sama OR from:ylecun AI',
    limit: 3
  }
];
```

#### 2.2.3 Azure TTS Service (`apps/backend/src/infrastructure/speech/AzureTTSService.ts`)

```typescript
interface TTSOptions {
  text: string;
  voice?: string;        // Default: 'en-US-JennyNeural'
  rate?: string;         // Default: '0%' (normal speed)
  pitch?: string;        // Default: '0%'
  outputFormat?: string; // Default: 'audio-16khz-128kbitrate-mono-mp3'
}

interface AzureTTSService {
  synthesize(options: TTSOptions): Promise<Buffer>;
  getAvailableVoices(): Promise<Voice[]>;
}
```

#### 2.2.4 News API Routes (`apps/backend/src/api/routes/news.ts`)

```typescript
// GET /api/news
// Returns list of today's news summaries
// Response: { articles: NewsArticle[] }

// GET /api/news/:id
// Returns full article with audio URL
// Response: NewsArticle

// GET /api/news/:id/audio
// Returns TTS audio stream for the article
// Response: audio/mpeg stream

// POST /api/news/refresh (admin only, optional)
// Force refresh news cache
```

#### 2.2.5 Cache Layer

```typescript
// Simple in-memory cache with file backup for persistence
interface NewsCache {
  articles: NewsArticle[];
  lastUpdated: string;    // ISO timestamp
  expiresAt: string;      // 24 hours from lastUpdated
}

// Storage: apps/backend/data/news-cache.json
```

### 2.3 Frontend Components

#### 2.3.1 Home Screen Updates

Add "Listen & Read" section below existing prompts:

```tsx
// Horizontal scrollable news cards
<View style={styles.listenReadSection}>
  <Text style={styles.sectionTitle}>Listen & Read</Text>
  <Text style={styles.sectionSubtitle}>Practice with today's tech news</Text>

  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {newsArticles.map(article => (
      <NewsCard
        key={article.id}
        article={article}
        onPress={() => navigation.navigate('ListenRead', { articleId: article.id })}
      />
    ))}
  </ScrollView>
</View>
```

#### 2.3.2 Listen & Read Screen (`apps/mobile/src/screens/ListenReadScreen.tsx`)

**Two Modes:**

1. **Listen Mode**
   - Plays TTS audio of the article
   - Highlights current word/sentence as audio plays
   - User can pause, rewind, adjust speed
   - Progress bar shows position in article

2. **Read Mode**
   - Shows full text with word-by-word display
   - User reads aloud while recording
   - Real-time pronunciation feedback (reuses existing Azure Speech)
   - Highlights mispronounced words
   - Shows pace indicator (too fast/slow/good)
   - 60-second timer

**State Machine:**
```
IDLE → LISTENING → PAUSED → IDLE
IDLE → READING → ANALYZING → RESULTS
```

#### 2.3.3 Word Synchronization

For Listen mode, we need word-level timestamps from TTS:
- Azure TTS provides SSML with word boundaries
- Use `viseme` and `wordBoundary` events from Azure Speech SDK

```typescript
// Word boundary event from Azure TTS
interface WordBoundary {
  word: string;
  startTime: number;  // milliseconds
  endTime: number;
}
```

### 2.4 Data Flow

#### News Fetch Flow (Daily/On-Demand)
```
1. Cron job or first request triggers refresh
2. NewsService fetches from web search APIs
3. For each article:
   a. Extract main content
   b. Send to OpenAI: "Summarize to ~150 words for 1-min read"
   c. Store in cache
4. Optionally pre-generate TTS audio for top articles
5. Return cached articles to frontend
```

#### Listen Mode Flow
```
1. User selects article
2. Frontend requests /api/news/:id/audio
3. Backend generates TTS (or returns cached)
4. Audio streams to frontend with word boundaries
5. Frontend highlights words in sync with audio
6. User can pause/resume/seek
```

#### Read Mode Flow
```
1. User selects article and chooses "Read" mode
2. Frontend shows article text as reference
3. User taps "Start" and begins reading aloud
4. Audio streams to backend via WebSocket (existing flow)
5. Azure Speech transcribes and assesses pronunciation
6. Frontend shows real-time feedback:
   - Current word highlighted
   - Mispronounced words marked red
   - Pace indicator (WPM vs target ~150)
7. After 60s or completion, show results
```

### 2.5 New Files to Create

```
apps/backend/src/
├── services/
│   └── NewsService.ts           # News fetching & caching
├── infrastructure/
│   └── speech/
│       └── AzureTTSService.ts   # Text-to-speech
├── api/
│   └── routes/
│       └── news.ts              # News API endpoints
└── data/
    └── news-cache.json          # Persisted cache (gitignored)

apps/mobile/src/
├── screens/
│   └── ListenReadScreen.tsx     # New screen
├── components/
│   ├── NewsCard.tsx             # Card for home screen
│   └── WordHighlighter.tsx      # Synced text display
├── hooks/
│   └── useNews.ts               # News fetching hook
└── services/
    └── newsApi.ts               # API client
```

### 2.6 Environment Variables

```env
# Existing
AZURE_SPEECH_KEY=xxx
AZURE_SPEECH_REGION=xxx
OPENAI_API_KEY=xxx

# New (optional, for better news sources)
BING_SEARCH_KEY=xxx              # For Bing News API
TWITTER_BEARER_TOKEN=xxx         # For X/Twitter API (optional)
```

---

## Part 3: Implementation Phases

### Phase 1: Timer Update (Quick Win)
- [ ] Update timer from 30s to 60s
- [ ] Update all "30-second" text to "1-minute"
- [ ] Test existing functionality

### Phase 2: Backend News Infrastructure
- [ ] Create NewsService with web search integration
- [ ] Create OpenAI summarization logic
- [ ] Implement caching layer
- [ ] Create news API routes
- [ ] Add to test.html for validation

### Phase 3: Azure TTS Integration
- [ ] Create AzureTTSService
- [ ] Implement audio generation endpoint
- [ ] Add word boundary extraction
- [ ] Test audio streaming

### Phase 4: Frontend Listen Mode
- [ ] Add news section to Home screen
- [ ] Create ListenReadScreen
- [ ] Implement audio playback with word sync
- [ ] Add playback controls

### Phase 5: Frontend Read Mode
- [ ] Implement read-along UI
- [ ] Connect to existing speech analysis
- [ ] Add real-time pronunciation feedback
- [ ] Show pace indicator
- [ ] Display results

### Phase 6: Polish & Testing
- [ ] Error handling for news fetch failures
- [ ] Loading states
- [ ] Empty states (no news available)
- [ ] Performance optimization
- [ ] Mobile app testing

---

## Part 4: API Contracts

### GET /api/news
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "abc123",
        "title": "OpenAI Releases GPT-5",
        "summary": "OpenAI announced GPT-5 today with significant improvements...",
        "source": "TechCrunch",
        "category": "ai",
        "publishedAt": "2024-12-07T10:00:00Z",
        "estimatedReadTime": 60,
        "wordCount": 150
      }
    ],
    "lastUpdated": "2024-12-07T08:00:00Z"
  }
}
```

### GET /api/news/:id
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "OpenAI Releases GPT-5",
    "summary": "...",
    "fullContent": "OpenAI announced GPT-5 today...",
    "source": "TechCrunch",
    "sourceUrl": "https://techcrunch.com/...",
    "category": "ai",
    "publishedAt": "2024-12-07T10:00:00Z",
    "audioUrl": "/api/news/abc123/audio",
    "wordBoundaries": [
      { "word": "OpenAI", "startMs": 0, "endMs": 450 },
      { "word": "announced", "startMs": 450, "endMs": 920 }
    ]
  }
}
```

### GET /api/news/:id/audio
- Returns: `audio/mpeg` stream
- Headers: `Content-Length`, `Accept-Ranges` for seeking

---

## Questions/Decisions

1. **News refresh trigger**: Manual button vs automatic on app open vs background job?
   - Recommendation: Automatic on first request if cache expired

2. **Number of articles**: Show all 10 or paginate?
   - Recommendation: Show 10 in horizontal scroll, load more on demand

3. **Audio pre-generation**: Generate all 10 on refresh or on-demand?
   - Recommendation: On-demand to save TTS costs, cache after first generation

4. **Read mode completion**: Stop at 60s or let user finish article?
   - Recommendation: 60s timer with option to continue

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Timer Update | Small |
| Phase 2: Backend News | Medium |
| Phase 3: Azure TTS | Medium |
| Phase 4: Listen Mode | Medium |
| Phase 5: Read Mode | Medium |
| Phase 6: Polish | Small |

---

Ready for review. Please confirm if this plan aligns with your vision.
