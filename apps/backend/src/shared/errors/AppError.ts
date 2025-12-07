/**
 * Base error class for all application errors
 * Provides consistent error handling across the application
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

/**
 * External service error (Azure, OpenAI, etc.)
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    originalError: Error,
    public readonly originalMessage?: string
  ) {
    super(
      `${service} service error: ${originalError.message}`,
      'EXTERNAL_SERVICE_ERROR',
      502
    );
    this.originalMessage = originalError.message;
  }
}

/**
 * Audio processing error
 */
export class AudioProcessingError extends AppError {
  constructor(message: string) {
    super(message, 'AUDIO_PROCESSING_ERROR', 422);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(_retryAfter?: number) {
    super('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_ERROR', 429);
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500, false);
  }
}
