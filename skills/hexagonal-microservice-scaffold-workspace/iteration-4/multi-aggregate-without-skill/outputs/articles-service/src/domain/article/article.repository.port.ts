import { Article } from './article.entity'

export interface ArticleRepositoryPort {
  save(article: Article): Promise<void>
  findById(id: string): Promise<Article | null>
  findAll(): Promise<Article[]>
}
