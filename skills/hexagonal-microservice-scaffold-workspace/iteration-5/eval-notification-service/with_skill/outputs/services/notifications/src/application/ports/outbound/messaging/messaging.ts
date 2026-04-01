// src/application/ports/outbound/messaging/messaging.ts

export abstract class INotificationsEventBusPort {
  abstract publish(topic: string, message: object): Promise<void>;
}
