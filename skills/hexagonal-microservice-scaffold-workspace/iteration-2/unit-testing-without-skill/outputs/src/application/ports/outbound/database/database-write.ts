// src/application/ports/outbound/database/database-write.ts
import { OrderDTO } from "../../../../domain/order.js";

export abstract class IOrderRepositoryWritePort {
  abstract save(entity: OrderDTO): Promise<void>;
  abstract updateOne(entity: OrderDTO): Promise<void>;
  abstract findById(id: string): Promise<OrderDTO | null>;
}
