import { io, Socket } from 'socket.io-client';
import type { SessionUpdate, SessionResult, SessionMode } from '../types';
import { config } from '../utils/config';

class ApiService {
  private socket: Socket | null = null;
  private onUpdate: ((update: SessionUpdate) => void) | null = null;
  private onComplete: ((result: SessionResult) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(config.API_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('session:update', (update: SessionUpdate) => {
        this.onUpdate?.(update);
      });

      this.socket.on('session:complete', (result: SessionResult) => {
        this.onComplete?.(result);
      });

      this.socket.on('session:error', ({ message }: { message: string }) => {
        this.onError?.(message);
      });

      this.socket.on('session:analyzing', () => {
        // Could emit a UI state update here
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
  }

  /**
   * Start a streaming session
   */
  startSession(mode: SessionMode, promptText?: string): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('session:start', { mode, promptText });
  }

  /**
   * Send audio chunk during recording
   */
  sendAudioChunk(chunk: ArrayBuffer): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('audio:chunk', chunk);
  }

  /**
   * Stop session and get final analysis
   */
  stopSession(): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('session:stop');
  }

  /**
   * Set update callback
   */
  setOnUpdate(callback: (update: SessionUpdate) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Set completion callback
   */
  setOnComplete(callback: (result: SessionResult) => void): void {
    this.onComplete = callback;
  }

  /**
   * Set error callback
   */
  setOnError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const apiService = new ApiService();
