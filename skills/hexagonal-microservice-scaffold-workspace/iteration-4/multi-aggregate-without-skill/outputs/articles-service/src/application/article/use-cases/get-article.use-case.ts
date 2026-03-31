import { ArticleReadRepositoryPort, ArticleReadModel } from '../../../domain/article'
import { CachePort } from '../../../domain/shared'

export interface GetArticleQuery {
  id: string
}

export class GetArticleUseCase {
  private static readonly CACHE_TTL = 300 // 5 minutes

  constructor(
    private readonly articleReadRepository: ArticleReadRepositoryPort,
    private readonly cache: CachePort,
  ) {}

  async execute(query: GetArticleQuery): Promise<ArticleReadModel | null> {
    const cacheKey = `article:${query.id}`

    const cached = await this.cache.get<ArticleReadModel>(cacheKey)
    if (cached) {
      return cached
    }

    const article = await this.articleReadRepository.findById(query.id)
    if (!article) {
      return null
    }

    await this.cache.set(cacheKey, article, GetArticleUseCase.CACHE_TTL)

    return article
  }
}
