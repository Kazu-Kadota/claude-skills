import { Tip, TipProps, TipRepositoryPort } from '../../../../domain/tip'
import { PostgresClient } from '../postgres.client'

interface TipRow {
  id: string
  content: string
  category: string
  status: 'draft' | 'published'
  created_at: Date
  updated_at: Date
}

export class TipPostgresRepository implements TipRepositoryPort {
  constructor(private readonly db: PostgresClient) {}

  async save(tip: Tip): Promise<void> {
    const props = tip.toProps()
    await this.db.query(
      `INSERT INTO tips (id, content, category, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
         SET content    = EXCLUDED.content,
             category   = EXCLUDED.category,
             status     = EXCLUDED.status,
             updated_at = EXCLUDED.updated_at`,
      [props.id, props.content, props.category, props.status, props.createdAt, props.updatedAt],
    )
  }

  async findById(id: string): Promise<Tip | null> {
    const rows = await this.db.query<TipRow>(
      'SELECT id, content, category, status, created_at, updated_at FROM tips WHERE id = $1',
      [id],
    )
    if (rows.length === 0) return null
    return this.mapRowToEntity(rows[0])
  }

  async findAll(): Promise<Tip[]> {
    const rows = await this.db.query<TipRow>(
      'SELECT id, content, category, status, created_at, updated_at FROM tips ORDER BY created_at DESC',
    )
    return rows.map((row) => this.mapRowToEntity(row))
  }

  private mapRowToEntity(row: TipRow): Tip {
    const props: TipProps = {
      id: row.id,
      content: row.content,
      category: row.category,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
    return Tip.reconstitute(props)
  }
}
