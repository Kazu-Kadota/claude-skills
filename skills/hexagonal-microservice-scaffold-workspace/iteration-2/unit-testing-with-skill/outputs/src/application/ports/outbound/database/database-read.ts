// src/application/ports/outbound/database/database-read.ts
import { OrderStatusType } from "../../../../domain/order.js";
import { OrderItem } from "../../../../domain/order.js";

export type FindByIdProjection = {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export abstract class IOrderRepositoryReadPort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
}
