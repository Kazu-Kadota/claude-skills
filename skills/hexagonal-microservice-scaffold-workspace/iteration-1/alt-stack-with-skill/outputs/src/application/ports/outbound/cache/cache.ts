// src/application/ports/outbound/cache/cache.ts
import type { ShipmentDTO } from "../../../../domain/shipment.js";

export abstract class IShipmentCachePort {
  abstract get(id: string): Promise<ShipmentDTO | null>;
  abstract set(entity: ShipmentDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
