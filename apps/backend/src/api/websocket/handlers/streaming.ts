import type { Server, Socket } from 'socket.io';
import { AzureStreamingSpeechAnalyzer, type StreamingResult } from '../../../infrastructure/speech/index.js';
import { OpenAICommunicationAnalyzer } from '../../../infrastructure/llm/index.js';
import { logger } from '../../../shared/utils/logger.js';
import type { SessionMode } from '../../../shared/types/index.js';

// Filler words to detect in real-time
const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah',
  'like', 'you know', 'i mean',
  'so', 'basically', 'actually',
  'kind of', 'sort of',
  'right', 'okay',
];

interface SessionState {
  analyzer: AzureStreamingSpeechAnalyzer;
  mode: SessionMode;
  promptText?: string;
  referenceText?: string;
  fullTranscript: string;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  wordCount: number;
  startTime: number;
  lastUpdate: number;
  allWords: Array<{ word: string; accuracy: number }>;
  pronunciationScores: number[];
}

interface StreamingConfig {
  azureKey: string;
  azureRegion: string;
  openaiKey: string;
  openaiModel: string;
}

/**
 * Count filler words in transcript
 */
function countFillers(transcript: string): { total: number; breakdown: Record<string, number> } {
  const lower = transcript.toLowerCase();
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) {
      breakdown[filler] = matches.length;
      total += matches.length;
    }
  }

  return { total, breakdown };
}

/**
 * Calculate words per minute
 */
function calculateWPM(wordCount: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  const minutes = durationMs / 60000;
  return Math.round(wordCount / minutes);
}

/**
 * Set up WebSocket handlers for streaming audio
 */
