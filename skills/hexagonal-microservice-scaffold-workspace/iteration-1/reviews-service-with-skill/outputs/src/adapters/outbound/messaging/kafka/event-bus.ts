// src/adapters/outbound/messaging/kafka/event-bus.ts
import type { Producer } from "kafkajs";
import { IReviewsEventBusPort } from "../../../../application/ports/outbound/messaging/messaging.js";

export class KafkaEventBus implements IReviewsEventBusPort {
  constructor(private readonly producer: Producer) {}

  async publish(topic: string, message: object): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}
