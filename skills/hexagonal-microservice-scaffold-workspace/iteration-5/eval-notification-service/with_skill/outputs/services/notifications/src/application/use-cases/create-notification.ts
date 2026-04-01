// src/application/use-cases/create-notification.ts
import { Notification, NotificationDTO, NotificationTypeType } from '../../domain/notification.js';
import { INotificationsRepositoryWritePort } from '../ports/outbound/database/database-write.js';
import { INotificationsEventBusPort } from '../ports/outbound/messaging/messaging.js';
import { INotificationsTelemetryPort } from '../ports/outbound/telemetry/telemetry.js';
import { INotificationPushPort } from '../ports/outbound/push/push.js';

export type CreateNotificationUseCaseExecuteParams = {
  userId: string;
  deviceToken: string;
  title: string;
  body: string;
  type: NotificationTypeType;
  metadata?: Record<string, unknown>;
};

export class CreateNotificationUseCase {
  constructor(
    private readonly writeRepository: INotificationsRepositoryWritePort,
    private readonly eventBus: INotificationsEventBusPort,
    private readonly push: INotificationPushPort,
    private readonly telemetry: INotificationsTelemetryPort,
  ) {}

  async execute(input: CreateNotificationUseCaseExecuteParams): Promise<NotificationDTO> {
    return this.telemetry.span('notifications.create', async () => {
      const entity = Notification.create({
        userId: input.userId,
        deviceToken: input.deviceToken,
        title: input.title,
        body: input.body,
        type: input.type,
        metadata: input.metadata,
      });
      const dto = entity.toDTO();

      await this.writeRepository.save(dto);

      // Send push notification after persisting
      await this.push.send(dto.deviceToken, dto.title, dto.body);

      await this.eventBus.publish('notification.created', {
        type: 'notification.created',
        payload: {
          notificationId: dto.id,
          userId: dto.userId,
          deviceToken: dto.deviceToken,
          type: dto.type,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      return dto;
    });
  }
}
