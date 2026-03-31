import { TipReadModel, TipReadRepositoryPort } from '../../../../domain/tip'
import { TipModel } from '../schemas/tip.mongo.schema'

export class TipMongoRepository implements TipReadRepositoryPort {
  async save(tip: TipReadModel): Promise<void> {
    await TipModel.findOneAndUpdate(
      { _id: tip.id },
      {
        _id: tip.id,
        content: tip.content,
        category: tip.category,
        status: tip.status,
        createdAt: tip.createdAt,
        updatedAt: tip.updatedAt,
      },
      { upsert: true, new: true },
    )
  }

  async findById(id: string): Promise<TipReadModel | null> {
    const doc = await TipModel.findById(id).lean()
    if (!doc) return null
    return this.mapDocToReadModel(doc)
  }

  async findAll(): Promise<TipReadModel[]> {
    const docs = await TipModel.find().sort({ createdAt: -1 }).lean()
    return docs.map((doc) => this.mapDocToReadModel(doc))
  }

  async findByCategory(category: string): Promise<TipReadModel[]> {
    const docs = await TipModel.find({ category }).sort({ createdAt: -1 }).lean()
    return docs.map((doc) => this.mapDocToReadModel(doc))
  }

  private mapDocToReadModel(doc: Record<string, unknown>): TipReadModel {
    return {
      id: doc._id as string,
      content: doc.content as string,
      category: doc.category as string,
      status: doc.status as 'draft' | 'published',
      createdAt: new Date(doc.createdAt as string),
      updatedAt: new Date(doc.updatedAt as string),
    }
  }
}
