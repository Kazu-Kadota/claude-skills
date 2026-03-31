// src/application/ports/outbound/messaging/messaging.ts

export abstract class IInventoryEventBusPort {
  abstract publish(topic: string, message: object): Promise<void>;
}
