import { Server, Socket } from 'socket.io';
import { ChatService } from '../../../services/ChatService.js';
import {
  chatStartSchema,
  chatAudioSchema,
  chatEndSchema,
  type ChatStartResponse,
  type ChatTurnResponse,
  type ChatSummaryResponse,
  type ChatErrorResponse,
  type ChatMode,
} from '../../../shared/types/chat.js';
import { logger } from '../../../shared/utils/logger.js';

interface ActiveChatSession {
  conversationId: string;
  mode: ChatMode;
  startedAt: number;
  userId?: string;
}

/**
 * Set up WebSocket handlers for chat feature
 * Events:
 *   - chat:start   -> Start a new conversation
 *   - chat:audio   -> Send user audio for processing
 *   - chat:end     -> End conversation and get summary
 *   - chat:started -> Conversation started (response)
 *   - chat:processing -> Turn being processed
 *   - chat:turn    -> Turn completed (response)
 *   - chat:generating-summary -> Summary being generated
 *   - chat:summary -> Conversation summary (response)
 *   - chat:error   -> Error occurred
 */
export function setupChatHandlers(io: Server, chatService: ChatService): void {
  // Track active chat sessions per socket
  const activeSessions = new Map<string, ActiveChatSession>();

  io.on('connection', (socket: Socket) => {
    logger.debug('Chat WebSocket client connected', { socketId: socket.id });

    // ============================================================
    // CHAT:START - Initialize a new conversation
    // ============================================================
    socket.on('chat:start', async (payload: unknown) => {
      const endTimer = logger.time(`chat:start [${socket.id}]`);

      try {
        // Validate payload
        const validation = chatStartSchema.safeParse(payload);
        if (!validation.success) {
          const errorResponse: ChatErrorResponse = {
            code: 'VALIDATION_ERROR',
            message: `Invalid payload: ${validation.error.message}`,
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        const { mode, userId } = validation.data;

        // Check if socket already has an active session
        const existingSession = activeSessions.get(socket.id);
        if (existingSession) {
          const errorResponse: ChatErrorResponse = {
            code: 'SESSION_EXISTS',
            message: 'A chat session is already active. End it first.',
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        // Start conversation
        const result = await chatService.startConversation(mode, userId);

        if (!result.success) {
          const errorResponse: ChatErrorResponse = {
            code: 'START_FAILED',
            message: result.error.message,
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        // Track session
        activeSessions.set(socket.id, {
          conversationId: result.data.conversationId,
          mode,
          startedAt: Date.now(),
          userId,
        });

        // Send success response
        const response: ChatStartResponse = {
          conversationId: result.data.conversationId,
          greeting: result.data.greeting,
        };

        socket.emit('chat:started', response);

        logger.info('Chat session started', {
          socketId: socket.id,
          conversationId: result.data.conversationId,
          mode,
        });

        endTimer();
      } catch (error) {
        logger.error('chat:start error', { error, socketId: socket.id });
        const errorResponse: ChatErrorResponse = {
          code: 'INTERNAL_ERROR',
          message: 'Failed to start chat session',
        };
        socket.emit('chat:error', errorResponse);
        endTimer();
      }
    });

    // ============================================================
    // CHAT:AUDIO - Process user audio turn
    // ============================================================
    socket.on('chat:audio', async (payload: unknown) => {
      const endTimer = logger.time(`chat:audio [${socket.id}]`);

      try {
        // Validate payload
        const validation = chatAudioSchema.safeParse(payload);
        if (!validation.success) {
          const errorResponse: ChatErrorResponse = {
            code: 'VALIDATION_ERROR',
            message: `Invalid payload: ${validation.error.message}`,
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        const { conversationId, audio } = validation.data;

        // Verify session
        const session = activeSessions.get(socket.id);
        if (!session || session.conversationId !== conversationId) {
          const errorResponse: ChatErrorResponse = {
            code: 'SESSION_NOT_FOUND',
            message: 'No active chat session found',
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        // Emit processing state
        socket.emit('chat:processing', { conversationId });

        // Process the turn
        const result = await chatService.processUserTurn({
          conversationId,
          audioBase64: audio,
          mode: session.mode,
        });

        if (!result.success) {
          const errorResponse: ChatErrorResponse = {
            code: 'PROCESS_FAILED',
            message: result.error.message,
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        // Send turn response
        const response: ChatTurnResponse = {
          userMessage: {
            id: '', // Will be populated by service
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

        logger.info('Chat turn completed', {
          socketId: socket.id,
          conversationId,
          transcriptLength: result.data.userTranscript.length,
        });

        endTimer();
      } catch (error) {
        logger.error('chat:audio error', { error, socketId: socket.id });
        const errorResponse: ChatErrorResponse = {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process audio',
        };
        socket.emit('chat:error', errorResponse);
        endTimer();
      }
    });

    // ============================================================
    // CHAT:END - End conversation and get summary
    // ============================================================
    socket.on('chat:end', async (payload: unknown) => {
      const endTimer = logger.time(`chat:end [${socket.id}]`);

      try {
        // Validate payload
        const validation = chatEndSchema.safeParse(payload);
        if (!validation.success) {
          const errorResponse: ChatErrorResponse = {
            code: 'VALIDATION_ERROR',
            message: `Invalid payload: ${validation.error.message}`,
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        const { conversationId } = validation.data;

        // Verify session
        const session = activeSessions.get(socket.id);
        if (!session || session.conversationId !== conversationId) {
          const errorResponse: ChatErrorResponse = {
            code: 'SESSION_NOT_FOUND',
            message: 'No active chat session found',
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        // Emit generating state
        socket.emit('chat:generating-summary', { conversationId });

        // End conversation and get summary
        const result = await chatService.endConversation(conversationId);

        if (!result.success) {
          const errorResponse: ChatErrorResponse = {
            code: 'SUMMARY_FAILED',
            message: result.error.message,
          };
          socket.emit('chat:error', errorResponse);
          endTimer();
          return;
        }

        // Send summary response
        const response: ChatSummaryResponse = {
          conversationId,
          summary: result.data,
        };

        socket.emit('chat:summary', response);

        // Clean up session tracking
        activeSessions.delete(socket.id);

        const durationSeconds = Math.floor((Date.now() - session.startedAt) / 1000);
        logger.info('Chat session ended', {
          socketId: socket.id,
          conversationId,
          durationSeconds,
          overallScore: result.data.overallScore,
        });

        endTimer();
      } catch (error) {
        logger.error('chat:end error', { error, socketId: socket.id });
        const errorResponse: ChatErrorResponse = {
          code: 'INTERNAL_ERROR',
          message: 'Failed to end chat session',
        };
        socket.emit('chat:error', errorResponse);
        endTimer();
      }
    });

    // ============================================================
    // DISCONNECT - Clean up resources
    // ============================================================
    socket.on('disconnect', (reason) => {
      const session = activeSessions.get(socket.id);

      if (session) {
        logger.warn('Chat session disconnected without ending', {
          socketId: socket.id,
          conversationId: session.conversationId,
          reason,
          durationSeconds: Math.floor((Date.now() - session.startedAt) / 1000),
        });

        // Clean up - the conversation will remain in ChatService memory
        // until it's either ended or the service restarts
        activeSessions.delete(socket.id);
      }

      logger.debug('Chat WebSocket client disconnected', { socketId: socket.id, reason });
    });
  });

  logger.info('Chat WebSocket handlers initialized');
}
