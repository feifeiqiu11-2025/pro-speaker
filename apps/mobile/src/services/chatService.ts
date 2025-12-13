import { io, Socket } from 'socket.io-client';
import { config } from '../utils/config';
import type {
  ChatMode,
  ChatStartResponse,
  ChatTurnResponse,
  ChatSummaryResponse,
  ChatErrorResponse,
} from '../types/chat';

type ChatStartedCallback = (response: ChatStartResponse) => void;
type ChatProcessingCallback = (data: { conversationId: string }) => void;
type ChatTurnCallback = (response: ChatTurnResponse) => void;
type ChatGeneratingSummaryCallback = (data: { conversationId: string }) => void;
type ChatSummaryCallback = (response: ChatSummaryResponse) => void;
type ChatErrorCallback = (error: ChatErrorResponse) => void;

/**
 * Service for managing chat WebSocket connections
 */
class ChatService {
  private socket: Socket | null = null;

  // Callbacks
  private onStartedCallback: ChatStartedCallback | null = null;
  private onProcessingCallback: ChatProcessingCallback | null = null;
  private onTurnCallback: ChatTurnCallback | null = null;
  private onGeneratingSummaryCallback: ChatGeneratingSummaryCallback | null = null;
  private onSummaryCallback: ChatSummaryCallback | null = null;
  private onErrorCallback: ChatErrorCallback | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(config.API_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[ChatService] Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[ChatService] Connection error:', error);
        reject(error);
      });

      // Chat event listeners
      this.socket.on('chat:started', (response: ChatStartResponse) => {
        console.log('[ChatService] chat:started', response.conversationId);
        this.onStartedCallback?.(response);
      });

      this.socket.on('chat:processing', (data: { conversationId: string }) => {
        console.log('[ChatService] chat:processing');
        this.onProcessingCallback?.(data);
      });

      this.socket.on('chat:turn', (response: ChatTurnResponse) => {
        console.log('[ChatService] chat:turn received');
        this.onTurnCallback?.(response);
      });

      this.socket.on('chat:generating-summary', (data: { conversationId: string }) => {
        console.log('[ChatService] chat:generating-summary');
        this.onGeneratingSummaryCallback?.(data);
      });

      this.socket.on('chat:summary', (response: ChatSummaryResponse) => {
        console.log('[ChatService] chat:summary received');
        this.onSummaryCallback?.(response);
      });

      this.socket.on('chat:error', (error: ChatErrorResponse) => {
        console.error('[ChatService] chat:error', error);
        this.onErrorCallback?.(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[ChatService] Disconnected:', reason);
      });
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearCallbacks();
  }

  /**
   * Start a new chat session
   */
  startChat(mode: ChatMode, userId?: string): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    console.log('[ChatService] Starting chat', { mode, userId });
    this.socket.emit('chat:start', { mode, userId });
  }

  /**
   * Send recorded audio for processing
   */
  sendAudio(conversationId: string, audioBase64: string): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    console.log('[ChatService] Sending audio', {
      conversationId,
      audioLength: audioBase64.length,
    });
    this.socket.emit('chat:audio', {
      conversationId,
      audio: audioBase64,
    });
  }

  /**
   * End the chat and request summary
   */
  endChat(conversationId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    console.log('[ChatService] Ending chat', { conversationId });
    this.socket.emit('chat:end', { conversationId });
  }

  // ============================================================
  // CALLBACK SETTERS
  // ============================================================

  onStarted(callback: ChatStartedCallback): void {
    this.onStartedCallback = callback;
  }

  onProcessing(callback: ChatProcessingCallback): void {
    this.onProcessingCallback = callback;
  }

  onTurn(callback: ChatTurnCallback): void {
    this.onTurnCallback = callback;
  }

  onGeneratingSummary(callback: ChatGeneratingSummaryCallback): void {
    this.onGeneratingSummaryCallback = callback;
  }

  onSummary(callback: ChatSummaryCallback): void {
    this.onSummaryCallback = callback;
  }

  onError(callback: ChatErrorCallback): void {
    this.onErrorCallback = callback;
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks(): void {
    this.onStartedCallback = null;
    this.onProcessingCallback = null;
    this.onTurnCallback = null;
    this.onGeneratingSummaryCallback = null;
    this.onSummaryCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const chatService = new ChatService();
