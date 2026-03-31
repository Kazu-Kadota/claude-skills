import { Tip } from './tip.entity'

export interface TipRepositoryPort {
  save(tip: Tip): Promise<void>
  findById(id: string): Promise<Tip | null>
  findAll(): Promise<Tip[]>
}
