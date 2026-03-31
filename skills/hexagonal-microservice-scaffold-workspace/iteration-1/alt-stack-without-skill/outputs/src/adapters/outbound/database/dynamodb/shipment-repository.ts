// src/adapters/outbound/database/dynamodb/shipment-repository.ts
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { IShipmentRepositoryPort, FindByIdProjection } from "../../../../application/ports/outbound/database/database.js";
import { ShipmentDTO } from "../../../../domain/shipment.js";

export class DynamoDBShipmentRepository implements IShipmentRepositoryPort {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async findById(id: string): Promise<FindByIdProjection | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );

    if (!result.Item) return null;

    const item = result.Item as ShipmentDTO;
    return {
      id: item.id,
      orderId: item.orderId,
      recipientName: item.recipientName,
      address: item.address,
      trackingCode: item.trackingCode,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async save(entity: ShipmentDTO): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: entity,
      }),
    );
  }

  async updateOne(entity: ShipmentDTO): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id: entity.id },
        UpdateExpression:
          "SET #status = :status, updatedAt = :updatedAt, orderId = :orderId, recipientName = :recipientName, address = :address, trackingCode = :trackingCode",
        ExpressionAttributeNames: {
          "#status": "status", // `status` is a reserved word in DynamoDB
        },
        ExpressionAttributeValues: {
          ":status": entity.status,
          ":updatedAt": entity.updatedAt,
          ":orderId": entity.orderId,
          ":recipientName": entity.recipientName,
          ":address": entity.address,
          ":trackingCode": entity.trackingCode,
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
