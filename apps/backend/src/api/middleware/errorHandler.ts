import type { ErrorRequestHandler } from 'express';
import { AppError } from '../../shared/errors/index.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Log the error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
      },
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
    });
  }

  // Unknown errors - don't leak details in production
  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : err.message || 'Unknown error',
    },
  });
};
