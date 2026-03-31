import Redis from 'ioredis'

export class RedisClient {
  private static instance: RedisClient
  private client: Redis

  private constructor(host: string, port: number, password?: string) {
    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
    })
  }

  static getInstance(host?: string, port?: number, password?: string): RedisClient {
    if (!RedisClient.instance) {
      if (!host || !port) {
        throw new Error('RedisClient requires host and port on first instantiation')
      }
      RedisClient.instance = new RedisClient(host, port, password)
    }
    return RedisClient.instance
  }

  getClient(): Redis {
    return this.client
  }

  async connect(): Promise<void> {
    await this.client.connect()
    console.log('Redis connected successfully')
  }

  async disconnect(): Promise<void> {
    await this.client.quit()
    console.log('Redis disconnected')
  }
}
