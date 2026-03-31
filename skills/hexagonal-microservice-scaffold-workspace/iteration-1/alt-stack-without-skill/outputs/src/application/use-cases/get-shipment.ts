// src/application/use-cases/get-shipment.ts
import { ShipmentDTO } from "../../domain/shipment.js";
import { IShipmentCachePort } from "../ports/outbound/cache/cache.js";
import { IShipmentRepositoryPort } from "../ports/outbound/database/database.js";
import { IShipmentTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class GetShipmentUseCase {
  constructor(
    private readonly repository: IShipmentRepositoryPort,
    private readonly cache: IShipmentCachePort,
    private readonly telemetry: IShipmentTelemetryPort,
  ) {}

  async execute(id: string): Promise<ShipmentDTO> {
    return this.telemetry.span("shipments.get", async () => {
      // Cache-first: check cache → if miss, read from DB → populate cache → return
      const cached = await this.cache.get(id);
      if (cached) return cached;

      const entity = await this.repository.findById(id);
      if (!entity) throw new Error("Shipment not found");

      await this.cache.set(entity);
      return entity;
    });
  }
}
