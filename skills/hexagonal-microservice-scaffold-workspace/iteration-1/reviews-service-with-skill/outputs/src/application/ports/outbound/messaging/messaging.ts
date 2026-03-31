// src/application/ports/outbound/messaging/messaging.ts

export abstract class IReviewsEventBusPort {
  abstract publish(topic: string, message: object): Promise<void>;
}
