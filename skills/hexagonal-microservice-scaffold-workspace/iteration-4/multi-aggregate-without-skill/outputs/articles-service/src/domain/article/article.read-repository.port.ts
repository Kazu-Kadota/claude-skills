import { ArticleReadModel } from './article.read-model'

export interface ArticleReadRepositoryPort {
  save(article: ArticleReadModel): Promise<void>
  findById(id: string): Promise<ArticleReadModel | null>
  findAll(): Promise<ArticleReadModel[]>
  findByStatus(status: 'draft' | 'published'): Promise<ArticleReadModel[]>
}
