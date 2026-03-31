// src/application/use-cases/deactivate-product.ts
import { Product } from "../../domain/product.js";
import { IInventoryCachePort } from "../ports/outbound/cache/cache.js";
import { IInventoryRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { IInventoryRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IInventoryEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IInventoryTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class DeactivateProductUseCase {
  constructor(
    private readonly readRepository: IInventoryRepositoryReadPort,
    private readonly writeRepository: IInventoryRepositoryWritePort,
    private readonly cache: IInventoryCachePort,
    private readonly eventBus: IInventoryEventBusPort,
    private readonly telemetry: IInventoryTelemetryPort,
  ) {}

  private async deactivateProduct(entity: Product): Promise<void> {
    entity.deactivate();
    const dto = entity.toDTO();

    await this.writeRepository.updateOne(dto);
    await this.cache.set(dto);
    await this.eventBus.publish("product.deactivated", {
      type: "product.deactivated",
      payload: {
        productId: dto.id,
        status: dto.status,
      },
    });
  }

  async execute(id: string): Promise<void> {
    return this.telemetry.span("inventory.deactivate", async () => {
      // Try cache first (avoids a DB round-trip in the hot path)
      const cached = await this.cache.get(id);
      if (cached) {
        const entity = Product.reconstitute(cached);
        await this.deactivateProduct(entity);
        return;
      }

      // Cache miss — fall back to the read DB
      const projection = await this.readRepository.findById(id);
      if (!projection) throw new Error("Product not found");

      const entity = Product.reconstitute(projection);
      await this.deactivateProduct(entity);
    });
  }
}
