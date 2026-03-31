import { Redis } from "ioredis";
import { INotificationsCachePort } from "../../../../application/ports/outbound/cache/cache.js";
import type { NotificationDTO } from "../../../../domain/notification.js";

export class RedisNotificationCache implements INotificationsCachePort {
  constructor(private readonly redis: Redis) {}

  async get(id: string): Promise<NotificationDTO | null> {
    const raw = await this.redis.get(`notification:${id}`);
    return raw ? (JSON.parse(raw) as NotificationDTO) : null;
  }

  async set(entity: NotificationDTO): Promise<void> {
    await this.redis.set(`notification:${entity.id}`, JSON.stringify(entity), "EX", 60);
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(`notification:${id}`);
  }
}
