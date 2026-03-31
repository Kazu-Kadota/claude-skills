import { Tip, TipRepositoryPort, TipReadRepositoryPort, TipReadModel } from '../../../domain/tip'

export interface CreateTipCommand {
  content: string
  category: string
}

export interface CreateTipResult {
  id: string
  content: string
  category: string
  status: string
  createdAt: Date
}

export class CreateTipUseCase {
  constructor(
    private readonly tipRepository: TipRepositoryPort,
    private readonly tipReadRepository: TipReadRepositoryPort,
  ) {}

  async execute(command: CreateTipCommand): Promise<CreateTipResult> {
    const tip = Tip.create({
      content: command.content,
      category: command.category,
    })

    await this.tipRepository.save(tip)

    const readModel: TipReadModel = {
      id: tip.id,
      content: tip.content,
      category: tip.category,
      status: tip.status,
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt,
    }
    await this.tipReadRepository.save(readModel)

    return {
      id: tip.id,
      content: tip.content,
      category: tip.category,
      status: tip.status,
      createdAt: tip.createdAt,
    }
  }
}
