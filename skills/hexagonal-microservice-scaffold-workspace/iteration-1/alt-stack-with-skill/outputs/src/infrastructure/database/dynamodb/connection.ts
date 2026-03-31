// src/infrastructure/database/dynamodb/connection.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { RepositoryConnectionPort } from "../ports.js";

export class DynamoDBConnection implements RepositoryConnectionPort {
  private client: DynamoDBDocumentClient | null = null;
  private rawClient: DynamoDBClient | null = null;

  constructor(
    private readonly region: string,
    private readonly endpoint?: string, // optional: used for local DynamoDB (e.g. LocalStack)
  ) {}

  async connect(): Promise<void> {
    if (this.client) return;

    this.rawClient = new DynamoDBClient({
      region: this.region,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
    });

    this.client = DynamoDBDocumentClient.from(this.rawClient, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });
  }

  async isHealthy(): Promise<boolean> {
    if (!this.rawClient) return false;
    try {
      const { ListTablesCommand } = await import("@aws-sdk/client-dynamodb");
      await this.rawClient.send(new ListTablesCommand({ Limit: 1 }));
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (!this.rawClient) return;
    this.rawClient.destroy();
    this.rawClient = null;
    this.client = null;
  }

  getClient(): DynamoDBDocumentClient {
    if (!this.client) throw new Error("DynamoDBConnection is not connected");
    return this.client;
  }
}
