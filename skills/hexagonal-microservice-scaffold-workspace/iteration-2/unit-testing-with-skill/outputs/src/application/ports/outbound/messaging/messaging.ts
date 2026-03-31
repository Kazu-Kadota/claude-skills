// src/application/ports/outbound/messaging/messaging.ts

export abstract class IOrderEventBusPort {
  abstract publish(topic: string, message: object): Promise<void>;
}
