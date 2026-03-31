import type { Collection, WithId } from "mongodb";
import type { NotificationDTO } from "../../../../domain/notification.js";
import {
  FindByIdProjection,
  FindByStatusProjection,
  INotificationsRepositoryReadPort,
  PaginatedNotifications,
  PaginationParameters,
} from "../../../../application/ports/outbound/database/database-read.js";
import { NotificationStatusType } from "../../../../domain/notification.js";

export class MongoNotificationRepositoryRead implements INotificationsRepositoryReadPort {
  constructor(private readonly collection: Collection<NotificationDTO>) {}

  private async paginationFind(
    query: object,
    pagination: PaginationParameters,
  ): Promise<[WithId<NotificationDTO>[], number]> {
    const [docs, total] = await Promise.all([
      this.collection
        .find(query)
        .skip((pagination.page - 1) * pagination.pageSize)
        .limit(pagination.pageSize)
        .toArray(),
      this.collection.countDocuments(query),
    ]);
    return [docs, total];
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

  async findByStatus(
    status: NotificationStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedNotifications<FindByStatusProjection> | null> {
    const [docs, total] = await this.paginationFind({ status }, pagination);
    return {
      data: docs.map((doc) => ({ id: doc.id, status: doc.status })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
