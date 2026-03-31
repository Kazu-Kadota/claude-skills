// src/infrastructure/messaging/sqs/connection.ts
import { SQSClient, SQSClientConfig } from "@aws-sdk/client-sqs";
import { MessagingConnectionPort } from "../port.js";

export class SQSConnection implements MessagingConnectionPort {
  private client: SQSClient | null = null;

  constructor(
    private readonly region: string,
    private readonly endpoint?: string, // optional — useful for LocalStack
  ) {}

  async connect(): Promise<SQSClient> {
    if (this.client) return this.client;
    const config: SQSClientConfig = { region: this.region };
    if (this.endpoint) config.endpoint = this.endpoint;
    this.client = new SQSClient(config);
    return this.client;
  }

  async close(): Promise<void> {
    if (!this.client) return;
    this.client.destroy();
    this.client = null;
  }

  getClient(): SQSClient {
    if (!this.client) {
      // Auto-initialize synchronously if not yet connected
      const config: SQSClientConfig = { region: this.region };
      if (this.endpoint) config.endpoint = this.endpoint;
      this.client = new SQSClient(config);
    }
    return this.client;
  }
}
