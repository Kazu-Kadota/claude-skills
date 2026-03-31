// src/adapters/outbound/cache/memory/shipment-cache.ts
import { IShipmentCachePort } from "../../../../application/ports/outbound/cache/cache.js";
import { ShipmentDTO } from "../../../../domain/shipment.js";

/**
 * In-memory Map cache adapter.
 * Simple key-value store with optional TTL (time-to-live in seconds).
 * Uses a Map<id, { value, expiresAt }> internally.
 */
export class MemoryShipmentCache implements IShipmentCachePort {
  private readonly store: Map<string, { value: ShipmentDTO; expiresAt: number }> = new Map();

  constructor(private readonly ttlSeconds: number = 60) {}

  async get(id: string): Promise<ShipmentDTO | null> {
    const entry = this.store.get(`shipment:${id}`);
    if (!entry) return null;

    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(`shipment:${id}`);
      return null;
    }

    return entry.value;
  }

  async set(entity: ShipmentDTO): Promise<void> {
    this.store.set(`shipment:${entity.id}`, {
      value: entity,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

  async delete(id: string): Promise<void> {
    this.store.delete(`shipment:${id}`);
  }

  /** Utility: clear all expired entries (optional periodic cleanup) */
  purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
