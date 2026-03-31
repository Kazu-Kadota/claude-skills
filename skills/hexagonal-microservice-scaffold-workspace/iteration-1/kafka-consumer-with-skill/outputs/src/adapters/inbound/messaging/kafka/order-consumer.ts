import type { Consumer } from "kafkajs";
import { MarkOrderAsPaidUseCase } from "../../../../application/use-cases/mark-order-as-paid.js";
import { CancelOrderUseCase } from "../../../../application/use-cases/cancel-order.js";

type KnownTopic = "payment.completed" | "payment.failed";

export class OrderKafkaConsumer {
  constructor(
    private readonly consumer: Consumer,
    private readonly markOrderAsPaidUseCase: MarkOrderAsPaidUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  async start(): Promise<void> {
    await this.consumer.subscribe({
      topics: ["payment.completed", "payment.failed"],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        try {
          const raw = JSON.parse(message.value.toString());

          switch (topic as KnownTopic) {
            case "payment.completed":
              await this.markOrderAsPaidUseCase.execute(raw.payload.orderId);
              break;

            case "payment.failed":
              await this.cancelOrderUseCase.execute(raw.payload.orderId);
              break;

            default:
              console.warn(`[OrderKafkaConsumer] Unhandled topic: ${topic}`);
          }
        } catch (error) {
          // Skip-and-log: prevents one bad message from halting the consumer.
          // For production, forward to a dead-letter queue instead.
          console.error(`[OrderKafkaConsumer] Failed to process message on ${topic}:`, error);
        }
      },
    });
  }
}
