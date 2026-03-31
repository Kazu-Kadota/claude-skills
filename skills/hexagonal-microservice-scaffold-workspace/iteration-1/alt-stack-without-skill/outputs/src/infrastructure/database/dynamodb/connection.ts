// src/infrastructure/database/dynamodb/connection.ts
import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { RepositoryConnectionPort } from "../ports.js";

export class DynamoDBConnection implements RepositoryConnectionPort {
  private rawClient: DynamoDBClient | null = null;
  private docClient: DynamoDBDocumentClient | null = null;

  constructor(
    private readonly region: string,
    private readonly endpoint?: string, // optional — useful for local DynamoDB / LocalStack
  ) {}

  async connect(): Promise<void> {
    if (this.rawClient) return;
    const config: DynamoDBClientConfig = { region: this.region };
    if (this.endpoint) config.endpoint = this.endpoint;
    this.rawClient = new DynamoDBClient(config);
    this.docClient = DynamoDBDocumentClient.from(this.rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async isHealthy(): Promise<boolean> {
    if (!this.rawClient) return false;
    try {
      // DynamoDB has no lightweight ping — listing tables with limit 1 is the convention
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
    this.docClient = null;
  }

  getClient(): DynamoDBDocumentClient {
    if (!this.docClient) {
      // Auto-initialize synchronously if not yet connected (for simpler bootstrap paths)
      const config: DynamoDBClientConfig = { region: this.region };
      if (this.endpoint) config.endpoint = this.endpoint;
      this.rawClient = new DynamoDBClient(config);
      this.docClient = DynamoDBDocumentClient.from(this.rawClient, {
        marshallOptions: { removeUndefinedValues: true },
      });
    }
    return this.docClient;
  }
}
