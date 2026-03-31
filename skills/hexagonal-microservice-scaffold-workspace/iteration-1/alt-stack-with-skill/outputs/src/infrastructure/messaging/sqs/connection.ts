// src/infrastructure/messaging/sqs/connection.ts
import { SQSClient } from "@aws-sdk/client-sqs";
import { MessagingConnectionPort } from "../port.js";

export class SQSConnection implements MessagingConnectionPort {
  private client: SQSClient | null = null;

  constructor(
    private readonly region: string,
    private readonly endpoint?: string, // optional: used for LocalStack
  ) {}

  connect(): SQSClient {
    if (this.client) return this.client;

    this.client = new SQSClient({
      region: this.region,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
    });

    return this.client;
  }

  async close(): Promise<void> {
    if (!this.client) return;
    this.client.destroy();
    this.client = null;
  }

  getClient(): SQSClient {
    if (!this.client) throw new Error("SQSConnection is not connected");
    return this.client;
  }
}
