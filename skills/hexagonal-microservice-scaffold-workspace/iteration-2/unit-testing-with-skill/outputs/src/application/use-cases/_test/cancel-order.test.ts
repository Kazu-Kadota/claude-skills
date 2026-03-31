// src/application/use-cases/_test/cancel-order.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { CancelOrderUseCase } from "../cancel-order.js";
import { CreateOrderUseCase } from "../create-order.js";
import {
  FakeWriteRepo,
  FakeReadRepo,
  FakeCache,
  FakeEventBus,
  PassthroughTelemetry,
} from "./doubles.js";
import type { OrderDTO } from "../../../domain/order.js";

const validItems = [{ productId: "prod-1", quantity: 1, unitPrice: 30 }];

const pendingOrder: OrderDTO = {
  id: "ord-pending",
  customerId: "cust-1",
  items: validItems,
  status: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const cancelledOrder: OrderDTO = {
  ...pendingOrder,
  id: "ord-cancelled",
  status: "cancelled",
};

describe("CancelOrderUseCase", () => {
  let writeRepo: FakeWriteRepo;
  let readRepo: FakeReadRepo;
  let cache: FakeCache;
  let eventBus: FakeEventBus;
  let telemetry: PassthroughTelemetry;
  let cancelOrder: CancelOrderUseCase;

  beforeEach(() => {
    writeRepo = new FakeWriteRepo();
    readRepo = new FakeReadRepo(writeRepo.store);
    cache = new FakeCache();
    eventBus = new FakeEventBus();
    telemetry = new PassthroughTelemetry();
    cancelOrder = new CancelOrderUseCase(
      readRepo,
      writeRepo,
      cache,
      eventBus,
      telemetry,
    );
  });

  // -------------------------------------------------------------------------
  // Cancel via cache hit
  // -------------------------------------------------------------------------

  it("cancels an order found in the cache", async () => {
    cache.store.set(pendingOrder.id, pendingOrder);
    const result = await cancelOrder.execute(pendingOrder.id);
    expect(result.status).toBe("cancelled");
  });

  it("updates the cache entry to cancelled after cancel (cache-hit path)", async () => {
    cache.store.set(pendingOrder.id, pendingOrder);
    await cancelOrder.execute(pendingOrder.id);
    expect(cache.store.get(pendingOrder.id)?.status).toBe("cancelled");
  });

  it("persists the cancellation to the write repo (cache-hit path)", async () => {
    cache.store.set(pendingOrder.id, pendingOrder);
    writeRepo.store.push(pendingOrder);
    await cancelOrder.execute(pendingOrder.id);
    expect(writeRepo.store[0].status).toBe("cancelled");
  });

  it("publishes order.cancelled event (cache-hit path)", async () => {
    cache.store.set(pendingOrder.id, pendingOrder);
    await cancelOrder.execute(pendingOrder.id);
    expect(eventBus.events).toHaveLength(1);
    expect(eventBus.events[0].topic).toBe("order.cancelled");
  });

  it("event payload contains the orderId (cache-hit path)", async () => {
    cache.store.set(pendingOrder.id, pendingOrder);
    await cancelOrder.execute(pendingOrder.id);
    expect(eventBus.events[0].message).toMatchObject({
      type: "order.cancelled",
      payload: { orderId: pendingOrder.id },
    });
  });

  // -------------------------------------------------------------------------
  // Cancel via DB fallback (cache miss)
  // -------------------------------------------------------------------------

  it("cancels an order found in the DB when cache is empty", async () => {
    writeRepo.store.push(pendingOrder);
    const result = await cancelOrder.execute(pendingOrder.id);
    expect(result.status).toBe("cancelled");
  });

  it("updates the cache after DB-fallback cancellation", async () => {
    writeRepo.store.push(pendingOrder);
    await cancelOrder.execute(pendingOrder.id);
    expect(cache.store.get(pendingOrder.id)?.status).toBe("cancelled");
  });

  it("publishes order.cancelled event (DB-fallback path)", async () => {
    writeRepo.store.push(pendingOrder);
    await cancelOrder.execute(pendingOrder.id);
    expect(eventBus.events[0].topic).toBe("order.cancelled");
  });

  // -------------------------------------------------------------------------
  // Not found
  // -------------------------------------------------------------------------

  it("throws 'Order not found' when order does not exist in cache or DB", async () => {
    await expect(cancelOrder.execute("non-existent-id")).rejects.toThrow(
      "Order not found",
    );
  });

  it("publishes no events when order is not found", async () => {
    await cancelOrder.execute("non-existent-id").catch(() => {});
    expect(eventBus.events).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Already cancelled guard (domain-level)
  // -------------------------------------------------------------------------

  it("throws when trying to cancel an already-cancelled order (from cache)", async () => {
    cache.store.set(cancelledOrder.id, cancelledOrder);
    await expect(cancelOrder.execute(cancelledOrder.id)).rejects.toThrow(
      "Order is already cancelled",
    );
  });

  it("throws when trying to cancel an already-cancelled order (from DB)", async () => {
    writeRepo.store.push(cancelledOrder);
    await expect(cancelOrder.execute(cancelledOrder.id)).rejects.toThrow(
      "Order is already cancelled",
    );
  });

  it("does not publish an event when domain throws on double-cancel", async () => {
    cache.store.set(cancelledOrder.id, cancelledOrder);
    await cancelOrder.execute(cancelledOrder.id).catch(() => {});
    expect(eventBus.events).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Integration: create → cancel
  // -------------------------------------------------------------------------

  it("cancels an order that was freshly created by CreateOrderUseCase", async () => {
    const createOrder = new CreateOrderUseCase(
      writeRepo,
      cache,
      new FakeEventBus(),
      telemetry,
    );
    const created = await createOrder.execute({
      customerId: "cust-1",
      items: validItems,
    });

    const result = await cancelOrder.execute(created.id);
    expect(result.status).toBe("cancelled");
  });

  it("the write repo reflects cancelled status after full create→cancel flow", async () => {
    const createOrder = new CreateOrderUseCase(
      writeRepo,
      cache,
      new FakeEventBus(),
      telemetry,
    );
    const created = await createOrder.execute({
      customerId: "cust-1",
      items: validItems,
    });

    await cancelOrder.execute(created.id);
    const stored = writeRepo.store.find((o) => o.id === created.id);
    expect(stored?.status).toBe("cancelled");
  });

  it("publishes exactly one order.cancelled event on successful cancel", async () => {
    writeRepo.store.push(pendingOrder);
    await cancelOrder.execute(pendingOrder.id);
    const cancelledEvents = eventBus.events.filter(
      (e) => e.topic === "order.cancelled",
    );
    expect(cancelledEvents).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Return value
  // -------------------------------------------------------------------------

  it("returns the updated DTO with cancelled status", async () => {
    cache.store.set(pendingOrder.id, pendingOrder);
    const result = await cancelOrder.execute(pendingOrder.id);
    expect(result.id).toBe(pendingOrder.id);
    expect(result.status).toBe("cancelled");
    expect(result.customerId).toBe(pendingOrder.customerId);
  });

  it("returned DTO has an updated updatedAt timestamp", async () => {
    cache.store.set(pendingOrder.id, pendingOrder);
    const result = await cancelOrder.execute(pendingOrder.id);
    // updatedAt should differ from the original seed value
    expect(result.updatedAt).not.toBe(pendingOrder.updatedAt);
  });
});
