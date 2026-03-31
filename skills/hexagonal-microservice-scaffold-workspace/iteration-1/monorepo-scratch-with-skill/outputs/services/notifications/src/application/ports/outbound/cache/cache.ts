import type { NotificationDTO } from "../../../../domain/notification.js";

export abstract class INotificationsCachePort {
  abstract get(id: string): Promise<NotificationDTO | null>;
  abstract set(entity: NotificationDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
