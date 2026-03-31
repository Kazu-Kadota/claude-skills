import { CreateTipUseCase } from '../use-cases/create-tip.use-case'
import { TipRepositoryPort } from '../../../domain/tip/tip.repository.port'
import { TipReadRepositoryPort } from '../../../domain/tip/tip.read-repository.port'

describe('CreateTipUseCase', () => {
  let useCase: CreateTipUseCase
  let mockWriteRepo: jest.Mocked<TipRepositoryPort>
  let mockReadRepo: jest.Mocked<TipReadRepositoryPort>

  beforeEach(() => {
    mockWriteRepo = { save: jest.fn(), findById: jest.fn(), findAll: jest.fn() }
    mockReadRepo = { save: jest.fn(), findById: jest.fn(), findAll: jest.fn(), findByCategory: jest.fn() }

    useCase = new CreateTipUseCase(mockWriteRepo, mockReadRepo)
  })

  it('should create a tip and save to both repos', async () => {
    const command = { content: 'Stay hydrated', category: 'health' }

    const result = await useCase.execute(command)

    expect(result.content).toBe('Stay hydrated')
    expect(result.category).toBe('health')
    expect(result.status).toBe('draft')
    expect(result.id).toBeDefined()

    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1)
    expect(mockReadRepo.save).toHaveBeenCalledTimes(1)
  })
})
