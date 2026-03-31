import { CreateNotificationUseCaseExecuteParams } from "../../use-cases/create-notification.js";

export abstract class IHTTPSPort {
  abstract createNotification(body: CreateNotificationUseCaseExecuteParams): Promise<unknown>;
  abstract getNotification(param: { id: string }): Promise<unknown>;
  abstract deleteNotification(param: { id: string }): Promise<unknown>;
}
