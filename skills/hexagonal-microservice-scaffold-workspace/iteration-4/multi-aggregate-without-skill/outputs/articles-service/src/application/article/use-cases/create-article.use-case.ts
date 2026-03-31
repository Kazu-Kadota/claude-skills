import { Article, ArticleRepositoryPort, ArticleReadRepositoryPort, ArticleReadModel } from '../../../domain/article'
import { EventPublisherPort } from '../../../domain/shared'
import { ArticleCreatedEvent } from '../../../domain/article/article.events'

export interface CreateArticleCommand {
  title: string
  content: string
}

export interface CreateArticleResult {
  id: string
  title: string
  content: string
  status: string
  createdAt: Date
}

export class CreateArticleUseCase {
  constructor(
    private readonly articleRepository: ArticleRepositoryPort,
    private readonly articleReadRepository: ArticleReadRepositoryPort,
    private readonly eventPublisher: EventPublisherPort<ArticleCreatedEvent>,
  ) {}

  async execute(command: CreateArticleCommand): Promise<CreateArticleResult> {
    const article = Article.create({
      title: command.title,
      content: command.content,
    })

    await this.articleRepository.save(article)

    const readModel: ArticleReadModel = {
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }
    await this.articleReadRepository.save(readModel)

    const event: ArticleCreatedEvent = {
      eventType: 'article.created',
      payload: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        status: article.status,
        createdAt: article.createdAt.toISOString(),
      },
    }
    await this.eventPublisher.publish('article.created', event)

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status,
      createdAt: article.createdAt,
    }
  }
}
