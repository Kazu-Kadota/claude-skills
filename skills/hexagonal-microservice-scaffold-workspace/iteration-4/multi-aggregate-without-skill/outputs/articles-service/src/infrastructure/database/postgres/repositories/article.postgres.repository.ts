import { Article, ArticleProps, ArticleRepositoryPort } from '../../../../domain/article'
import { PostgresClient } from '../postgres.client'

interface ArticleRow {
  id: string
  title: string
  content: string
  status: 'draft' | 'published'
  created_at: Date
  updated_at: Date
}

export class ArticlePostgresRepository implements ArticleRepositoryPort {
  constructor(private readonly db: PostgresClient) {}

  async save(article: Article): Promise<void> {
    const props = article.toProps()
    await this.db.query(
      `INSERT INTO articles (id, title, content, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
         SET title      = EXCLUDED.title,
             content    = EXCLUDED.content,
             status     = EXCLUDED.status,
             updated_at = EXCLUDED.updated_at`,
      [props.id, props.title, props.content, props.status, props.createdAt, props.updatedAt],
    )
  }

  async findById(id: string): Promise<Article | null> {
    const rows = await this.db.query<ArticleRow>(
      'SELECT id, title, content, status, created_at, updated_at FROM articles WHERE id = $1',
      [id],
    )
    if (rows.length === 0) return null
    return this.mapRowToEntity(rows[0])
  }

  async findAll(): Promise<Article[]> {
    const rows = await this.db.query<ArticleRow>(
      'SELECT id, title, content, status, created_at, updated_at FROM articles ORDER BY created_at DESC',
    )
    return rows.map((row) => this.mapRowToEntity(row))
  }

  private mapRowToEntity(row: ArticleRow): Article {
    const props: ArticleProps = {
      id: row.id,
      title: row.title,
      content: row.content,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
    return Article.reconstitute(props)
  }
}
