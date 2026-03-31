// src/adapters/outbound/database/dynamodb/shipment-repository.ts
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { ShipmentDTO } from "../../../../domain/shipment.js";
import { FindByIdProjection, IShipmentRepositoryPort } from "../../../../application/ports/outbound/database/database.js";

export class DynamoDBShipmentRepository implements IShipmentRepositoryPort {
  private readonly tableName: string;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    tableName: string,
  ) {
    this.tableName = tableName;
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );

    if (!result.Item) return null;

    const item = result.Item;
    return {
      id: item["id"] as string,
      orderId: item["orderId"] as string,
      recipientName: item["recipientName"] as string,
      address: item["address"] as string,
      trackingCode: item["trackingCode"] as string,
      status: item["status"] as FindByIdProjection["status"],
      createdAt: item["createdAt"] as string,
      updatedAt: item["updatedAt"] as string,
    };
  }

  async save(entity: ShipmentDTO): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          id: entity.id,
          orderId: entity.orderId,
          recipientName: entity.recipientName,
          address: entity.address,
          trackingCode: entity.trackingCode,
          status: entity.status,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        },
        // Prevent overwriting an existing item with a different createdAt
        ConditionExpression: "attribute_not_exists(id)",
      }),
    );
  }

  async updateOne(entity: ShipmentDTO): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id: entity.id },
        UpdateExpression:
          "SET #status = :status, address = :address, trackingCode = :trackingCode, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status", // 'status' is a reserved word in DynamoDB
        },
        ExpressionAttributeValues: {
          ":status": entity.status,
          ":address": entity.address,
          ":trackingCode": entity.trackingCode,
          ":updatedAt": entity.updatedAt,
        },
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
  }
}
