import { Order } from "../../entity/order/order.js";
import { IOrdersCachePort } from "../ports/outbound/cache/cache.js";
import { IOrdersRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { IOrdersRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IOrdersEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IOrdersTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class MarkOrderAsPaidUseCase {
  constructor(
    private readonly readOrderRepository: IOrdersRepositoryReadPort,
    private readonly writeOrderRepository: IOrdersRepositoryWritePort,
    private readonly cache: IOrdersCachePort,
    private readonly eventBus: IOrdersEventBusPort,
    private readonly telemetry: IOrdersTelemetryPort
  ) {}

  private async applyPaid(order: Order): Promise<void> {
    order.markAsPaid();
    const orderDTO = order.toDTO();

    await this.writeOrderRepository.updateOne(orderDTO);
    await this.cache.set(orderDTO);
    await this.eventBus.publish("order.paid", {
      type: "order.paid",
      payload: {
        orderId: orderDTO.id,
        customerId: orderDTO.customerId,
        amount: orderDTO.amount,
        currency: orderDTO.currency,
      },
    });
  }

  async execute(id: string): Promise<void> {
    return this.telemetry.span("orders.mark-as-paid", async () => {
      const cached = await this.cache.get(id);

      if (cached) {
        const order = Order.reconstitute(cached);
        await this.applyPaid(order);
        return;
      }

      const orderProjection = await this.readOrderRepository.findById(id);

      if (!orderProjection) throw new Error("Order not found");

      const order = Order.reconstitute(orderProjection);
      await this.applyPaid(order);
    });
  }
}
