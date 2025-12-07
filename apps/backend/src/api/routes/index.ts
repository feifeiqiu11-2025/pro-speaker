import { Router } from 'express';
import type { AnalysisService, NewsService } from '../../services/index.js';
import type { AzureTTSService } from '../../infrastructure/speech/index.js';
import { createSessionsRouter } from './sessions.js';
import { createNewsRouter } from './news.js';

interface RouterDependencies {
  analysisService: AnalysisService;
  newsService?: NewsService;
  ttsService?: AzureTTSService;
}

/**
 * Create main API router with all routes
 */
export function createApiRouter(deps: RouterDependencies): Router;
export function createApiRouter(analysisService: AnalysisService): Router;
export function createApiRouter(
  depsOrService: RouterDependencies | AnalysisService
): Router {
  const router = Router();

  // Handle both old signature (just analysisService) and new (deps object)
  const deps: RouterDependencies =
    'analyzeSession' in depsOrService
      ? { analysisService: depsOrService as AnalysisService }
      : (depsOrService as RouterDependencies);

  // Mount session routes
  router.use('/sessions', createSessionsRouter(deps.analysisService));

  // Mount news routes if services are available
  if (deps.newsService && deps.ttsService) {
    router.use('/news', createNewsRouter(deps.newsService, deps.ttsService));
  }

  // Root endpoint
  router.get('/', (_req, res) => {
    const endpoints = [
      'POST /api/sessions/analyze',
      'POST /api/sessions/analyze-transcript',
      'GET /api/sessions/health',
    ];

    if (deps.newsService) {
      endpoints.push(
        'GET /api/news',
        'GET /api/news/:id',
        'GET /api/news/:id/audio',
        'GET /api/news/:id/boundaries',
        'POST /api/news/refresh'
      );
    }

    res.json({
      success: true,
      data: {
        name: 'ProSpeaker API',
        version: '0.2.0',
        endpoints,
      },
    });
  });

  return router;
}
