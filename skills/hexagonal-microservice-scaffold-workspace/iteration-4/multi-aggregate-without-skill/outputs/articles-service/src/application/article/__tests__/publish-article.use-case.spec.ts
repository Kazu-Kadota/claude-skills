import { PublishArticleUseCase } from '../use-cases/publish-article.use-case'
import { Article } from '../../../domain/article/article.entity'
import { ArticleRepositoryPort } from '../../../domain/article/article.repository.port'
import { ArticleReadRepositoryPort } from '../../../domain/article/article.read-repository.port'
import { EventPublisherPort } from '../../../domain/shared/event-publisher.port'
import { CachePort } from '../../../domain/shared/cache.port'
import { ArticlePublishedEvent } from '../../../domain/article/article.events'

describe('PublishArticleUseCase', () => {
  let useCase: PublishArticleUseCase
  let mockWriteRepo: jest.Mocked<ArticleRepositoryPort>
  let mockReadRepo: jest.Mocked<ArticleReadRepositoryPort>
  let mockEventPublisher: jest.Mocked<EventPublisherPort<ArticlePublishedEvent>>
  let mockCache: jest.Mocked<CachePort>

  beforeEach(() => {
    mockWriteRepo = { save: jest.fn(), findById: jest.fn(), findAll: jest.fn() }
    mockReadRepo = { save: jest.fn(), findById: jest.fn(), findAll: jest.fn(), findByStatus: jest.fn() }
    mockEventPublisher = { publish: jest.fn() }
    mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() }

    useCase = new PublishArticleUseCase(mockWriteRepo, mockReadRepo, mockEventPublisher, mockCache)
  })

  it('should publish an existing draft article', async () => {
    const article = Article.create({ title: 'Draft Article', content: 'Content' })
    mockWriteRepo.findById.mockResolvedValue(article)

    const result = await useCase.execute({ id: article.id })

    expect(result.status).toBe('published')
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1)
    expect(mockReadRepo.save).toHaveBeenCalledTimes(1)
    expect(mockCache.del).toHaveBeenCalledWith(`article:${article.id}`)
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      'article.published',
      expect.objectContaining({ eventType: 'article.published' }),
    )
  })

  it('should throw when article is not found', async () => {
    mockWriteRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow('Article not found')
  })
})
