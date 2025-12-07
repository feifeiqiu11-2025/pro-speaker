import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors/index.js';

/**
 * Middleware factory for request body validation using Zod
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.reduce<Record<string, string[]>>((acc, err) => {
        const path = err.path.join('.');
        if (!acc[path]) {
          acc[path] = [];
        }
        acc[path].push(err.message);
        return acc;
      }, {});

      throw new ValidationError('Invalid request data', errors);
    }

    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory for query params validation
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.reduce<Record<string, string[]>>((acc, err) => {
        const path = err.path.join('.');
        if (!acc[path]) {
          acc[path] = [];
        }
        acc[path].push(err.message);
        return acc;
      }, {});

      throw new ValidationError('Invalid query parameters', errors);
    }

    req.query = result.data as typeof req.query;
    next();
  };
}

/**
 * Middleware factory for route params validation
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      throw new ValidationError('Invalid route parameters');
    }

    req.params = result.data as typeof req.params;
    next();
  };
}
