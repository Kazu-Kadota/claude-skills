import type { NotificationChannelType } from "../../../../../domain/notification.js";

export type CreateNotificationBody = {
  recipientId: string;
  channel: NotificationChannelType;
  message: string;
};

export type CreateNotificationOutput = {
  id: string;
  recipientId: string;
  channel: NotificationChannelType;
  message: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};
