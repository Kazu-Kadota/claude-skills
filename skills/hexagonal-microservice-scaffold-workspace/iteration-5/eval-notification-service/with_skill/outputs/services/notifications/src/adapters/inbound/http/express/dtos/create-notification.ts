// src/adapters/inbound/http/express/dtos/create-notification.ts
import type { NotificationTypeType } from '../../../../../domain/notification.js';
import type { NotificationDTO } from '../../../../../domain/notification.js';

export type CreateNotificationBody = {
  userId: string;
  deviceToken: string;
  title: string;
  body: string;
  type: NotificationTypeType;
  metadata?: Record<string, unknown>;
};

export type CreateNotificationOutput = NotificationDTO;
