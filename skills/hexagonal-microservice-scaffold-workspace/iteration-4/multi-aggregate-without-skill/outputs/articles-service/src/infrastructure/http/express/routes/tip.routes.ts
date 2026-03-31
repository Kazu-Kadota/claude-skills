import { Router } from 'express'
import { TipController } from '../controllers/tip.controller'

export function createTipRouter(controller: TipController): Router {
  const router = Router()

  // POST /tips — create a new tip
  router.post('/', (req, res, next) => controller.create(req, res, next))

  // GET /tips/:id — get a tip by id
  router.get('/:id', (req, res, next) => controller.getById(req, res, next))

  return router
}
