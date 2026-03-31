// src/application/use-cases/_test/get-order.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetOrderUseCase } from "../get-order.js";
import { IOrderRepositoryReadPort } from "../../ports/outbound/database/database-read.js";
import { IOrderCachePort } from "../../ports/outbound/cache/cache.js";
import { IOrderTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";
import { OrderDTO } from "../../../domain/order.js";

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const storedOrder: OrderDTO = {
  id: "order-id-1",
  customerId: "cust-999",
  items: [{ productId: "prod-A", quantity: 1, unitPrice: 29.99 }],
  status: "pending",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Stub factories
// ---------------------------------------------------------------------------

function makeReadRepo(returnValue: OrderDTO | null = storedOrder): IOrderRepositoryReadPort {
  return {
    findById: vi.fn().mockResolvedValue(returnValue),
  } as unknown as IOrderRepositoryReadPort;
}

function makeCache(cachedValue: OrderDTO | null = null): IOrderCachePort {
  return {
    get: vi.fn().mockResolvedValue(cachedValue),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as IOrderCachePort;
}

function makeTelemetry(): IOrderTelemetryPort {
  return {
    span: vi.fn().mockImplementation((_name: string, fn: () => Promise<unknown>) => fn()),
  } as unknown as IOrderTelemetryPort;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GetOrderUseCase", () => {
  let readRepo: ReturnType<typeof makeReadRepo>;
  let cache: ReturnType<typeof makeCache>;
  let telemetry: ReturnType<typeof makeTelemetry>;
  let useCase: GetOrderUseCase;

  // --- Cache MISS scenario ---------------------------------------------------

  describe("when cache does not have the order (cache miss)", () => {
    beforeEach(() => {
      readRepo = makeReadRepo(storedOrder);
      cache = makeCache(null); // cache miss
      telemetry = makeTelemetry();
      useCase = new GetOrderUseCase(readRepo, cache, telemetry);
    });

    it("returns the order DTO from the read repository", async () => {
      const result = await useCase.execute(storedOrder.id);
      expect(result).toEqual(storedOrder);
    });

    it("queries cache first before touching the read repository", async () => {
      await useCase.execute(storedOrder.id);
      expect(cache.get).toHaveBeenCalledWith(storedOrder.id);
      expect(readRepo.findById).toHaveBeenCalledWith(storedOrder.id);
    });

    it("populates the cache after fetching from the repository", async () => {
      const result = await useCase.execute(storedOrder.id);
      expect(cache.set).toHaveBeenCalledOnce();
      expect(cache.set).toHaveBeenCalledWith(result);
    });

    it("wraps execution inside a telemetry span named 'orders.get'", async () => {
      await useCase.execute(storedOrder.id);
      expect(telemetry.span).toHaveBeenCalledWith("orders.get", expect.any(Function));
    });
  });

  // --- Cache HIT scenario ----------------------------------------------------

  describe("when cache has the order (cache hit)", () => {
    const cachedOrder: OrderDTO = { ...storedOrder, status: "pending" };

    beforeEach(() => {
      readRepo = makeReadRepo(storedOrder);
      cache = makeCache(cachedOrder); // cache hit
      telemetry = makeTelemetry();
      useCase = new GetOrderUseCase(readRepo, cache, telemetry);
    });

    it("returns the cached DTO without hitting the read repository", async () => {
      const result = await useCase.execute(cachedOrder.id);
      expect(result).toEqual(cachedOrder);
      expect(readRepo.findById).not.toHaveBeenCalled();
    });

    it("does not overwrite the cache when the value was already there", async () => {
      await useCase.execute(cachedOrder.id);
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  // --- Not found scenario ----------------------------------------------------

  describe("when order does not exist in either cache or repository", () => {
    beforeEach(() => {
      readRepo = makeReadRepo(null); // repo also returns null
      cache = makeCache(null);
      telemetry = makeTelemetry();
      useCase = new GetOrderUseCase(readRepo, cache, telemetry);
    });

    it("throws an 'Order not found' error", async () => {
      await expect(useCase.execute("non-existent-id")).rejects.toThrowError(
        /order not found/i,
      );
    });

    it("does not call cache.set when order is not found", async () => {
      await expect(useCase.execute("non-existent-id")).rejects.toThrow();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });
});
