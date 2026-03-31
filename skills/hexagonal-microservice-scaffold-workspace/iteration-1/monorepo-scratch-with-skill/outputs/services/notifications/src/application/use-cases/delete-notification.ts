import type { INotificationsCachePort } from "../ports/outbound/cache/cache.js";
import type { INotificationsRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import type { INotificationsEventBusPort } from "../ports/outbound/messaging/messaging.js";
import type { INotificationsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class DeleteNotificationUseCase {
  constructor(
    private readonly writeRepository: INotificationsRepositoryWritePort,
    private readonly cache: INotificationsCachePort,
    private readonly eventBus: INotificationsEventBusPort,
    private readonly telemetry: INotificationsTelemetryPort,
  ) {}

  async execute(id: string): Promise<void> {
    return this.telemetry.span("notifications.delete", async () => {
      await this.writeRepository.delete(id);
      await this.cache.delete(id);
      await this.eventBus.publish("notification.deleted", {
        type: "notification.deleted",
        payload: { notificationId: id },
      });
    });
  }
}
