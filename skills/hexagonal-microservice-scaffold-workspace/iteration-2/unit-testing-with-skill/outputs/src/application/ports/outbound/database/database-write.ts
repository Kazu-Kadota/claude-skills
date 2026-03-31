// src/application/ports/outbound/database/database-write.ts
import { OrderDTO } from "../../../../domain/order.js";
import { FindByIdProjection } from "./database-read.js";

export abstract class IOrderRepositoryWritePort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract save(entity: OrderDTO): Promise<void>;
  abstract updateOne(entity: OrderDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
