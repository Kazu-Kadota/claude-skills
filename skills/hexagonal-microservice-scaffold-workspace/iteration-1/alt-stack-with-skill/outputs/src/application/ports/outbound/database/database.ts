// src/application/ports/outbound/database/database.ts
// Single database port (no CQRS split — DynamoDB is the only database)
import type { ShipmentDTO, ShipmentStatusType } from "../../../../domain/shipment.js";

export type FindByIdProjection = {
  id: string;
  orderId: string;
  recipientName: string;
  address: string;
  trackingCode: string;
  status: ShipmentStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export abstract class IShipmentRepositoryPort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract save(entity: ShipmentDTO): Promise<void>;
  abstract updateOne(entity: ShipmentDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
