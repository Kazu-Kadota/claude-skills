// src/application/use-cases/create-shipment.ts
import { Shipment, ShipmentDTO } from "../../domain/shipment.js";
import { IShipmentCachePort } from "../ports/outbound/cache/cache.js";
import { IShipmentRepositoryPort } from "../ports/outbound/database/database.js";
import { IShipmentEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IShipmentTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export type CreateShipmentUseCaseExecuteParams = {
  orderId: string;
  recipientName: string;
  address: string;
  trackingCode: string;
};

export class CreateShipmentUseCase {
  constructor(
    private readonly repository: IShipmentRepositoryPort,
    private readonly cache: IShipmentCachePort,
    private readonly eventBus: IShipmentEventBusPort,
    private readonly telemetry: IShipmentTelemetryPort,
  ) {}

  async execute(input: CreateShipmentUseCaseExecuteParams): Promise<ShipmentDTO> {
    return this.telemetry.span("shipments.create", async () => {
      const entity = Shipment.create({
        orderId: input.orderId,
        recipientName: input.recipientName,
        address: input.address,
        trackingCode: input.trackingCode,
      });
      const dto = entity.toDTO();

      await this.repository.save(dto);
      await this.cache.set(dto);
      await this.eventBus.publish("shipment.created", {
        type: "shipment.created",
        payload: {
          shipmentId: dto.id,
          orderId: dto.orderId,
          recipientName: dto.recipientName,
          trackingCode: dto.trackingCode,
        },
      });

      return dto;
    });
  }
}
