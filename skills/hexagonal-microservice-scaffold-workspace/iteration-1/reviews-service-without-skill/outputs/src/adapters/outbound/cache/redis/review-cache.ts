import { Redis } from "ioredis";
import { IReviewsCachePort } from "../../../../application/ports/outbound/cache/cache.js";
import { ReviewDTO } from "../../../../domain/review/review.js";

export class RedisReviewCache implements IReviewsCachePort {
  constructor(private readonly redis: Redis) {}

  async get(id: string): Promise<ReviewDTO | null> {
    const raw = await this.redis.get(`review:${id}`);
    return raw ? (JSON.parse(raw) as ReviewDTO) : null;
  }

  async set(review: ReviewDTO): Promise<void> {
    await this.redis.set(
      `review:${review.id}`,
      JSON.stringify(review),
      "EX",
      60,
    );
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(`review:${id}`);
  }
}
