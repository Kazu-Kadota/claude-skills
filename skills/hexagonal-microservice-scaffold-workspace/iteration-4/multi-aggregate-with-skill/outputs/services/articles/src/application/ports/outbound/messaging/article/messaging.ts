// src/application/ports/outbound/messaging/article/messaging.ts

export abstract class IArticleEventBusPort {
  abstract publish(topic: string, message: object): Promise<void>;
}
