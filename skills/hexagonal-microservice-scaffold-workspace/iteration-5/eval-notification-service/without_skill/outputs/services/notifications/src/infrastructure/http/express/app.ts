import express, { Application } from 'express'
import { createNotificationRouter, NotificationRouterDeps } from './notification.router'
import { errorHandlerMiddleware } from './error-handler.middleware'

export function createApp(deps: NotificationRouterDeps): Application {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  // Routes
  app.use('/notifications', createNotificationRouter(deps))

  // Error handler must be last
  app.use(errorHandlerMiddleware)

  return app
}
