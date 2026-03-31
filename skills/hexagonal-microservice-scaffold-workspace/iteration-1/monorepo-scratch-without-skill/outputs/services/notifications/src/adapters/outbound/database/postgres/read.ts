import { PrismaClient } from "../../../../generated/notifications/client.js";
import {
  FindByIdProjection,
  FindByStatusProjection,
  INotificationsRepositoryReadPort,
  PaginatedNotifications,
  PaginationParameters,
} from "../../../../application/ports/outbound/database/database-read.js";
import { NotificationStatusType } from "../../../../domain/notification.js";

export class PostgresNotificationRepositoryRead implements INotificationsRepositoryReadPort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findById(id: string): Promise<FindByIdProjection | null> {
    return await this.prismaClient.notification.findUnique({ where: { id } });
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
      }),
      this.prismaClient.notification.count({ where: { status } }),
    ]);
    return {
      data,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
