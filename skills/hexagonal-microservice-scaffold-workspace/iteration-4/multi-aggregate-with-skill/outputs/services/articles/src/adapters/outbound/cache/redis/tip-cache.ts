// src/adapters/outbound/cache/redis/tip-cache.ts
import { Redis } from "ioredis";
import { ITipCachePort } from "../../../../application/ports/outbound/cache/tip-cache.js";
import type { TipDTO } from "../../../../domain/tip/tip.js";

export class RedisTipCache implements ITipCachePort {
  constructor(private readonly redis: Redis) {}

  async get(id: string): Promise<TipDTO | null> {
    const raw = await this.redis.get(`tip:${id}`);
    return raw ? (JSON.parse(raw) as TipDTO) : null;
  }

  async set(entity: TipDTO): Promise<void> {
    await this.redis.set(`tip:${entity.id}`, JSON.stringify(entity), "EX", 60);
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(`tip:${id}`);
  }
}
