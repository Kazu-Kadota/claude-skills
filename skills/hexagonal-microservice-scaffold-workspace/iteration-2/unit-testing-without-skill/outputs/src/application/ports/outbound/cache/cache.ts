// src/application/ports/outbound/cache/cache.ts
import { OrderDTO } from "../../../../domain/order.js";

export abstract class IOrderCachePort {
  abstract get(id: string): Promise<OrderDTO | null>;
  abstract set(entity: OrderDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
