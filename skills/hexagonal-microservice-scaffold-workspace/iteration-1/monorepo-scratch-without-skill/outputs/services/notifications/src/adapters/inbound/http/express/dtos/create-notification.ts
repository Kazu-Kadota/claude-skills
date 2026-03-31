import { NotificationChannelType, NotificationDTO } from "../../../../../domain/notification.js";

export type CreateNotificationBody = {
  recipientId: string;
  channel: NotificationChannelType;
  message: string;
};

export type CreateNotificationOutput = NotificationDTO;
