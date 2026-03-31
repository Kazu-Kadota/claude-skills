// src/adapters/outbound/messaging/sqs/event-bus.ts
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { IShipmentEventBusPort } from "../../../../application/ports/outbound/messaging/messaging.js";

export class SQSEventBus implements IShipmentEventBusPort {
  constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrl: string,
  ) {}

  async publish(topic: string, message: object): Promise<void> {
    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          topic: {
            DataType: "String",
            StringValue: topic,
          },
        },
      }),
    );
  }
}
