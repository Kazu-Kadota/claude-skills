// src/infrastructure/cache/redis/connection.ts

import { Redis } from "ioredis";
import { CacheConnectionPort } from "../ports.js";

export class RedisConnection implements CacheConnectionPort {
  private client: Redis | null = null;

  constructor(private readonly url: string) {}

  connect(): Redis {
    if (this.client) return this.client;
    this.client = new Redis(this.url);
    return this.client;
  }

  async close(): Promise<void> {
    if (!this.client) return;
    await this.client.quit();
    this.client = null;
  }

  getClient(): Redis {
    if (!this.client) throw new Error("RedisConnection is not connected");
    return this.client;
  }
}
