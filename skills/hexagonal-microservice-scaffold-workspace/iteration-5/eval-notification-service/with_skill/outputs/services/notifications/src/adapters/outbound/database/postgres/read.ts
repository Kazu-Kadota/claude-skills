// src/adapters/outbound/database/postgres/read.ts
import { PrismaClient } from '../../../../generated/notifications/client.js';
import {
  FindByIdProjection,
  FindByStatusProjection,
  INotificationsRepositoryReadPort,
  PaginatedNotifications,
  PaginationParameters,
} from '../../../../application/ports/outbound/database/database-read.js';
import type { NotificationStatusType } from '../../../../domain/notification.js';

export class PostgresNotificationRepositoryRead implements INotificationsRepositoryReadPort {
  constructor(private readonly prismaClient: PrismaClient) {}

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

  async findByStatus(
    status: NotificationStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedNotifications<FindByStatusProjection> | null> {
    const [data, total] = await Promise.all([
      this.prismaClient.notification.findMany({
        where: { status },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        select: { id: true, userId: true, status: true },
      }),
      this.prismaClient.notification.count({ where: { status } }),
    ]);
    return {
      data: data.map((row) => ({ id: row.id, userId: row.userId, status: row.status })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
