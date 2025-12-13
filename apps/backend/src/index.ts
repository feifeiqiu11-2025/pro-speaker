import 'dotenv/config';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { loadEnv } from './config/index.js';
import { createApiRouter } from './api/routes/index.js';
import { errorHandler } from './api/middleware/index.js';
import { initializeWebSocket } from './api/websocket/index.js';
import { AnalysisService, NewsService, ChatService } from './services/index.js';
import { AzureSpeechAnalyzer, AzureTTSService, AzureChatTTSService } from './infrastructure/speech/index.js';
import { OpenAICommunicationAnalyzer, ChatConversationManager } from './infrastructure/llm/index.js';
import { logger } from './shared/utils/logger.js';

async function main() {
  // Load and validate environment
  const env = loadEnv();

  logger.info('Starting ProSpeaker API', {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  });

  // Initialize infrastructure
  const speechAnalyzer = new AzureSpeechAnalyzer({
    subscriptionKey: env.AZURE_SPEECH_KEY,
    region: env.AZURE_SPEECH_REGION,
  });

  const communicationAnalyzer = new OpenAICommunicationAnalyzer({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  });

  // Initialize services
  const analysisService = new AnalysisService(
    speechAnalyzer,
    communicationAnalyzer
  );

  // Initialize News and TTS services
  const newsService = new NewsService({
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL,
  });

  const ttsService = new AzureTTSService({
    subscriptionKey: env.AZURE_SPEECH_KEY,
    region: env.AZURE_SPEECH_REGION,
  });

  // Initialize Chat feature services
  const chatTTSService = new AzureChatTTSService({
    subscriptionKey: env.AZURE_SPEECH_KEY,
    region: env.AZURE_SPEECH_REGION,
  });

  const chatConversationManager = new ChatConversationManager({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  });

  const chatService = new ChatService(
    speechAnalyzer,
    chatTTSService,
    chatConversationManager,
    {
      maxDurationSeconds: 120, // 2 minutes
      maxTurns: 10,
      voiceId: 'en-US-JennyNeural',
    }
  );

  // Check service health
  const health = await analysisService.healthCheck();
  const chatHealth = await chatService.healthCheck();

  logger.info('Service health check', {
    speech: health.speech ? 'ready' : 'not ready',
    communication: health.communication ? 'ready' : 'not ready',
    chat: chatHealth.healthy ? 'ready' : 'not ready',
  });

  if (!health.speech) {
    logger.warn('Azure Speech service not ready - check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION');
  }
  if (!health.communication) {
    logger.warn('OpenAI service not ready - check OPENAI_API_KEY');
  }
  if (!chatHealth.healthy) {
    logger.warn('Chat service not ready', { services: chatHealth.services });
  }

  // Create Express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // Allow larger payloads for audio

  // Serve static files (test UI)
  app.use(express.static(path.join(__dirname, '../public')));

  // API routes
  app.use('/api', createApiRouter({
    analysisService,
    newsService,
    ttsService,
  }));

  // Health check endpoint (outside /api)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Debug endpoint to check config (remove in production)
  app.get('/debug/config', (_req, res) => {
    res.json({
      hasOpenAIKey: !!env.OPENAI_API_KEY,
      openAIKeyLength: env.OPENAI_API_KEY?.length || 0,
      openAIKeyPrefix: env.OPENAI_API_KEY?.substring(0, 10) || 'none',
      hasAzureKey: !!env.AZURE_SPEECH_KEY,
      azureRegion: env.AZURE_SPEECH_REGION,
      model: env.OPENAI_MODEL,
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  // Create HTTP server for both Express and WebSocket
  const httpServer = createServer(app);

  // Initialize WebSocket server
  initializeWebSocket(
    httpServer,
    {
      azureKey: env.AZURE_SPEECH_KEY,
      azureRegion: env.AZURE_SPEECH_REGION,
      openaiKey: env.OPENAI_API_KEY,
      openaiModel: env.OPENAI_MODEL,
    },
    {
      chatService,
    }
  );

  // Start server
  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info('Available endpoints:');
    logger.info('  GET  /health');
    logger.info('  GET  /api');
    logger.info('  GET  /api/sessions/health');
    logger.info('  POST /api/sessions/analyze');
    logger.info('  POST /api/sessions/analyze-transcript');
    logger.info('  GET  /api/news');
    logger.info('  GET  /api/news/:id');
    logger.info('  GET  /api/news/:id/audio');
    logger.info('  POST /api/news/refresh');
    logger.info('  WS   / (WebSocket for real-time streaming)');
    logger.info('  WS   chat:start, chat:audio, chat:end (Chat feature)');
  });
}

main().catch((error) => {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
