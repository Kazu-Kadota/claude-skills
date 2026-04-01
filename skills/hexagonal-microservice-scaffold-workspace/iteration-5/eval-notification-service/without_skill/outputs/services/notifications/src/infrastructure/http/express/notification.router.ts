import { Router, Request, Response, NextFunction } from 'express'
import { CreateNotificationUseCase } from '../../../application/use-cases/create-notification/create-notification.use-case'
import { GetNotificationUseCase } from '../../../application/use-cases/get-notification/get-notification.use-case'
import { MarkAsSentUseCase } from '../../../application/use-cases/mark-as-sent/mark-as-sent.use-case'
import { MarkAsFailedUseCase } from '../../../application/use-cases/mark-as-failed/mark-as-failed.use-case'
import { NotificationNotFoundError } from '../../../domain/errors/notification-not-found.error'

export interface NotificationRouterDeps {
  createNotificationUseCase: CreateNotificationUseCase
  getNotificationUseCase: GetNotificationUseCase
  markAsSentUseCase: MarkAsSentUseCase
  markAsFailedUseCase: MarkAsFailedUseCase
}

export function createNotificationRouter(deps: NotificationRouterDeps): Router {
  const router = Router()

  // POST /notifications
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, deviceToken, title, body, metadata } = req.body
      const result = await deps.createNotificationUseCase.execute({
        userId,
        deviceToken,
        title,
        body,
        metadata,
      })
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  })

  // GET /notifications/:id
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deps.getNotificationUseCase.execute({ id: req.params.id })
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  })

  // PATCH /notifications/:id/sent
  router.patch('/:id/sent', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deps.markAsSentUseCase.execute({ id: req.params.id })
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  })

  // PATCH /notifications/:id/failed
  router.patch('/:id/failed', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body
      const result = await deps.markAsFailedUseCase.execute({
        id: req.params.id,
        reason: reason ?? 'Unknown reason',
      })
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  })

  return router
}
