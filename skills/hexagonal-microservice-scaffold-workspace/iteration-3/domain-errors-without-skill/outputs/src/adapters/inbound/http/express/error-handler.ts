import { NextFunction, Request, Response } from 'express';
import { ConflictError, DomainError, NotFoundError, ValidationError } from '../../../../domain/errors';

// ---------------------------------------------------------------------------
// Status-code mapping
// ---------------------------------------------------------------------------

/**
 * Derive an HTTP status code from a known DomainError subtype.
 * Add new mappings here as the domain grows.
 */
function statusCodeFor(err: DomainError): number {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ConflictError) return 409;
  if (err instanceof ValidationError) return 422;
  // Fallback for any DomainError we haven't explicitly mapped yet.
  return 400;
}

// ---------------------------------------------------------------------------
// Response body shape
// ---------------------------------------------------------------------------

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

function buildBody(err: DomainError): ErrorResponseBody {
  const body: ErrorResponseBody = {
    error: {
      code: err.code,
      message: err.message,
    },
  };

  if (err instanceof ValidationError && Object.keys(err.details).length > 0) {
    body.error.details = err.details;
  }

  return body;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Express error-handler middleware.
 *
 * Must be registered LAST in the middleware chain (after all routes) so that
 * Express routes errors to it via `next(err)` or thrown errors in async
 * handlers (when using an async wrapper that calls next).
 *
 * Logging strategy:
 *  - DomainError  → logger.warn  (expected business rule violations)
 *  - Unknown error → logger.error (unexpected — deserves immediate attention)
 */
export function domainErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // `next` must be declared even if unused; Express uses arity-4 to detect
  // error-handler middleware.
  _next: NextFunction,
): void {
  const logger = req.app.locals.logger as {
    warn: (msg: string, meta?: unknown) => void;
    error: (msg: string, meta?: unknown) => void;
  } | undefined;

  const logWarn = logger?.warn.bind(logger) ?? console.warn;
  const logError = logger?.error.bind(logger) ?? console.error;

  if (err instanceof DomainError) {
    const status = statusCodeFor(err);

    logWarn(`[DomainError] ${err.code}: ${err.message}`, {
      code: err.code,
      status,
      path: req.path,
      method: req.method,
      stack: err.stack,
    });

    res.status(status).json(buildBody(err));
    return;
  }

  // Unknown / unexpected error — log at error level and return a safe 500.
  logError('[UnexpectedError] An unhandled error reached the error handler.', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}
