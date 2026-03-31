/**
 * Base class for all domain errors.
 * Carries a machine-readable code alongside the human-readable message so
 * that infrastructure layers (e.g. HTTP adapters) can translate them to the
 * correct status code without resorting to string matching.
 */
export abstract class DomainError extends Error {
  /** Machine-readable identifier used for logging and HTTP translation. */
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    // Restore the prototype chain so that `instanceof` checks work correctly
    // when this code is compiled to ES5 target.
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;

    // Capture a clean stack trace (Node.js / V8 only).
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

// ---------------------------------------------------------------------------
// Concrete domain error subtypes
// ---------------------------------------------------------------------------

/**
 * Thrown when a requested aggregate or entity cannot be found.
 * Maps to HTTP 404 Not Found.
 */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" was not found.`);
  }
}

/**
 * Thrown when an operation would violate a business invariant or put an
 * aggregate into an invalid state (e.g. cancelling an already-cancelled order).
 * Maps to HTTP 409 Conflict.
 */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when input data fails domain validation rules.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';

  /** Field-level detail messages, keyed by field name when available. */
  readonly details: Record<string, string>;

  constructor(message: string, details: Record<string, string> = {}) {
    super(message);
    this.details = details;
  }
}
