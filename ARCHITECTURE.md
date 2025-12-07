# ProSpeaker Architecture & Design Principles

## Core Design Principles

### 1. Clean Architecture (Layered)
```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Controllers, WebSocket handlers, API routes                 │
│  - Handles HTTP/WS requests                                  │
│  - Input validation (Zod schemas)                            │
│  - Response formatting                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Use cases, Services, Orchestrators                          │
│  - Business logic coordination                               │
│  - Transaction boundaries                                    │
│  - Event dispatching                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│  Entities, Value Objects, Domain Services                    │
│  - Core business rules                                       │
│  - No external dependencies                                  │
│  - Pure TypeScript                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│  Repositories, External Services, Database                   │
│  - Azure Speech SDK adapter                                  │
│  - OpenAI adapter                                            │
│  - Database implementations                                  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Dependency Inversion
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- External services accessed through adapters

```typescript
// BAD: Direct dependency
class SessionService {
  analyze(audio: Buffer) {
    const azure = new AzureSpeechSDK(); // Direct coupling
    return azure.assess(audio);
  }
}

// GOOD: Dependency injection
interface ISpeechAnalyzer {
  assessPronunciation(audio: Buffer): Promise<PronunciationResult>;
}

class SessionService {
  constructor(private speechAnalyzer: ISpeechAnalyzer) {}

  analyze(audio: Buffer) {
    return this.speechAnalyzer.assessPronunciation(audio);
  }
}
```

### 3. Single Responsibility Principle
Each module/class has one reason to change:

| Module | Responsibility |
|--------|---------------|
| `SpeechAnalyzer` | Pronunciation assessment only |
| `CommunicationCoach` | Grammar/structure feedback only |
| `SessionService` | Orchestrates the full analysis flow |
| `ProgressTracker` | Tracks user progress only |

### 4. Interface Segregation
Small, focused interfaces instead of large ones:

```typescript
// BAD: Fat interface
interface IAnalyzer {
  assessPronunciation(): Promise<Result>;
  analyzeGrammar(): Promise<Result>;
  generateFeedback(): Promise<Result>;
  trackProgress(): Promise<void>;
}

// GOOD: Segregated interfaces
interface IPronunciationAnalyzer {
  assess(audio: Buffer): Promise<PronunciationResult>;
}

interface ICommunicationAnalyzer {
  analyze(transcript: string): Promise<CommunicationResult>;
}

interface IProgressTracker {
  track(sessionResult: SessionResult): Promise<void>;
}
```

---

## Code Organization

### Backend Structure
```
apps/backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/
│   │   ├── index.ts             # Configuration loader
│   │   └── env.ts               # Environment validation
│   │
│   ├── api/                     # PRESENTATION LAYER
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── sessions.ts      # Session endpoints
│   │   │   ├── prompts.ts       # Prompt endpoints
│   │   │   └── progress.ts      # Progress endpoints
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   ├── validation.ts
│   │   │   └── auth.ts
│   │   └── websocket/
│   │       ├── index.ts
│   │       └── handlers/
│   │           └── streaming.ts  # Real-time audio streaming
│   │
│   ├── services/                # APPLICATION LAYER
│   │   ├── SessionService.ts    # Main orchestrator
│   │   ├── AnalysisService.ts   # Combines pronunciation + communication
│   │   └── ProgressService.ts   # Progress tracking
│   │
│   ├── domain/                  # DOMAIN LAYER
│   │   ├── entities/
│   │   │   ├── Session.ts
│   │   │   ├── User.ts
│   │   │   └── Prompt.ts
│   │   ├── value-objects/
│   │   │   ├── Score.ts
│   │   │   ├── Phoneme.ts
│   │   │   └── FillerWord.ts
│   │   └── interfaces/
│   │       ├── ISpeechAnalyzer.ts
│   │       ├── ICommunicationAnalyzer.ts
│   │       └── IRepository.ts
│   │
│   ├── infrastructure/          # INFRASTRUCTURE LAYER
│   │   ├── speech/
│   │   │   ├── AzureSpeechAnalyzer.ts
│   │   │   └── types.ts
│   │   ├── llm/
│   │   │   ├── OpenAICommunicationAnalyzer.ts
│   │   │   └── prompts.ts
│   │   └── database/
│   │       └── repositories/
│   │
│   ├── shared/                  # Cross-cutting concerns
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── errors.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── audio.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   └── tests/                   # Test files
│       ├── speech-test.ts
│       └── integration/
```

---

## Key Patterns

### 1. Result Pattern (No Throwing for Expected Errors)
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
async function analyzeSession(audio: Buffer): Promise<Result<SessionAnalysis>> {
  if (audio.length === 0) {
    return { success: false, error: new ValidationError('Empty audio') };
  }

  const result = await speechAnalyzer.assess(audio);
  return { success: true, data: result };
}
```

### 2. Factory Pattern for Complex Objects
```typescript
class SessionAnalysisFactory {
  static create(
    pronunciation: PronunciationResult,
    communication: CommunicationResult
  ): SessionAnalysis {
    return {
      sessionId: uuid(),
      pronunciation: this.mapPronunciation(pronunciation),
      communication: this.mapCommunication(communication),
      overallScore: this.calculateOverall(pronunciation, communication),
      createdAt: new Date()
    };
  }
}
```

