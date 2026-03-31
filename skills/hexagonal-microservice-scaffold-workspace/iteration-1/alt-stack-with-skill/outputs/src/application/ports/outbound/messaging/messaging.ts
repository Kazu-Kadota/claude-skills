// src/application/ports/outbound/messaging/messaging.ts

export abstract class IShipmentEventBusPort {
  abstract publish(topic: string, message: object): Promise<void>;
}
