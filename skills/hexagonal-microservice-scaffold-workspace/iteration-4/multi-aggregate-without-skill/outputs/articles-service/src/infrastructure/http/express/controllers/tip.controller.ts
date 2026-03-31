import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { CreateTipUseCase } from '../../../../application/tip/use-cases/create-tip.use-case'
import { GetTipUseCase } from '../../../../application/tip/use-cases/get-tip.use-case'
import { getTracer } from '../../../telemetry/tracer'
import { SpanStatusCode } from '@opentelemetry/api'

const createTipSchema = z.object({
  content: z.string().min(1),
  category: z.string().min(1).max(100),
})

const tipIdSchema = z.object({
  id: z.string().uuid(),
})

export class TipController {
  private tracer = getTracer('tip-controller')

  constructor(
    private readonly createTipUseCase: CreateTipUseCase,
    private readonly getTipUseCase: GetTipUseCase,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    const span = this.tracer.startSpan('tip.create')
    try {
      const body = createTipSchema.parse(req.body)
      const result = await this.createTipUseCase.execute(body)
      span.setStatus({ code: SpanStatusCode.OK })
      res.status(201).json({ data: result })
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR })
      next(error)
    } finally {
      span.end()
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const span = this.tracer.startSpan('tip.getById')
    try {
      const { id } = tipIdSchema.parse(req.params)
      const tip = await this.getTipUseCase.execute({ id })
      if (!tip) {
        res.status(404).json({ error: { message: 'Tip not found', statusCode: 404 } })
        return
      }
      span.setStatus({ code: SpanStatusCode.OK })
      res.status(200).json({ data: tip })
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR })
      next(error)
    } finally {
      span.end()
    }
  }
}
