// src/adapters/inbound/http/express/error-handler.ts

import type { Request, Response, NextFunction } from 'express'
import {
  DomainError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../../domain/errors.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    console.warn(err.message)
    res.status(400).json({ error: err.message })
    return
  }
  if (err instanceof NotFoundError) {
    console.warn(err.message)
    res.status(404).json({ error: err.message })
    return
  }
  if (err instanceof ConflictError) {
    console.warn(err.message)
    res.status(409).json({ error: err.message })
    return
  }
  if (err instanceof DomainError) {
    // Catch-all for any other domain error not explicitly mapped above
    console.warn(err.message)
    res.status(422).json({ error: err.message })
    return
  }
  // Unknown — infrastructure failure
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
