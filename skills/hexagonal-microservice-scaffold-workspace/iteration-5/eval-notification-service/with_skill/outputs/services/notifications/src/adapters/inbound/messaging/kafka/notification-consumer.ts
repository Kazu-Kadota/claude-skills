// src/adapters/inbound/messaging/kafka/notification-consumer.ts
// Kafka consumer inbound adapter — listens to events from other services
// and drives use cases. Only parses and delegates — no business logic here.
import type { Consumer } from 'kafkajs';
import { CreateNotificationUseCase } from '../../../../application/use-cases/create-notification.js';

// Extend this union as more topics are subscribed
type KnownTopic = 'order.created';

type OrderCreatedPayload = {
  type: 'order.created';
  payload: {
    orderId: string;
    customerId: string;
    userId: string;
    deviceToken: string;
    amount?: number;
  };
};

export class NotificationKafkaConsumer {
  constructor(
    private readonly consumer: Consumer,
    private readonly createNotification: CreateNotificationUseCase,
  ) {}

  async start(): Promise<void> {
    await this.consumer.subscribe({
      topics: ['order.created'],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        try {
          const raw = JSON.parse(message.value.toString()) as OrderCreatedPayload;

          switch (topic as KnownTopic) {
            case 'order.created': {
              const { payload } = raw;
              await this.createNotification.execute({
                userId: payload.userId,
                deviceToken: payload.deviceToken,
                title: 'Order Update',
                body: `Your order ${payload.orderId} has been created.`,
                type: 'push',
                metadata: { orderId: payload.orderId, customerId: payload.customerId },
              });
              break;
            }

            default:
              console.warn(`[NotificationKafkaConsumer] Unhandled topic: ${topic}`);
          }
        } catch (error) {
          // Skip-and-log: prevents one bad message from halting the consumer.
          // In production, consider forwarding to a dead-letter topic.
          console.error(
            `[NotificationKafkaConsumer] Failed to process message on ${topic}:`,
            error,
          );
        }
      },
    });
  }
}
