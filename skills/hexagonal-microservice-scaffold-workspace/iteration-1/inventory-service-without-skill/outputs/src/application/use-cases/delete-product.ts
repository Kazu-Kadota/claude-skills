// src/application/use-cases/delete-product.ts

import { IInventoryCachePort } from "../ports/outbound/cache/cache.js";
import { IInventoryRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IInventoryEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IInventoryTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class DeleteProductUseCase {
  constructor(
    private readonly writeRepository: IInventoryRepositoryWritePort,
    private readonly cache: IInventoryCachePort,
    private readonly eventBus: IInventoryEventBusPort,
    private readonly telemetry: IInventoryTelemetryPort,
  ) {}

  async execute(id: string): Promise<void> {
    return this.telemetry.span("inventory.delete", async () => {
      await this.writeRepository.delete(id);
      await this.cache.delete(id);
      await this.eventBus.publish("product.deleted", {
        type: "product.deleted",
        payload: { productId: id },
      });
    });
  }
}
