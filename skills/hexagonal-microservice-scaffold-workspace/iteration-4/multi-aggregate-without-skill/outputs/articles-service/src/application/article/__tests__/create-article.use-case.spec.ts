import { CreateArticleUseCase } from '../use-cases/create-article.use-case'
import { ArticleRepositoryPort } from '../../../domain/article/article.repository.port'
import { ArticleReadRepositoryPort } from '../../../domain/article/article.read-repository.port'
import { EventPublisherPort } from '../../../domain/shared/event-publisher.port'
import { ArticleCreatedEvent } from '../../../domain/article/article.events'

describe('CreateArticleUseCase', () => {
  let useCase: CreateArticleUseCase
  let mockWriteRepo: jest.Mocked<ArticleRepositoryPort>
  let mockReadRepo: jest.Mocked<ArticleReadRepositoryPort>
  let mockEventPublisher: jest.Mocked<EventPublisherPort<ArticleCreatedEvent>>

  beforeEach(() => {
    mockWriteRepo = { save: jest.fn(), findById: jest.fn(), findAll: jest.fn() }
    mockReadRepo = { save: jest.fn(), findById: jest.fn(), findAll: jest.fn(), findByStatus: jest.fn() }
    mockEventPublisher = { publish: jest.fn() }

    useCase = new CreateArticleUseCase(mockWriteRepo, mockReadRepo, mockEventPublisher)
  })

  it('should create an article, save to both repos, and publish event', async () => {
    const command = { title: 'My Article', content: 'Some content' }

    const result = await useCase.execute(command)

    expect(result.title).toBe('My Article')
    expect(result.status).toBe('draft')
    expect(result.id).toBeDefined()

    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1)
    expect(mockReadRepo.save).toHaveBeenCalledTimes(1)
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      'article.created',
      expect.objectContaining({ eventType: 'article.created' }),
    )
  })
})
