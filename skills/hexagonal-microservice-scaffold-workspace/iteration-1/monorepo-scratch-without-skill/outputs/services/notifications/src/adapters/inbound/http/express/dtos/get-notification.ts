import { NotificationDTO } from "../../../../../domain/notification.js";

export type GetNotificationParams = {
  id: string;
};

export type GetNotificationOutput = NotificationDTO;