### 3. Strategy Pattern for Different Analysis Modes
```typescript
interface IAnalysisStrategy {
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
}

class ProfessionalModeStrategy implements IAnalysisStrategy {
  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    // Focus on structure, conciseness, professional tone
  }
}

class CasualModeStrategy implements IAnalysisStrategy {
  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    // Focus on naturalness, conversational flow
  }
}

class ReadAloudStrategy implements IAnalysisStrategy {
  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    // Focus purely on pronunciation accuracy
  }
}
```

### 4. Adapter Pattern for External Services
```typescript
// Abstract interface
interface ISpeechAnalyzer {
  assessPronunciation(
    audio: Buffer,
    options: AssessmentOptions
  ): Promise<PronunciationResult>;
}

// Azure implementation
class AzureSpeechAnalyzer implements ISpeechAnalyzer {
  constructor(private config: AzureConfig) {}

  async assessPronunciation(
    audio: Buffer,
    options: AssessmentOptions
  ): Promise<PronunciationResult> {
    // Azure-specific implementation
    // Maps Azure response to our domain model
  }
}

// Easy to swap for testing or different provider
class MockSpeechAnalyzer implements ISpeechAnalyzer {
  async assessPronunciation(): Promise<PronunciationResult> {
    return mockResult;
  }
}
```

---

## Error Handling Strategy

### Error Types
```typescript
// Base error
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Specific errors
class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

class ExternalServiceError extends AppError {
  constructor(service: string, originalError: Error) {
    super(
      `${service} service failed: ${originalError.message}`,
      'EXTERNAL_SERVICE_ERROR',
      502
    );
  }
}

class AudioProcessingError extends AppError {
  constructor(message: string) {
    super(message, 'AUDIO_PROCESSING_ERROR', 422);
  }
}
```

### Global Error Handler
```typescript
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('Error:', { error: err, path: req.path });

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // Unexpected errors - don't leak details
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

---

## Validation Strategy (Zod)

```typescript
import { z } from 'zod';

// Request schemas
export const CreateSessionSchema = z.object({
  mode: z.enum(['free_talk', 'professional', 'casual', 'read_aloud']),
  promptId: z.string().uuid().optional(),
  userTopic: z.string().max(500).optional()
});

export const AudioChunkSchema = z.object({
  sessionId: z.string().uuid(),
  chunk: z.instanceof(Buffer),
  sequence: z.number().int().positive()
});

// Validation middleware
export const validate = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.message);
    }
    req.body = result.data;
    next();
  };
};
```

---

## Configuration Management

```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // Azure Speech
  AZURE_SPEECH_KEY: z.string().min(1),
  AZURE_SPEECH_REGION: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o'),

  // Database (future)
  DATABASE_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}
```

---

## Testing Strategy

### Unit Tests
- Test domain logic in isolation
- Mock external dependencies
- Fast execution

### Integration Tests
- Test API endpoints
- Test database operations
- Use test containers

### E2E Tests (Future)
- Full flow tests with real services
- Run against staging environment

```typescript
// Example unit test
describe('SessionService', () => {
  let sessionService: SessionService;
  let mockSpeechAnalyzer: ISpeechAnalyzer;
  let mockCommunicationAnalyzer: ICommunicationAnalyzer;

  beforeEach(() => {
    mockSpeechAnalyzer = {
      assessPronunciation: vi.fn().mockResolvedValue(mockPronunciationResult)
    };
    mockCommunicationAnalyzer = {
      analyze: vi.fn().mockResolvedValue(mockCommunicationResult)
    };

    sessionService = new SessionService(
      mockSpeechAnalyzer,
      mockCommunicationAnalyzer
    );
  });

  it('should combine pronunciation and communication analysis', async () => {
    const result = await sessionService.analyzeSession(mockAudio, mockTranscript);

    expect(result.success).toBe(true);
    expect(mockSpeechAnalyzer.assessPronunciation).toHaveBeenCalledWith(mockAudio);
    expect(mockCommunicationAnalyzer.analyze).toHaveBeenCalledWith(mockTranscript);
  });
});
```

---

## API Design Principles

### RESTful Conventions
```
POST   /api/sessions           # Create new session
GET    /api/sessions/:id       # Get session details
GET    /api/sessions           # List user sessions

GET    /api/prompts            # List prompts
GET    /api/prompts/daily      # Get today's prompt

GET    /api/progress           # Get user progress
GET    /api/progress/goals     # Get user goals
POST   /api/progress/goals     # Create new goal
```

### Response Format
```typescript
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Audio duration must be between 5 and 30 seconds"
  }
}

// Paginated response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "hasMore": true
  }
}
```

---

## Performance Considerations

1. **Audio Streaming**: Process audio in chunks, don't wait for full upload
2. **Parallel Processing**: Run Azure + OpenAI analysis concurrently
3. **Caching**: Cache prompts, user preferences
4. **Connection Pooling**: Reuse database connections
5. **Rate Limiting**: Protect against abuse

```typescript
// Parallel analysis example
async analyzeSession(audio: Buffer, transcript: string): Promise<SessionAnalysis> {
  const [pronunciationResult, communicationResult] = await Promise.all([
    this.speechAnalyzer.assessPronunciation(audio),
    this.communicationAnalyzer.analyze(transcript)
  ]);

  return SessionAnalysisFactory.create(pronunciationResult, communicationResult);
}
```

---

## Security Principles

1. **Input Validation**: Validate all inputs with Zod
2. **Authentication**: JWT tokens for API access
3. **Rate Limiting**: Prevent abuse
4. **HTTPS Only**: All traffic encrypted
5. **Secrets Management**: Environment variables, never in code
6. **Audio Privacy**: Don't store audio longer than necessary
