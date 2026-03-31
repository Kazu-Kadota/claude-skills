import { Pool, PoolConfig } from 'pg'

export class PostgresClient {
  private static instance: PostgresClient
  private pool: Pool

  private constructor(config: PoolConfig) {
    this.pool = new Pool(config)
  }

  static getInstance(config?: PoolConfig): PostgresClient {
    if (!PostgresClient.instance) {
      if (!config) {
        throw new Error('PostgresClient requires config on first instantiation')
      }
      PostgresClient.instance = new PostgresClient(config)
    }
    return PostgresClient.instance
  }

  getPool(): Pool {
    return this.pool
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params)
    return result.rows as T[]
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect()
    client.release()
    console.log('PostgreSQL connected successfully')
  }

  async disconnect(): Promise<void> {
    await this.pool.end()
    console.log('PostgreSQL disconnected')
  }
}
