// src/application/use-cases/mark-as-failed.ts
import { Notification } from '../../domain/notification.js';
import { INotificationsRepositoryWritePort } from '../ports/outbound/database/database-write.js';
import { INotificationsEventBusPort } from '../ports/outbound/messaging/messaging.js';
import { INotificationsTelemetryPort } from '../ports/outbound/telemetry/telemetry.js';

export class MarkAsFailedUseCase {
  constructor(
    private readonly writeRepository: INotificationsRepositoryWritePort,
    private readonly eventBus: INotificationsEventBusPort,
    private readonly telemetry: INotificationsTelemetryPort,
  ) {}

  async execute(id: string, reason: string): Promise<void> {
    return this.telemetry.span('notifications.mark-as-failed', async () => {
      const projection = await this.writeRepository.findById(id);
      if (!projection) throw new Error('Notification not found');

      const entity = Notification.reconstitute(projection);
      entity.markAsFailed(reason);
      const dto = entity.toDTO();

      await this.writeRepository.updateOne(dto);
      await this.eventBus.publish('notification.failed', {
        type: 'notification.failed',
        payload: {
          notificationId: dto.id,
          userId: dto.userId,
          reason,
        },
      });
    });
  }
}
