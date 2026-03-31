import { ArticleRepositoryPort, ArticleReadRepositoryPort, ArticleReadModel } from '../../../domain/article'
import { EventPublisherPort, CachePort } from '../../../domain/shared'
import { ArticlePublishedEvent } from '../../../domain/article/article.events'

export interface PublishArticleCommand {
  id: string
}

export interface PublishArticleResult {
  id: string
  title: string
  status: string
  updatedAt: Date
}

export class PublishArticleUseCase {
  constructor(
    private readonly articleRepository: ArticleRepositoryPort,
    private readonly articleReadRepository: ArticleReadRepositoryPort,
    private readonly eventPublisher: EventPublisherPort<ArticlePublishedEvent>,
    private readonly cache: CachePort,
  ) {}

  async execute(command: PublishArticleCommand): Promise<PublishArticleResult> {
    const article = await this.articleRepository.findById(command.id)
    if (!article) {
      throw new Error(`Article not found: ${command.id}`)
    }

    article.publish()

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

    await this.cache.del(`article:${article.id}`)

    const event: ArticlePublishedEvent = {
      eventType: 'article.published',
      payload: {
        articleId: article.id,
        title: article.title,
        publishedAt: article.updatedAt.toISOString(),
      },
    }
    await this.eventPublisher.publish('article.published', event)

    return {
      id: article.id,
      title: article.title,
      status: article.status,
      updatedAt: article.updatedAt,
    }
  }
}
