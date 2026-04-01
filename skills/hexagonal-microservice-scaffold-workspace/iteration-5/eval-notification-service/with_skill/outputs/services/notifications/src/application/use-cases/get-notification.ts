// src/application/use-cases/get-notification.ts
import { INotificationsRepositoryReadPort, FindByIdProjection } from '../ports/outbound/database/database-read.js';
import { INotificationsTelemetryPort } from '../ports/outbound/telemetry/telemetry.js';

export class GetNotificationUseCase {
  constructor(
    private readonly readRepository: INotificationsRepositoryReadPort,
    private readonly telemetry: INotificationsTelemetryPort,
  ) {}

  async execute(id: string): Promise<FindByIdProjection> {
    return this.telemetry.span('notifications.get', async () => {
      const entity = await this.readRepository.findById(id);
      if (!entity) throw new Error('Notification not found');
      return entity;
    });
  }
}
