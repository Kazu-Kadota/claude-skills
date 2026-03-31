// src/application/use-cases/get-order.ts
import { IOrderCachePort } from "../ports/outbound/cache/cache.js";
import { IOrderRepositoryReadPort, FindByIdProjection } from "../ports/outbound/database/database-read.js";
import { IOrderTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class GetOrderUseCase {
  constructor(
    private readonly readRepository: IOrderRepositoryReadPort,
    private readonly cache: IOrderCachePort,
    private readonly telemetry: IOrderTelemetryPort,
  ) {}

  async execute(id: string): Promise<FindByIdProjection> {
    return this.telemetry.span("orders.get", async () => {
      const cached = await this.cache.get(id);
      if (cached) return cached;

      const entity = await this.readRepository.findById(id);
      if (!entity) throw new Error("Order not found");

      await this.cache.set(entity);
      return entity;
    });
  }
}
