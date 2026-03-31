import type { NotificationDTO } from "../../../../domain/notification.js";
import type { FindByIdProjection } from "../../../../application/ports/outbound/database/database-read.js";
import { INotificationsRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";
import { PrismaClient } from "../../../../generated/notifications/client.js";

export class PostgresNotificationRepositoryWrite implements INotificationsRepositoryWritePort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(entity: NotificationDTO): Promise<void> {
    await this.prismaClient.notification.upsert({
      create: entity,
      update: entity,
      where: { id: entity.id },
    });
  }

  async updateOne(entity: NotificationDTO): Promise<void> {
    await this.prismaClient.notification.upsert({
      create: entity,
      update: entity,
      where: { id: entity.id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.notification.delete({ where: { id } });
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    return await this.prismaClient.notification.findUnique({ where: { id } });
  }
}
