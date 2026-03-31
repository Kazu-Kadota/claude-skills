import { Notification, NotificationDTO, NotificationChannelType } from "../../domain/notification.js";
import { INotificationsCachePort } from "../ports/outbound/cache/cache.js";
import { INotificationsRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { INotificationsEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { INotificationsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export type CreateNotificationUseCaseExecuteParams = {
  recipientId: string;
  channel: NotificationChannelType;
  message: string;
};

export class CreateNotificationUseCase {
  constructor(
    private readonly writeRepository: INotificationsRepositoryWritePort,
    private readonly cache: INotificationsCachePort,
    private readonly eventBus: INotificationsEventBusPort,
    private readonly telemetry: INotificationsTelemetryPort,
  ) {}

  async execute(input: CreateNotificationUseCaseExecuteParams): Promise<NotificationDTO> {
    return this.telemetry.span("notifications.create", async () => {
      const entity = Notification.create({
        recipientId: input.recipientId,
        channel: input.channel,
        message: input.message,
      });
      const dto = entity.toDTO();

      await this.writeRepository.save(dto);
      await this.cache.set(dto);
      await this.eventBus.publish("notification.created", {
        type: "notification.created",
        payload: {
          notificationId: dto.id,
          recipientId: dto.recipientId,
          channel: dto.channel,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      return dto;
    });
  }
}
