// src/adapters/outbound/cache/memory/shipment-cache.ts
import { IShipmentCachePort } from "../../../../application/ports/outbound/cache/cache.js";
import { ShipmentDTO } from "../../../../domain/shipment.js";

export class InMemoryShipmentCache implements IShipmentCachePort {
  constructor(private readonly store: Map<string, ShipmentDTO>) {}

  async get(id: string): Promise<ShipmentDTO | null> {
    return this.store.get(`shipment:${id}`) ?? null;
  }

  async set(entity: ShipmentDTO): Promise<void> {
    this.store.set(`shipment:${entity.id}`, entity);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(`shipment:${id}`);
  }
}
