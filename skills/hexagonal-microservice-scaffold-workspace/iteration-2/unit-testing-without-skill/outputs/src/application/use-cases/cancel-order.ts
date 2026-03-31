// src/application/use-cases/cancel-order.ts
import { Order, OrderDTO } from "../../domain/order.js";
import { IOrderCachePort } from "../ports/outbound/cache/cache.js";
import { IOrderRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IOrderEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IOrderTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class CancelOrderUseCase {
  constructor(
    private readonly writeRepository: IOrderRepositoryWritePort,
    private readonly cache: IOrderCachePort,
    private readonly eventBus: IOrderEventBusPort,
    private readonly telemetry: IOrderTelemetryPort,
  ) {}

  async execute(id: string): Promise<OrderDTO> {
    return this.telemetry.span("orders.cancel", async () => {
      const raw = await this.writeRepository.findById(id);
      if (!raw) throw new Error("Order not found");

      const entity = Order.reconstitute(raw);
      entity.cancel();
      const dto = entity.toDTO();

      await this.writeRepository.updateOne(dto);
      await this.cache.set(dto);
      await this.eventBus.publish("order.cancelled", {
        type: "order.cancelled",
        payload: {
          orderId: dto.id,
          customerId: dto.customerId,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      return dto;
    });
  }
}
