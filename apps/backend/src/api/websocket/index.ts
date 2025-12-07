import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupStreamingHandlers } from './handlers/streaming.js';
import { logger } from '../../shared/utils/logger.js';

interface WebSocketConfig {
  azureKey: string;
  azureRegion: string;
  openaiKey: string;
  openaiModel: string;
}

/**
 * Initialize WebSocket server with Socket.IO
 */
export function initializeWebSocket(
  httpServer: HttpServer,
  config: WebSocketConfig
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Configure appropriately for production
      methods: ['GET', 'POST'],
    },
    // Configure for audio streaming
    maxHttpBufferSize: 1e7, // 10MB max
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Set up streaming handlers
  setupStreamingHandlers(io, config);

  logger.info('WebSocket server initialized');

  return io;
}

export { setupStreamingHandlers };
