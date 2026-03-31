// src/application/use-cases/get-product.ts
import { IInventoryCachePort } from "../ports/outbound/cache/cache.js";
import { IInventoryRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { IInventoryTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class GetProductUseCase {
  constructor(
    private readonly readRepository: IInventoryRepositoryReadPort,
    private readonly cache: IInventoryCachePort,
    private readonly telemetry: IInventoryTelemetryPort,
  ) {}

  async execute(id: string) {
    return this.telemetry.span("inventory.get", async () => {
      const cached = await this.cache.get(id);
      if (cached) return cached;

      const entity = await this.readRepository.findById(id);
      if (!entity) throw new Error("Product not found");

      await this.cache.set(entity);
      return entity;
    });
  }
}
