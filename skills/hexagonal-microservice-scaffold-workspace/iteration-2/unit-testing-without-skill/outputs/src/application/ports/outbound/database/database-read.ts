// src/application/ports/outbound/database/database-read.ts
import { OrderDTO } from "../../../../domain/order.js";

export abstract class IOrderRepositoryReadPort {
  abstract findById(id: string): Promise<OrderDTO | null>;
}
