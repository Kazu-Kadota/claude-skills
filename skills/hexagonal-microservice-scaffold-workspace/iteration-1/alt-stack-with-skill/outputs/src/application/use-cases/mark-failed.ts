// src/application/use-cases/mark-failed.ts
import { Shipment } from "../../domain/shipment.js";
import { IShipmentCachePort } from "../ports/outbound/cache/cache.js";
import { IShipmentRepositoryPort } from "../ports/outbound/database/database.js";
import { IShipmentEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IShipmentTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class MarkFailedUseCase {
  constructor(
    private readonly repository: IShipmentRepositoryPort,
    private readonly cache: IShipmentCachePort,
    private readonly eventBus: IShipmentEventBusPort,
    private readonly telemetry: IShipmentTelemetryPort,
  ) {}

  private async transition(entity: Shipment): Promise<void> {
    entity.markFailed();
    const dto = entity.toDTO();

    await this.repository.updateOne(dto);
    await this.cache.set(dto);
    await this.eventBus.publish("shipment.failed", {
      type: "shipment.failed",
      payload: {
        shipmentId: dto.id,
        orderId: dto.orderId,
        trackingCode: dto.trackingCode,
        status: dto.status,
      },
    });
  }

  async execute(id: string): Promise<void> {
    return this.telemetry.span("shipments.mark_failed", async () => {
      const cached = await this.cache.get(id);
      if (cached) {
        const entity = Shipment.reconstitute(cached);
        await this.transition(entity);
        return;
      }

      const projection = await this.repository.findById(id);
      if (!projection) throw new Error("Shipment not found");

      const entity = Shipment.reconstitute(projection);
      await this.transition(entity);
    });
  }
}
