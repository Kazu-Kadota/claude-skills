import { INotificationsCachePort } from "../ports/outbound/cache/cache.js";
import { INotificationsRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { INotificationsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class GetNotificationUseCase {
  constructor(
    private readonly readRepository: INotificationsRepositoryReadPort,
    private readonly cache: INotificationsCachePort,
    private readonly telemetry: INotificationsTelemetryPort,
  ) {}

  async execute(id: string) {
    return this.telemetry.span("notifications.get", async () => {
      const cached = await this.cache.get(id);
      if (cached) return cached;

      const entity = await this.readRepository.findById(id);
      if (!entity) throw new Error("Notification not found");

      await this.cache.set(entity);
      return entity;
    });
  }
}
