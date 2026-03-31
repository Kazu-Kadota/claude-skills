import { TipReadRepositoryPort, TipReadModel } from '../../../domain/tip'
import { CachePort } from '../../../domain/shared'

export interface GetTipQuery {
  id: string
}

export class GetTipUseCase {
  private static readonly CACHE_TTL = 300 // 5 minutes

  constructor(
    private readonly tipReadRepository: TipReadRepositoryPort,
    private readonly cache: CachePort,
  ) {}

  async execute(query: GetTipQuery): Promise<TipReadModel | null> {
    const cacheKey = `tip:${query.id}`

    const cached = await this.cache.get<TipReadModel>(cacheKey)
    if (cached) {
      return cached
    }

    const tip = await this.tipReadRepository.findById(query.id)
    if (!tip) {
      return null
    }

    await this.cache.set(cacheKey, tip, GetTipUseCase.CACHE_TTL)

    return tip
  }
}
