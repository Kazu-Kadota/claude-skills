import type { Consumer } from "kafkajs";
import { IMessagingConsumerPort } from "../../../../application/ports/inbound/messaging.js";
import { MarkOrderAsPaidUseCase } from "../../../../application/use-cases/mark-order-as-paid.js";
import { CancelOrderUseCase } from "../../../../application/use-cases/cancel-order.js";

type PaymentCompletedPayload = {
  orderId: string;
};

type PaymentFailedPayload = {
  orderId: string;
};

type PaymentEvent =
  | { type: "payment.completed"; payload: PaymentCompletedPayload }
  | { type: "payment.failed"; payload: PaymentFailedPayload };

const PAYMENT_EVENTS_TOPIC = "payment-events";

export class KafkaPaymentEventsConsumer implements IMessagingConsumerPort {
  constructor(
    private readonly consumer: Consumer,
    private readonly markOrderAsPaidUseCase: MarkOrderAsPaidUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase
  ) {}

  async start(): Promise<void> {
    await this.consumer.subscribe({
      topic: PAYMENT_EVENTS_TOPIC,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          console.warn("[KafkaPaymentEventsConsumer] Received message with no value, skipping.");
          return;
        }

        let event: PaymentEvent;

        try {
          event = JSON.parse(message.value.toString()) as PaymentEvent;
        } catch (err) {
          console.error("[KafkaPaymentEventsConsumer] Failed to parse message:", err);
          return;
        }

        try {
          if (event.type === "payment.completed") {
            await this.markOrderAsPaidUseCase.execute(event.payload.orderId);
          } else if (event.type === "payment.failed") {
            await this.cancelOrderUseCase.execute(event.payload.orderId);
          } else {
            console.warn("[KafkaPaymentEventsConsumer] Unknown event type, skipping:", (event as { type: string }).type);
          }
        } catch (err) {
          console.error(
            `[KafkaPaymentEventsConsumer] Error handling event type "${event.type}":`,
            err
          );
        }
      },
    });
  }
}
