import express, { Application } from 'express'
import { createArticleRouter } from './routes/article.routes'
import { createTipRouter } from './routes/tip.routes'
import { errorHandlerMiddleware } from './middleware/error-handler.middleware'
import { requestLoggerMiddleware } from './middleware/request-logger.middleware'
import { ArticleController } from './controllers/article.controller'
import { TipController } from './controllers/tip.controller'

export interface AppDependencies {
  articleController: ArticleController
  tipController: TipController
}

export function createApp(deps: AppDependencies): Application {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(requestLoggerMiddleware)

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'articles-service', timestamp: new Date().toISOString() })
  })

  // Routes
  app.use('/api/v1/articles', createArticleRouter(deps.articleController))
  app.use('/api/v1/tips', createTipRouter(deps.tipController))

  // Error handler (must be last)
  app.use(errorHandlerMiddleware)

  return app
}
