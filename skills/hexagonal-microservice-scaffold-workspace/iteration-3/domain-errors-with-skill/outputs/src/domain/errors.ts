// src/domain/errors.ts

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    // Preserves correct stack trace in V8
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor)
  }
}

/** Entity does not exist */
export class NotFoundError extends DomainError {}

/** Operation is invalid given the entity's current state */
export class ConflictError extends DomainError {}

/** Input violates a business rule or invariant */
export class ValidationError extends DomainError {}
