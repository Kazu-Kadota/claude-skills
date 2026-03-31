// src/adapters/outbound/messaging/kafka/article-event-bus.ts
import type { Producer } from "kafkajs";
import { IArticleEventBusPort } from "../../../../application/ports/outbound/messaging/article/messaging.js";

export class KafkaArticleEventBus implements IArticleEventBusPort {
  constructor(private readonly producer: Producer) {}

  async publish(topic: string, message: object): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}
