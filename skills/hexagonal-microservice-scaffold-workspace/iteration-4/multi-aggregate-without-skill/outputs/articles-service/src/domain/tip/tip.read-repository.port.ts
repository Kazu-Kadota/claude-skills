import { TipReadModel } from './tip.read-model'

export interface TipReadRepositoryPort {
  save(tip: TipReadModel): Promise<void>
  findById(id: string): Promise<TipReadModel | null>
  findAll(): Promise<TipReadModel[]>
  findByCategory(category: string): Promise<TipReadModel[]>
}
