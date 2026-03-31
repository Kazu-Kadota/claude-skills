// src/application/use-cases/_test/cancel-order.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CancelOrderUseCase } from "../cancel-order.js";
import { IOrderRepositoryWritePort } from "../../ports/outbound/database/database-write.js";
import { IOrderCachePort } from "../../ports/outbound/cache/cache.js";
import { IOrderEventBusPort } from "../../ports/outbound/messaging/messaging.js";
import { IOrderTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";
import { OrderDTO } from "../../../domain/order.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const pendingOrder: OrderDTO = {
  id: "order-cancel-1",
  customerId: "cust-777",
  items: [{ productId: "prod-X", quantity: 3, unitPrice: 9.0 }],
  status: "pending",
  createdAt: "2025-02-01T08:00:00.000Z",
  updatedAt: "2025-02-01T08:00:00.000Z",
};

const alreadyCancelledOrder: OrderDTO = {
  ...pendingOrder,
  id: "order-cancel-2",
  status: "cancelled",
};

// ---------------------------------------------------------------------------
// Stub factories
// ---------------------------------------------------------------------------

function makeWriteRepo(returnValue: OrderDTO | null = pendingOrder): IOrderRepositoryWritePort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    updateOne: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(returnValue),
  } as unknown as IOrderRepositoryWritePort;
}

function makeCache(): IOrderCachePort {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as IOrderCachePort;
}

function makeEventBus(): IOrderEventBusPort {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
  } as unknown as IOrderEventBusPort;
}

function makeTelemetry(): IOrderTelemetryPort {
  return {
    span: vi.fn().mockImplementation((_name: string, fn: () => Promise<unknown>) => fn()),
  } as unknown as IOrderTelemetryPort;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CancelOrderUseCase", () => {
  let writeRepo: ReturnType<typeof makeWriteRepo>;
  let cache: ReturnType<typeof makeCache>;
  let eventBus: ReturnType<typeof makeEventBus>;
  let telemetry: ReturnType<typeof makeTelemetry>;
  let useCase: CancelOrderUseCase;

  // --- Happy path -----------------------------------------------------------

  describe("when the order exists and is pending", () => {
    beforeEach(() => {
      writeRepo = makeWriteRepo(pendingOrder);
      cache = makeCache();
      eventBus = makeEventBus();
      telemetry = makeTelemetry();
      useCase = new CancelOrderUseCase(writeRepo, cache, eventBus, telemetry);
    });

    it("returns the updated OrderDTO with status cancelled", async () => {
      const result = await useCase.execute(pendingOrder.id);
      expect(result.status).toBe("cancelled");
      expect(result.id).toBe(pendingOrder.id);
      expect(result.customerId).toBe(pendingOrder.customerId);
    });

    it("fetches the order from writeRepository.findById", async () => {
      await useCase.execute(pendingOrder.id);
      expect(writeRepo.findById).toHaveBeenCalledWith(pendingOrder.id);
    });

    it("persists the updated order via writeRepository.updateOne", async () => {
      const result = await useCase.execute(pendingOrder.id);
      expect(writeRepo.updateOne).toHaveBeenCalledOnce();
      expect(writeRepo.updateOne).toHaveBeenCalledWith(result);
    });

    it("updates the cache with the cancelled DTO", async () => {
      const result = await useCase.execute(pendingOrder.id);
      expect(cache.set).toHaveBeenCalledOnce();
      expect(cache.set).toHaveBeenCalledWith(result);
    });

    it("publishes an order.cancelled event", async () => {
      const result = await useCase.execute(pendingOrder.id);

      expect(eventBus.publish).toHaveBeenCalledOnce();
      const [topic, message] = (eventBus.publish as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        { type: string; payload: { orderId: string; customerId: string } },
      ];
      expect(topic).toBe("order.cancelled");
      expect(message.type).toBe("order.cancelled");
      expect(message.payload.orderId).toBe(result.id);
      expect(message.payload.customerId).toBe(pendingOrder.customerId);
    });

    it("wraps execution inside a telemetry span named 'orders.cancel'", async () => {
      await useCase.execute(pendingOrder.id);
      expect(telemetry.span).toHaveBeenCalledWith("orders.cancel", expect.any(Function));
    });

    it("does NOT call writeRepository.save — uses updateOne instead", async () => {
      await useCase.execute(pendingOrder.id);
      expect(writeRepo.save).not.toHaveBeenCalled();
    });
  });

  // --- Order not found ------------------------------------------------------

  describe("when the order does not exist", () => {
    beforeEach(() => {
      writeRepo = makeWriteRepo(null);
      cache = makeCache();
      eventBus = makeEventBus();
      telemetry = makeTelemetry();
      useCase = new CancelOrderUseCase(writeRepo, cache, eventBus, telemetry);
    });

    it("throws an 'Order not found' error", async () => {
      await expect(useCase.execute("non-existent")).rejects.toThrowError(
        /order not found/i,
      );
    });

    it("does not persist or publish anything when order is not found", async () => {
      await expect(useCase.execute("non-existent")).rejects.toThrow();
      expect(writeRepo.updateOne).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  // --- Already cancelled ----------------------------------------------------

  describe("when the order is already cancelled", () => {
    beforeEach(() => {
      writeRepo = makeWriteRepo(alreadyCancelledOrder);
      cache = makeCache();
      eventBus = makeEventBus();
      telemetry = makeTelemetry();
      useCase = new CancelOrderUseCase(writeRepo, cache, eventBus, telemetry);
    });

    it("throws a domain error about the order already being cancelled", async () => {
      await expect(useCase.execute(alreadyCancelledOrder.id)).rejects.toThrowError(
        /already cancelled|cancel/i,
      );
    });

    it("does not persist or publish anything when cancellation fails", async () => {
      await expect(useCase.execute(alreadyCancelledOrder.id)).rejects.toThrow();
      expect(writeRepo.updateOne).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
});
