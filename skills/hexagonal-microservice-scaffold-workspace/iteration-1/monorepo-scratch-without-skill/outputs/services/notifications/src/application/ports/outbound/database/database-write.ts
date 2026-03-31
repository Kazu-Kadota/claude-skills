import { NotificationDTO } from "../../../../domain/notification.js";
import { FindByIdProjection } from "./database-read.js";

export abstract class INotificationsRepositoryWritePort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract save(entity: NotificationDTO): Promise<void>;
  abstract updateOne(entity: NotificationDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
