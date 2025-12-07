import { Router } from 'express';
import type { NewsService } from '../../services/index.js';
import type { AzureTTSService } from '../../infrastructure/speech/index.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Create news router with injected dependencies
 */
export function createNewsRouter(
  newsService: NewsService,
  ttsService: AzureTTSService
): Router {
  const router = Router();

  /**
   * GET /api/news
   * Returns list of today's news summaries
   */
  router.get('/', async (_req, res, next) => {
    try {
      const articles = await newsService.getDailyNews();

      res.json({
        success: true,
        data: {
          articles: articles.map(article => ({
            id: article.id,
            title: article.title,
            summary: article.summary,
            source: article.source,
            category: article.category,
            publishedAt: article.publishedAt,
            estimatedReadTime: article.estimatedReadTime,
            wordCount: article.wordCount,
          })),
          count: articles.length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/news/refresh
   * Force refresh news cache
   */
  router.post('/refresh', async (_req, res, next) => {
    try {
      const articles = await newsService.refreshNews();

      res.json({
        success: true,
        data: {
          message: 'News refreshed successfully',
          count: articles.length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/news/:id
   * Returns full article with word boundaries for audio sync
   */
  router.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const article = await newsService.getArticleById(id);

      if (!article) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
          },
        });
        return;
      }

      // Check for cached word boundaries
      const wordBoundaries = await ttsService.getCachedWordBoundaries(id);

      res.json({
        success: true,
        data: {
          ...article,
          audioUrl: `/api/news/${id}/audio`,
          wordBoundaries: wordBoundaries || [],
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/news/:id/audio
   * Returns TTS audio stream for the article
   */
  router.get('/:id/audio', async (req, res, next) => {
    try {
      const { id } = req.params;
      const article = await newsService.getArticleById(id);

      if (!article) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
          },
        });
        return;
      }

      // Try to get cached audio first
      let audioBuffer = await ttsService.getCachedAudio(id);

      if (!audioBuffer) {
        // Generate audio
        logger.info('Generating TTS audio for article', { articleId: id });
        const result = await ttsService.synthesizeAndCache(article.fullContent, id);
        audioBuffer = result.audioBuffer;

        // Mark article as having audio
        await newsService.markAudioGenerated(id);
      }

      // Set appropriate headers for audio streaming
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

      res.send(audioBuffer);
    } catch (error) {
      logger.error('Failed to generate/serve audio', {
        articleId: req.params.id,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  });

  /**
   * GET /api/news/:id/boundaries
   * Returns word boundaries for audio synchronization
   */
  router.get('/:id/boundaries', async (req, res, next) => {
    try {
      const { id } = req.params;
      const article = await newsService.getArticleById(id);

      if (!article) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
          },
        });
        return;
      }

      // Get or generate word boundaries
      let boundaries = await ttsService.getCachedWordBoundaries(id);

      if (!boundaries) {
        // Need to generate audio to get boundaries
        logger.info('Generating TTS to get word boundaries', { articleId: id });
        const result = await ttsService.synthesizeAndCache(article.fullContent, id);
        boundaries = result.wordBoundaries;
        await newsService.markAudioGenerated(id);
      }

      res.json({
        success: true,
        data: {
          articleId: id,
          wordBoundaries: boundaries,
          totalWords: boundaries.length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
