import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { CreateArticleUseCase } from '../../../../application/article/use-cases/create-article.use-case'
import { GetArticleUseCase } from '../../../../application/article/use-cases/get-article.use-case'
import { PublishArticleUseCase } from '../../../../application/article/use-cases/publish-article.use-case'
import { getTracer } from '../../../telemetry/tracer'
import { SpanStatusCode } from '@opentelemetry/api'

const createArticleSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
})

const articleIdSchema = z.object({
  id: z.string().uuid(),
})

export class ArticleController {
  private tracer = getTracer('article-controller')

  constructor(
    private readonly createArticleUseCase: CreateArticleUseCase,
    private readonly getArticleUseCase: GetArticleUseCase,
    private readonly publishArticleUseCase: PublishArticleUseCase,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    const span = this.tracer.startSpan('article.create')
    try {
      const body = createArticleSchema.parse(req.body)
      const result = await this.createArticleUseCase.execute(body)
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
    const span = this.tracer.startSpan('article.getById')
    try {
      const { id } = articleIdSchema.parse(req.params)
      const article = await this.getArticleUseCase.execute({ id })
      if (!article) {
        res.status(404).json({ error: { message: 'Article not found', statusCode: 404 } })
        return
      }
      span.setStatus({ code: SpanStatusCode.OK })
      res.status(200).json({ data: article })
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR })
      next(error)
    } finally {
      span.end()
    }
  }

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    const span = this.tracer.startSpan('article.publish')
    try {
      const { id } = articleIdSchema.parse(req.params)
      const result = await this.publishArticleUseCase.execute({ id })
      span.setStatus({ code: SpanStatusCode.OK })
      res.status(200).json({ data: result })
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR })
      next(error)
    } finally {
      span.end()
    }
  }
}
