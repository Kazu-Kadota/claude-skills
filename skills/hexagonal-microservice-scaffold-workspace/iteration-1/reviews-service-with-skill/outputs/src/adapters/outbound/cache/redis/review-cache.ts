// src/adapters/outbound/cache/redis/review-cache.ts
import { Redis } from "ioredis";
import { IReviewsCachePort } from "../../../../application/ports/outbound/cache/cache.js";
import { ReviewDTO } from "../../../../domain/review.js";

export class RedisReviewCache implements IReviewsCachePort {
  constructor(private readonly redis: Redis) {}

  async get(id: string): Promise<ReviewDTO | null> {
    const raw = await this.redis.get(`review:${id}`);
    return raw ? (JSON.parse(raw) as ReviewDTO) : null;
  }

  async set(entity: ReviewDTO): Promise<void> {
    await this.redis.set(`review:${entity.id}`, JSON.stringify(entity), "EX", 60);
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(`review:${id}`);
  }
}
