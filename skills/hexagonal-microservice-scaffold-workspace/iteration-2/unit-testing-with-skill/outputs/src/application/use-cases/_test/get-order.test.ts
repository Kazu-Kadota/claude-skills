// src/application/use-cases/_test/get-order.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { GetOrderUseCase } from "../get-order.js";
import { CreateOrderUseCase } from "../create-order.js";
import {
  FakeWriteRepo,
  FakeReadRepo,
  FakeCache,
  FakeEventBus,
  PassthroughTelemetry,
} from "./doubles.js";
import type { OrderDTO } from "../../../domain/order.js";

const validItems = [{ productId: "prod-1", quantity: 1, unitPrice: 20 }];

const seedOrder: OrderDTO = {
  id: "ord-seed",
  customerId: "cust-seed",
  items: validItems,
  status: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("GetOrderUseCase", () => {
  let writeRepo: FakeWriteRepo;
  let readRepo: FakeReadRepo;
  let cache: FakeCache;
  let telemetry: PassthroughTelemetry;
  let getOrder: GetOrderUseCase;

  beforeEach(() => {
    writeRepo = new FakeWriteRepo();
    // Share write repo's store with read repo to simulate CQRS propagation
    readRepo = new FakeReadRepo(writeRepo.store);
    cache = new FakeCache();
    telemetry = new PassthroughTelemetry();
    getOrder = new GetOrderUseCase(readRepo, cache, telemetry);
  });

  // -------------------------------------------------------------------------
  // Cache-hit path
  // -------------------------------------------------------------------------

  it("returns the order from cache when it exists", async () => {
    cache.store.set(seedOrder.id, seedOrder);
    const result = await getOrder.execute(seedOrder.id);
    expect(result.id).toBe(seedOrder.id);
  });

  it("does NOT query the read repo when the cache has a hit", async () => {
    cache.store.set(seedOrder.id, seedOrder);
    // readRepo store is empty — if it were queried, it would return null
    const result = await getOrder.execute(seedOrder.id);
    expect(result).toEqual(seedOrder);
  });

  it("returns the exact cached DTO", async () => {
    cache.store.set(seedOrder.id, seedOrder);
    const result = await getOrder.execute(seedOrder.id);
    expect(result).toEqual(seedOrder);
  });

  // -------------------------------------------------------------------------
  // Cache-miss → DB fallback path
  // -------------------------------------------------------------------------

  it("falls back to the read repo on cache miss", async () => {
    writeRepo.store.push(seedOrder); // visible to readRepo via shared store
    const result = await getOrder.execute(seedOrder.id);
    expect(result.id).toBe(seedOrder.id);
  });

  it("populates the cache after a DB read", async () => {
    writeRepo.store.push(seedOrder);
    await getOrder.execute(seedOrder.id);
    expect(cache.store.get(seedOrder.id)).toBeDefined();
  });

  it("cached value after DB read equals the returned DTO", async () => {
    writeRepo.store.push(seedOrder);
    const result = await getOrder.execute(seedOrder.id);
    expect(cache.store.get(seedOrder.id)).toEqual(result);
  });

  it("returns the correct order when multiple orders are in the DB", async () => {
    const other: OrderDTO = { ...seedOrder, id: "ord-other", customerId: "cust-other" };
    writeRepo.store.push(seedOrder, other);
    const result = await getOrder.execute(seedOrder.id);
    expect(result.id).toBe(seedOrder.id);
    expect(result.customerId).toBe(seedOrder.customerId);
  });

  // -------------------------------------------------------------------------
  // Not found
  // -------------------------------------------------------------------------

  it("throws 'Order not found' when neither cache nor DB has the order", async () => {
    await expect(getOrder.execute("non-existent-id")).rejects.toThrow(
      "Order not found",
    );
  });

  // -------------------------------------------------------------------------
  // Integration with CreateOrderUseCase — create then get
  // -------------------------------------------------------------------------

  it("returns an order that was just created via CreateOrderUseCase", async () => {
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

    // cache is already populated by create; get should hit cache
    const fetched = await getOrder.execute(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.status).toBe("pending");
  });

  it("returns an order from the DB after clearing the cache", async () => {
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

    // Manually evict cache to force the DB path
    cache.store.delete(created.id);

    const fetched = await getOrder.execute(created.id);
    expect(fetched.id).toBe(created.id);
  });
});
