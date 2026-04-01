// src/adapters/inbound/http/express/dtos/get-notification.ts
import type { FindByIdProjection } from '../../../../../application/ports/outbound/database/database-read.js';

export type GetNotificationParams = {
  id: string;
};

export type GetNotificationOutput = FindByIdProjection;
