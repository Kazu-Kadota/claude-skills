import type { Collection } from "mongodb";
import type { NotificationDTO } from "../../../../domain/notification.js";
import { FindByIdProjection } from "../../../../application/ports/outbound/database/database-read.js";
import { INotificationsRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";

export class MongoNotificationRepositoryWrite implements INotificationsRepositoryWritePort {
  constructor(private readonly collection: Collection<NotificationDTO>) {}

  async save(entity: NotificationDTO): Promise<void> {
    await this.collection.updateOne({ id: entity.id }, { $set: entity }, { upsert: true });
  }

  async updateOne(entity: NotificationDTO): Promise<void> {
    await this.collection.updateOne({ id: entity.id }, { $set: entity }, { upsert: true });
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ id });
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    const doc = await this.collection.findOne({ id });
    if (!doc) return null;
    return {
      id: doc.id,
      recipientId: doc.recipientId,
      channel: doc.channel,
      message: doc.message,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
