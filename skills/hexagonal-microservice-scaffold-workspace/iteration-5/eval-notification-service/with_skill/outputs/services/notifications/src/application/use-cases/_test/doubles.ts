// src/application/use-cases/_test/doubles.ts
// Shared in-memory test doubles for all use case tests.
// They extend the abstract port classes — TypeScript ensures they satisfy the full contract.

import { INotificationsRepositoryWritePort } from '../../ports/outbound/database/database-write.js';
import { INotificationsRepositoryReadPort, FindByIdProjection, FindByStatusProjection, PaginationParameters, PaginatedNotifications } from '../../ports/outbound/database/database-read.js';
import { INotificationsEventBusPort } from '../../ports/outbound/messaging/messaging.js';
import { INotificationsTelemetryPort } from '../../ports/outbound/telemetry/telemetry.js';
import { INotificationPushPort } from '../../ports/outbound/push/push.js';
import type { NotificationDTO, NotificationStatusType } from '../../../domain/notification.js';

export class FakeWriteRepo extends INotificationsRepositoryWritePort {
  store: NotificationDTO[] = [];

  async save(dto: NotificationDTO): Promise<void> {
    this.store.push(dto);
  }

  async updateOne(dto: NotificationDTO): Promise<void> {
    const i = this.store.findIndex((n) => n.id === dto.id);
    if (i >= 0) this.store[i] = dto;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((n) => n.id !== id);
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    return (this.store.find((n) => n.id === id) as FindByIdProjection) ?? null;
  }
}

export class FakeReadRepo extends INotificationsRepositoryReadPort {
  store: NotificationDTO[] = [];

  async findById(id: string): Promise<FindByIdProjection | null> {
    return (this.store.find((n) => n.id === id) as FindByIdProjection) ?? null;
  }

  async findByStatus(
    status: NotificationStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedNotifications<FindByStatusProjection> | null> {
    const all = this.store.filter((n) => n.status === status);
    const start = (pagination.page - 1) * pagination.pageSize;
    const data = all.slice(start, start + pagination.pageSize).map((n) => ({
      id: n.id,
      userId: n.userId,
      status: n.status,
    }));
    return {
      data,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: all.length,
      hasNext: pagination.page * pagination.pageSize < all.length,
    };
  }
}

export class FakeEventBus extends INotificationsEventBusPort {
  events: { topic: string; message: object }[] = [];

  async publish(topic: string, message: object): Promise<void> {
    this.events.push({ topic, message });
  }
}

export class FakePushAdapter extends INotificationPushPort {
  sent: { deviceToken: string; title: string; body: string }[] = [];

  async send(deviceToken: string, title: string, body: string): Promise<void> {
    this.sent.push({ deviceToken, title, body });
  }
}

export class PassthroughTelemetry extends INotificationsTelemetryPort {
  async span<T>(_name: string, fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
