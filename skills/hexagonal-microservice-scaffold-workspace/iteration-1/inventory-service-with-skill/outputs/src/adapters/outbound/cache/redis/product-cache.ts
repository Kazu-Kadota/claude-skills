// src/adapters/outbound/cache/redis/product-cache.ts
import { Redis } from "ioredis";
import { IInventoryCachePort } from "../../../../application/ports/outbound/cache/cache.js";
import { ProductDTO } from "../../../../domain/product.js";

export class RedisProductCache implements IInventoryCachePort {
  constructor(private readonly redis: Redis) {}

  async get(id: string): Promise<ProductDTO | null> {
    const raw = await this.redis.get(`product:${id}`);
    return raw ? (JSON.parse(raw) as ProductDTO) : null;
  }

  async set(entity: ProductDTO): Promise<void> {
    await this.redis.set(`product:${entity.id}`, JSON.stringify(entity), "EX", 60);
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(`product:${id}`);
  }
}
