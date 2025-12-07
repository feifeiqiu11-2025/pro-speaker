import { Router } from 'express';
import { z } from 'zod';
import type { AnalysisService } from '../../services/index.js';
import { validateBody } from '../middleware/index.js';
import type { SessionMode } from '../../shared/types/index.js';

// Request schemas
const analyzeSessionSchema = z.object({
  audio: z.string().min(1, 'Audio data is required'), // Base64 encoded audio
  mode: z.enum(['free_talk', 'professional', 'casual', 'read_aloud']),
  promptText: z.string().optional(),
  referenceText: z.string().optional(), // For read-aloud mode
  nativeLanguage: z.string().optional(),
  profession: z.string().optional(),
});

const analyzeTranscriptSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
  mode: z.enum(['free_talk', 'professional', 'casual', 'read_aloud']),
  promptText: z.string().optional(),
  nativeLanguage: z.string().optional(),
  profession: z.string().optional(),
});

/**
 * Create sessions router with injected dependencies
 */
export function createSessionsRouter(analysisService: AnalysisService): Router {
  const router = Router();

  /**
   * POST /api/sessions/analyze
   * Full analysis: audio upload → pronunciation + communication feedback
   */
  router.post(
    '/analyze',
    validateBody(analyzeSessionSchema),
    async (req, res, next) => {
      try {
        // Audio is validated by schema, convert from base64
        const audio = Buffer.from(req.body.audio, 'base64');
        const mode = req.body.mode as SessionMode;

        const result = await analysisService.analyzeSession({
          audio,
          mode,
          promptText: req.body.promptText,
          referenceText: req.body.referenceText,
          nativeLanguage: req.body.nativeLanguage,
          profession: req.body.profession,
        });

        if (!result.success) {
          res.status(422).json({
            success: false,
            error: {
              code: 'ANALYSIS_FAILED',
              message: result.error.message,
            },
          });
          return;
        }

        res.json({
          success: true,
          data: result.data,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/sessions/analyze-transcript
   * Communication analysis only (from existing transcript)
   * Useful for testing without audio
   */
  router.post(
    '/analyze-transcript',
    validateBody(analyzeTranscriptSchema),
    async (req, res, next) => {
      try {
        const result = await analysisService.analyzeCommunicationOnly(
          req.body.transcript,
          {
            mode: req.body.mode as SessionMode,
            promptText: req.body.promptText,
            nativeLanguage: req.body.nativeLanguage,
            profession: req.body.profession,
          }
        );

        if (!result.success) {
          res.status(422).json({
            success: false,
            error: {
              code: 'ANALYSIS_FAILED',
              message: result.error.message,
            },
          });
          return;
        }

        res.json({
          success: true,
          data: result.data,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/sessions/health
   * Check if analysis services are ready
   */
  router.get('/health', async (_req, res, next) => {
    try {
      const health = await analysisService.healthCheck();
      const allHealthy = health.speech && health.communication;

      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        data: {
          services: {
            speech: health.speech ? 'healthy' : 'unhealthy',
            communication: health.communication ? 'healthy' : 'unhealthy',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
