// src/adapters/outbound/messaging/kafka/event-bus.ts
import type { Producer } from 'kafkajs';
import { INotificationsEventBusPort } from '../../../../application/ports/outbound/messaging/messaging.js';

export class KafkaEventBus implements INotificationsEventBusPort {
  constructor(private readonly producer: Producer) {}

  async publish(topic: string, message: object): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}
