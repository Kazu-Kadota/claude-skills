// src/application/ports/inbound/http.ts
import type { CreateNotificationUseCaseExecuteParams } from '../../use-cases/create-notification.js';

export abstract class IHTTPSPort {
  abstract createNotification(body: CreateNotificationUseCaseExecuteParams): Promise<unknown>;
  abstract getNotification(param: { id: string }): Promise<unknown>;
  abstract markAsSent(param: { id: string }): Promise<void>;
  abstract markAsFailed(param: { id: string }, body: { reason: string }): Promise<void>;
}