export function setupStreamingHandlers(io: Server, config: StreamingConfig): void {
  // Store active sessions
  const sessions = new Map<string, SessionState>();

  io.on('connection', (socket: Socket) => {
    logger.info('Client connected', { socketId: socket.id });

    /**
     * Start streaming session
     * Client sends: { mode: SessionMode, promptText?: string }
     */
    socket.on('session:start', async (data: { mode: SessionMode; promptText?: string; referenceText?: string }) => {
      try {
        // Clean up any existing session
        if (sessions.has(socket.id)) {
          const existing = sessions.get(socket.id)!;
          await existing.analyzer.stop();
          sessions.delete(socket.id);
        }

        const analyzer = new AzureStreamingSpeechAnalyzer({
          subscriptionKey: config.azureKey,
          region: config.azureRegion,
        });

        const sessionState: SessionState = {
          analyzer,
          mode: data.mode,
          promptText: data.promptText,
          referenceText: data.referenceText,
          fullTranscript: '',
          fillerCount: 0,
          fillerBreakdown: {},
          wordCount: 0,
          startTime: Date.now(),
          lastUpdate: Date.now(),
          allWords: [],
          pronunciationScores: [],
        };

        // Handle streaming results
        analyzer.on('result', (result: StreamingResult) => {
          sessionState.lastUpdate = Date.now();

          if (result.isFinal && result.transcript) {
            // Append to full transcript
            sessionState.fullTranscript += (sessionState.fullTranscript ? ' ' : '') + result.transcript;

            // Update word count
            sessionState.wordCount = sessionState.fullTranscript.split(/\s+/).filter(w => w.length > 0).length;

            // Update filler count
            const fillers = countFillers(sessionState.fullTranscript);
            sessionState.fillerCount = fillers.total;
            sessionState.fillerBreakdown = fillers.breakdown;

            // Accumulate words with pronunciation scores
            if (result.words) {
              sessionState.allWords.push(...result.words);
            }

            // Track pronunciation scores
            if (result.pronunciationScore !== undefined) {
              sessionState.pronunciationScores.push(result.pronunciationScore);
            }
          }

          // Calculate current WPM
          const duration = Date.now() - sessionState.startTime;
          const wpm = calculateWPM(sessionState.wordCount, duration);

          // Calculate mispronounced word count (accuracy < 70)
          const mispronounced = sessionState.allWords.filter(w => w.accuracy < 70);

          // Send update to client
          socket.emit('session:update', {
            type: result.isFinal ? 'final' : 'interim',
            transcript: result.isFinal ? sessionState.fullTranscript : result.transcript,
            fillerCount: sessionState.fillerCount,
            fillerBreakdown: sessionState.fillerBreakdown,
            wordCount: sessionState.wordCount,
            wpm,
            durationMs: duration,
            pronunciationScore: result.pronunciationScore,
            words: result.words,
            allWords: sessionState.allWords,
            mispronouncedCount: mispronounced.length,
            mispronouncedWords: mispronounced.map(w => w.word),
            timestamp: result.timestamp,
          });
        });

        analyzer.on('error', (error: Error) => {
          logger.error('Streaming error', { socketId: socket.id, error: error.message });
          socket.emit('session:error', { message: error.message });
        });

        analyzer.on('ended', () => {
          logger.info('Streaming session ended', { socketId: socket.id });
        });

        // Start the analyzer
        await analyzer.start({
          locale: 'en-US',
          enablePronunciation: true,
        });

        sessions.set(socket.id, sessionState);

        socket.emit('session:started', {
          message: 'Streaming session started',
          timestamp: sessionState.startTime,
        });

        logger.info('Streaming session started', {
          socketId: socket.id,
          mode: data.mode,
        });
      } catch (error) {
        logger.error('Failed to start session', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error),
        });
        socket.emit('session:error', {
          message: 'Failed to start streaming session',
        });
      }
    });

    /**
     * Receive audio chunk
     * Client sends: ArrayBuffer or Buffer (raw PCM audio)
     */
    socket.on('audio:chunk', (chunk: ArrayBuffer | Buffer) => {
      const session = sessions.get(socket.id);
      if (!session) {
        socket.emit('session:error', { message: 'No active session' });
        return;
      }

      try {
        // Handle both ArrayBuffer (from browser) and Buffer (from Node.js)
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        session.analyzer.writeAudioChunk(buffer);
      } catch (error) {
        logger.error('Error writing audio chunk', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    /**
     * Stop streaming and get final analysis
     */
    socket.on('session:stop', async () => {
      const session = sessions.get(socket.id);
      if (!session) {
        socket.emit('session:error', { message: 'No active session' });
        return;
      }

      try {
        // Stop the speech analyzer
        await session.analyzer.stop();

        const duration = Date.now() - session.startTime;

        // If we have a transcript, run analysis
        if (session.fullTranscript.trim().length > 0) {
          // Calculate pronunciation stats from accumulated words
          const avgPronunciationScore = session.pronunciationScores.length > 0
            ? Math.round(session.pronunciationScores.reduce((a, b) => a + b, 0) / session.pronunciationScores.length)
            : 0;

          const mispronounced = session.allWords.filter(w => w.accuracy < 70);
          const avgWordAccuracy = session.allWords.length > 0
            ? Math.round(session.allWords.reduce((sum, w) => sum + w.accuracy, 0) / session.allWords.length)
            : 0;

          // For read_practice mode, skip OpenAI and focus on pronunciation feedback
          if (session.mode === 'read_practice') {
            socket.emit('session:analyzing', {
              message: 'Calculating pronunciation results...',
            });

            // Generate feedback based on pronunciation scores
            const tips: string[] = [];
            if (mispronounced.length > 0) {
              const uniqueWords = [...new Set(mispronounced.map(w => w.word))];
              tips.push(`Focus on these words: ${uniqueWords.slice(0, 5).join(', ')}`);
            }
            if (avgWordAccuracy < 70) {
              tips.push('Try slowing down and pronouncing each syllable clearly');
            }
            if (session.wordCount < 100 && duration > 30000) {
              tips.push('Try to maintain a steady reading pace');
            }

            socket.emit('session:complete', {
              transcript: session.fullTranscript,
              duration,
              wordCount: session.wordCount,
              wpm: calculateWPM(session.wordCount, duration),
              fillerCount: session.fillerCount,
              fillerBreakdown: session.fillerBreakdown,
              pronunciation: {
                overallScore: avgPronunciationScore || avgWordAccuracy,
                wordAccuracy: avgWordAccuracy,
                mispronouncedCount: mispronounced.length,
                mispronouncedWords: mispronounced.map(w => ({ word: w.word, accuracy: w.accuracy })),
              },
              allWords: session.allWords,
              communication: tips.length > 0 ? { coachingTip: tips.join('. ') + '.' } : undefined,
            });
          } else {
            // For other modes, run full OpenAI communication analysis
            socket.emit('session:analyzing', {
              message: 'Analyzing communication...',
            });

            try {
              const communicationAnalyzer = new OpenAICommunicationAnalyzer({
                apiKey: config.openaiKey,
                model: config.openaiModel,
              });

              const communicationResult = await communicationAnalyzer.analyze(
                session.fullTranscript,
                {
                  mode: session.mode,
                  promptText: session.promptText,
                }
              );

              // Send final results
              socket.emit('session:complete', {
                transcript: session.fullTranscript,
                duration,
                wordCount: session.wordCount,
                wpm: calculateWPM(session.wordCount, duration),
                fillerCount: session.fillerCount,
                fillerBreakdown: session.fillerBreakdown,
                communication: communicationResult,
                pronunciation: {
                  overallScore: avgPronunciationScore || avgWordAccuracy,
                  wordAccuracy: avgWordAccuracy,
                  mispronouncedCount: mispronounced.length,
                },
                allWords: session.allWords,
              });
            } catch (analysisError) {
              logger.error('Communication analysis failed', {
                socketId: socket.id,
                error: analysisError instanceof Error ? analysisError.message : String(analysisError),
              });

              // Send partial results without communication analysis
              socket.emit('session:complete', {
                transcript: session.fullTranscript,
                duration,
                wordCount: session.wordCount,
                wpm: calculateWPM(session.wordCount, duration),
                fillerCount: session.fillerCount,
                fillerBreakdown: session.fillerBreakdown,
                pronunciation: {
                  overallScore: avgPronunciationScore || avgWordAccuracy,
                  wordAccuracy: avgWordAccuracy,
                  mispronouncedCount: mispronounced.length,
                },
                allWords: session.allWords,
              });
            }
          }
        } else {
          socket.emit('session:complete', {
            transcript: '',
            duration,
            wordCount: 0,
            wpm: 0,
            fillerCount: 0,
            fillerBreakdown: {},
            error: 'No speech detected',
          });
        }

        sessions.delete(socket.id);
        logger.info('Session completed', { socketId: socket.id, duration });
      } catch (error) {
        logger.error('Error stopping session', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error),
        });
        socket.emit('session:error', { message: 'Error stopping session' });
        sessions.delete(socket.id);
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', async () => {
      const session = sessions.get(socket.id);
      if (session) {
        try {
          await session.analyzer.stop();
        } catch {
          // Ignore cleanup errors
        }
        sessions.delete(socket.id);
      }
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });
}
