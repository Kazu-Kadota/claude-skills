// src/adapters/outbound/cache/redis/article-cache.ts
import { Redis } from "ioredis";
import { IArticleCachePort } from "../../../../application/ports/outbound/cache/article-cache.js";
import type { ArticleDTO } from "../../../../domain/article/article.js";

export class RedisArticleCache implements IArticleCachePort {
  constructor(private readonly redis: Redis) {}

  async get(id: string): Promise<ArticleDTO | null> {
    const raw = await this.redis.get(`article:${id}`);
    return raw ? (JSON.parse(raw) as ArticleDTO) : null;
  }

  async set(entity: ArticleDTO): Promise<void> {
    await this.redis.set(`article:${entity.id}`, JSON.stringify(entity), "EX", 60);
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(`article:${id}`);
  }
}
