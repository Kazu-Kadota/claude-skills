// src/application/use-cases/create-order.ts
import { Order, OrderDTO, OrderItem } from "../../domain/order.js";
import { IOrderCachePort } from "../ports/outbound/cache/cache.js";
import { IOrderRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IOrderEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IOrderTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export type CreateOrderInput = {
  customerId: string;
  items: OrderItem[];
};

export class CreateOrderUseCase {
  constructor(
    private readonly writeRepository: IOrderRepositoryWritePort,
    private readonly cache: IOrderCachePort,
    private readonly eventBus: IOrderEventBusPort,
    private readonly telemetry: IOrderTelemetryPort,
  ) {}

  async execute(input: CreateOrderInput): Promise<OrderDTO> {
    return this.telemetry.span("orders.create", async () => {
      const entity = Order.create({
        customerId: input.customerId,
        items: input.items,
      });
      const dto = entity.toDTO();

      await this.writeRepository.save(dto);
      await this.cache.set(dto);
      await this.eventBus.publish("order.created", {
        type: "order.created",
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
