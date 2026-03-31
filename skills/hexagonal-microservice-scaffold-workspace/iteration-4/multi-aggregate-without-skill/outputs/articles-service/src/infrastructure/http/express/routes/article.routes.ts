import { Router } from 'express'
import { ArticleController } from '../controllers/article.controller'

export function createArticleRouter(controller: ArticleController): Router {
  const router = Router()

  // POST /articles — create a new article
  router.post('/', (req, res, next) => controller.create(req, res, next))

  // GET /articles/:id — get an article by id
  router.get('/:id', (req, res, next) => controller.getById(req, res, next))

  // PATCH /articles/:id/publish — publish an article
  router.patch('/:id/publish', (req, res, next) => controller.publish(req, res, next))

  return router
}
