// src/application/use-cases/_test/create-order.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { CreateOrderUseCase } from "../create-order.js";
import {
  FakeWriteRepo,
  FakeCache,
  FakeEventBus,
  PassthroughTelemetry,
} from "./doubles.js";

const validItems = [{ productId: "prod-1", quantity: 2, unitPrice: 50 }];

describe("CreateOrderUseCase", () => {
  let writeRepo: FakeWriteRepo;
  let cache: FakeCache;
  let eventBus: FakeEventBus;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    writeRepo = new FakeWriteRepo();
    cache = new FakeCache();
    eventBus = new FakeEventBus();
    useCase = new CreateOrderUseCase(
      writeRepo,
      cache,
      eventBus,
      new PassthroughTelemetry(),
    );
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it("returns a DTO with a generated UUID id", async () => {
    const result = await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("returns a DTO with pending status", async () => {
    const result = await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(result.status).toBe("pending");
  });

  it("returns a DTO with the correct customerId", async () => {
    const result = await useCase.execute({ customerId: "cust-99", items: validItems });
    expect(result.customerId).toBe("cust-99");
  });

  it("returns a DTO with the items passed in", async () => {
    const result = await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(result.items).toEqual(validItems);
  });

  // -------------------------------------------------------------------------
  // Write repository
  // -------------------------------------------------------------------------

  it("persists the order to the write repository", async () => {
    await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(writeRepo.store).toHaveLength(1);
  });

  it("persists the order with the correct customerId", async () => {
    await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(writeRepo.store[0].customerId).toBe("cust-1");
  });

  it("the persisted DTO matches the returned DTO", async () => {
    const result = await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(writeRepo.store[0]).toEqual(result);
  });

  // -------------------------------------------------------------------------
  // Cache
  // -------------------------------------------------------------------------

  it("populates the cache with the new order", async () => {
    const result = await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(cache.store.get(result.id)).toBeDefined();
  });

  it("cached value matches the returned DTO", async () => {
    const result = await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(cache.store.get(result.id)).toEqual(result);
  });

  // -------------------------------------------------------------------------
  // Event bus
  // -------------------------------------------------------------------------

  it("publishes exactly one event", async () => {
    await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(eventBus.events).toHaveLength(1);
  });

  it("publishes to the order.created topic", async () => {
    await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(eventBus.events[0].topic).toBe("order.created");
  });

  it("event payload contains the correct orderId", async () => {
    const result = await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(eventBus.events[0].message).toMatchObject({
      type: "order.created",
      payload: { orderId: result.id },
    });
  });

  it("event payload contains the correct customerId", async () => {
    await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(eventBus.events[0].message).toMatchObject({
      payload: { customerId: "cust-1" },
    });
  });

  // -------------------------------------------------------------------------
  // Validation — delegates to Order.create()
  // -------------------------------------------------------------------------

  it("throws when customerId is empty", async () => {
    await expect(
      useCase.execute({ customerId: "", items: validItems }),
    ).rejects.toThrow("customerId is required");
  });

  it("throws when items is empty", async () => {
    await expect(
      useCase.execute({ customerId: "cust-1", items: [] }),
    ).rejects.toThrow("Order must have at least one item");
  });

  it("does not persist anything when validation fails", async () => {
    await useCase.execute({ customerId: "cust-1", items: validItems }).catch(() => {});
    const failingExecute = useCase.execute({ customerId: "", items: validItems }).catch(() => {});
    await failingExecute;
    expect(writeRepo.store).toHaveLength(1); // only the successful one
  });

  // -------------------------------------------------------------------------
  // Idempotency — two calls produce two independent orders
  // -------------------------------------------------------------------------

  it("creates distinct orders on successive calls", async () => {
    const first = await useCase.execute({ customerId: "cust-1", items: validItems });
    const second = await useCase.execute({ customerId: "cust-1", items: validItems });
    expect(first.id).not.toBe(second.id);
    expect(writeRepo.store).toHaveLength(2);
  });
});
