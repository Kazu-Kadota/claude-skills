// src/adapters/outbound/database/postgres/write.ts
import type { NotificationDTO } from '../../../../domain/notification.js';
import type { FindByIdProjection } from '../../../../application/ports/outbound/database/database-read.js';
import { INotificationsRepositoryWritePort } from '../../../../application/ports/outbound/database/database-write.js';
import { PrismaClient } from '../../../../generated/notifications/client.js';

export class PostgresNotificationRepositoryWrite implements INotificationsRepositoryWritePort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(entity: NotificationDTO): Promise<void> {
    await this.prismaClient.notification.upsert({
      create: {
        id: entity.id,
        userId: entity.userId,
        deviceToken: entity.deviceToken,
        title: entity.title,
        body: entity.body,
        type: entity.type,
        status: entity.status,
        metadata: entity.metadata as object | undefined,
        createdAt: new Date(entity.createdAt),
        updatedAt: new Date(entity.updatedAt),
      },
      update: {
        userId: entity.userId,
        deviceToken: entity.deviceToken,
        title: entity.title,
        body: entity.body,
        type: entity.type,
        status: entity.status,
        metadata: entity.metadata as object | undefined,
        updatedAt: new Date(entity.updatedAt),
      },
      where: { id: entity.id },
    });
  }

  async updateOne(entity: NotificationDTO): Promise<void> {
    await this.prismaClient.notification.upsert({
      create: {
        id: entity.id,
        userId: entity.userId,
        deviceToken: entity.deviceToken,
        title: entity.title,
        body: entity.body,
        type: entity.type,
        status: entity.status,
        metadata: entity.metadata as object | undefined,
        createdAt: new Date(entity.createdAt),
        updatedAt: new Date(entity.updatedAt),
      },
      update: {
        status: entity.status,
        metadata: entity.metadata as object | undefined,
        updatedAt: new Date(entity.updatedAt),
      },
      where: { id: entity.id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.notification.delete({ where: { id } });
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    const row = await this.prismaClient.notification.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      deviceToken: row.deviceToken,
      title: row.title,
      body: row.body,
      type: row.type,
      status: row.status,
      metadata: (row.metadata as Record<string, unknown>) ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
