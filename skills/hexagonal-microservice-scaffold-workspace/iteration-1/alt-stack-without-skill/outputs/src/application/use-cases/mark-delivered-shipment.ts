// src/application/use-cases/mark-delivered-shipment.ts
import { Shipment } from "../../domain/shipment.js";
import { IShipmentCachePort } from "../ports/outbound/cache/cache.js";
import { IShipmentRepositoryPort } from "../ports/outbound/database/database.js";
import { IShipmentEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IShipmentTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class MarkDeliveredShipmentUseCase {
  constructor(
    private readonly repository: IShipmentRepositoryPort,
    private readonly cache: IShipmentCachePort,
    private readonly eventBus: IShipmentEventBusPort,
    private readonly telemetry: IShipmentTelemetryPort,
  ) {}

  private async transition(entity: Shipment): Promise<void> {
    entity.markAsDelivered();
    const dto = entity.toDTO();

    await this.repository.updateOne(dto);
    await this.cache.set(dto);
    await this.eventBus.publish("shipment.delivered", {
      type: "shipment.delivered",
      payload: {
        shipmentId: dto.id,
        orderId: dto.orderId,
        trackingCode: dto.trackingCode,
      },
    });
  }

  async execute(id: string): Promise<void> {
    return this.telemetry.span("shipments.mark_delivered", async () => {
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
