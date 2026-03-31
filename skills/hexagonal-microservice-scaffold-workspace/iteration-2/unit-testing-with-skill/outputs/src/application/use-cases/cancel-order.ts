// src/application/use-cases/cancel-order.ts
import { Order, OrderDTO } from "../../domain/order.js";
import { IOrderCachePort } from "../ports/outbound/cache/cache.js";
import { IOrderRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { IOrderRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IOrderEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IOrderTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class CancelOrderUseCase {
  constructor(
    private readonly readRepository: IOrderRepositoryReadPort,
    private readonly writeRepository: IOrderRepositoryWritePort,
    private readonly cache: IOrderCachePort,
    private readonly eventBus: IOrderEventBusPort,
    private readonly telemetry: IOrderTelemetryPort,
  ) {}

  private async cancelOrder(entity: Order): Promise<OrderDTO> {
    entity.cancel();
    const dto = entity.toDTO();

    await this.writeRepository.updateOne(dto);
    await this.cache.set(dto);
    await this.eventBus.publish("order.cancelled", {
      type: "order.cancelled",
      payload: {
        orderId: dto.id,
        customerId: dto.customerId,
      },
    });

    return dto;
  }

  async execute(id: string): Promise<OrderDTO> {
    return this.telemetry.span("orders.cancel", async () => {
      const cached = await this.cache.get(id);
      if (cached) {
        const entity = Order.reconstitute(cached);
        return this.cancelOrder(entity);
      }

      const projection = await this.readRepository.findById(id);
      if (!projection) throw new Error("Order not found");

      const entity = Order.reconstitute(projection);
      return this.cancelOrder(entity);
    });
  }
}
