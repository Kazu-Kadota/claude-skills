// src/application/use-cases/get-order.ts
import { Order, OrderDTO } from "../../domain/order.js";
import { IOrderCachePort } from "../ports/outbound/cache/cache.js";
import { IOrderRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { IOrderTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class GetOrderUseCase {
  constructor(
    private readonly readRepository: IOrderRepositoryReadPort,
    private readonly cache: IOrderCachePort,
    private readonly telemetry: IOrderTelemetryPort,
  ) {}

  async execute(id: string): Promise<OrderDTO> {
    return this.telemetry.span("orders.get", async () => {
      const cached = await this.cache.get(id);
      if (cached) return cached;

      const raw = await this.readRepository.findById(id);
      if (!raw) throw new Error("Order not found");

      const entity = Order.reconstitute(raw);
      const dto = entity.toDTO();

      await this.cache.set(dto);
      return dto;
    });
  }
}
