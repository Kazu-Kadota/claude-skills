import { Request, Response, NextFunction } from 'express'
import { NotificationNotFoundError } from '../../../domain/errors/notification-not-found.error'

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof NotificationNotFoundError) {
    res.status(404).json({ error: err.message })
    return
  }

  if (err.message.includes('Cannot transition from')) {
    res.status(422).json({ error: err.message })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
}
