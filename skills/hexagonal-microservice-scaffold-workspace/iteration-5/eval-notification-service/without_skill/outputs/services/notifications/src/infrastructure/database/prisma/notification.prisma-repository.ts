import { PrismaClient } from '@prisma/client'
import { Notification, NotificationProps } from '../../../domain/notification.entity'
import { NotificationRepository } from '../../../domain/notification.repository'

export class NotificationPrismaRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(notification: Notification): Promise<void> {
    const data = notification.toPlainObject()
    await this.prisma.notification.create({
      data: {
        id: data.id,
        userId: data.userId,
        deviceToken: data.deviceToken,
        title: data.title,
        body: data.body,
        type: data.type,
        status: data.status,
        metadata: data.metadata ?? undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findById(id: string): Promise<Notification | null> {
    const record = await this.prisma.notification.findUnique({ where: { id } })
    if (!record) return null
    return this.toDomain(record)
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({ where: { userId } })
    return records.map((r) => this.toDomain(r))
  }

  async update(notification: Notification): Promise<void> {
    const data = notification.toPlainObject()
    await this.prisma.notification.update({
      where: { id: data.id },
      data: {
        status: data.status,
        metadata: data.metadata ?? undefined,
        updatedAt: data.updatedAt,
      },
    })
  }

  private toDomain(record: {
    id: string
    userId: string
    deviceToken: string
    title: string
    body: string
    type: string
    status: string
    metadata: unknown
    createdAt: Date
    updatedAt: Date
  }): Notification {
    return Notification.reconstitute({
      id: record.id,
      userId: record.userId,
      deviceToken: record.deviceToken,
      title: record.title,
      body: record.body,
      type: record.type as NotificationProps['type'],
      status: record.status as NotificationProps['status'],
      metadata: record.metadata as Record<string, unknown> | undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
