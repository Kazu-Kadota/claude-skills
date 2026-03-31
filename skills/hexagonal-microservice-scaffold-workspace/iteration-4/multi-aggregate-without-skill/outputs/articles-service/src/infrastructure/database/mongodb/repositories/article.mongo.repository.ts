import { ArticleReadModel, ArticleReadRepositoryPort } from '../../../../domain/article'
import { ArticleModel } from '../schemas/article.mongo.schema'

export class ArticleMongoRepository implements ArticleReadRepositoryPort {
  async save(article: ArticleReadModel): Promise<void> {
    await ArticleModel.findOneAndUpdate(
      { _id: article.id },
      {
        _id: article.id,
        title: article.title,
        content: article.content,
        status: article.status,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      },
      { upsert: true, new: true },
    )
  }

  async findById(id: string): Promise<ArticleReadModel | null> {
    const doc = await ArticleModel.findById(id).lean()
    if (!doc) return null
    return this.mapDocToReadModel(doc)
  }

  async findAll(): Promise<ArticleReadModel[]> {
    const docs = await ArticleModel.find().sort({ createdAt: -1 }).lean()
    return docs.map((doc) => this.mapDocToReadModel(doc))
  }

  async findByStatus(status: 'draft' | 'published'): Promise<ArticleReadModel[]> {
    const docs = await ArticleModel.find({ status }).sort({ createdAt: -1 }).lean()
    return docs.map((doc) => this.mapDocToReadModel(doc))
  }

  private mapDocToReadModel(doc: Record<string, unknown>): ArticleReadModel {
    return {
      id: doc._id as string,
      title: doc.title as string,
      content: doc.content as string,
      status: doc.status as 'draft' | 'published',
      createdAt: new Date(doc.createdAt as string),
      updatedAt: new Date(doc.updatedAt as string),
    }
  }
}
