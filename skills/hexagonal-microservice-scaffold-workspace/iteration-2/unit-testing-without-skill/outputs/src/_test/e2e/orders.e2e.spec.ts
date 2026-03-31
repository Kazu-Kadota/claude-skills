// src/_test/e2e/orders.e2e.spec.ts
//
// E2E tests for the Orders HTTP endpoints.
//
// Strategy:
//   - Spin up a real Express application wired with in-memory stub adapters
//     (no real Postgres / MongoDB / Redis / Kafka / OTEL connections).
//   - Send HTTP requests with supertest and assert on status codes and response
//     shapes — exactly as a real client would.
//
// This gives full integration coverage of the routing layer → use-case →
// domain entity chain, without needing external infrastructure.

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import { OrderController } from "../../adapters/inbound/http/express/order-controller.js";
import { CreateOrderUseCase } from "../../application/use-cases/create-order.js";
import { GetOrderUseCase } from "../../application/use-cases/get-order.js";
import { CancelOrderUseCase } from "../../application/use-cases/cancel-order.js";
import { IOrderRepositoryWritePort } from "../../application/ports/outbound/database/database-write.js";
import { IOrderRepositoryReadPort } from "../../application/ports/outbound/database/database-read.js";
import { IOrderCachePort } from "../../application/ports/outbound/cache/cache.js";
import { IOrderEventBusPort } from "../../application/ports/outbound/messaging/messaging.js";
import { IOrderTelemetryPort } from "../../application/ports/outbound/telemetry/telemetry.js";
import { OrderDTO } from "../../domain/order.js";

// ---------------------------------------------------------------------------
// In-memory store shared across adapters (simulates Postgres write + MongoDB read)
// ---------------------------------------------------------------------------

class InMemoryOrderStore {
  private store = new Map<string, OrderDTO>();

  async save(entity: OrderDTO): Promise<void> {
    this.store.set(entity.id, { ...entity });
  }

  async updateOne(entity: OrderDTO): Promise<void> {
    if (!this.store.has(entity.id)) throw new Error("Order not found in store");
    this.store.set(entity.id, { ...entity });
  }

  async findById(id: string): Promise<OrderDTO | null> {
    return this.store.get(id) ?? null;
  }

  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// In-memory cache (simulates Redis)
// ---------------------------------------------------------------------------

class InMemoryCache implements IOrderCachePort {
  private cache = new Map<string, OrderDTO>();

  async get(id: string): Promise<OrderDTO | null> {
    return this.cache.get(id) ?? null;
  }

  async set(entity: OrderDTO): Promise<void> {
    this.cache.set(entity.id, { ...entity });
  }

  async delete(id: string): Promise<void> {
    this.cache.delete(id);
  }

  clear(): void {
    this.cache.clear();
  }
}

// ---------------------------------------------------------------------------
// Pass-through telemetry (no-op spans)
// ---------------------------------------------------------------------------

class NoopTelemetry implements IOrderTelemetryPort {
  async span<T>(_name: string, fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

// ---------------------------------------------------------------------------
// Application bootstrap helper
// ---------------------------------------------------------------------------

function buildApp(
  writeRepo: IOrderRepositoryWritePort,
  readRepo: IOrderRepositoryReadPort,
  cache: IOrderCachePort,
  eventBus: IOrderEventBusPort,
  telemetry: IOrderTelemetryPort,
): Express {
  const app = express();
  app.use(express.json());

  const createUseCase = new CreateOrderUseCase(writeRepo, cache, eventBus, telemetry);
  const getUseCase = new GetOrderUseCase(readRepo, cache, telemetry);
  const cancelUseCase = new CancelOrderUseCase(writeRepo, cache, eventBus, telemetry);

  const controller = new OrderController(createUseCase, getUseCase, cancelUseCase);
  app.use(controller.buildRouter());

  return app;
}

// ---------------------------------------------------------------------------
// Suite setup
// ---------------------------------------------------------------------------

describe("Orders HTTP endpoints (E2E)", () => {
  let app: Express;
  let store: InMemoryOrderStore;
  let cache: InMemoryCache;
  let publishSpy: ReturnType<typeof vi.fn>;

  const validCreateBody = {
    customerId: "e2e-customer-1",
    items: [
      { productId: "prod-e2e-1", quantity: 2, unitPrice: 15.0 },
      { productId: "prod-e2e-2", quantity: 1, unitPrice: 39.99 },
    ],
  };

  beforeAll(() => {
    store = new InMemoryOrderStore();
    cache = new InMemoryCache();
    publishSpy = vi.fn().mockResolvedValue(undefined);

    const writeRepo: IOrderRepositoryWritePort = {
      save: (e) => store.save(e),
      updateOne: (e) => store.updateOne(e),
      findById: (id) => store.findById(id),
    } as IOrderRepositoryWritePort;

    const readRepo: IOrderRepositoryReadPort = {
      findById: (id) => store.findById(id),
    } as IOrderRepositoryReadPort;

    const eventBus: IOrderEventBusPort = {
      publish: publishSpy,
    } as IOrderEventBusPort;

    app = buildApp(writeRepo, readRepo, cache, eventBus, new NoopTelemetry());
  });

  beforeEach(() => {
    store.clear();
    cache.clear();
    publishSpy.mockClear();
  });

  // -------------------------------------------------------------------------
  // POST /orders
  // -------------------------------------------------------------------------

  describe("POST /orders", () => {
    it("responds 201 with the created order on valid input", async () => {
      const res = await request(app).post("/orders").send(validCreateBody);

      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(res.body.customerId).toBe(validCreateBody.customerId);
      expect(res.body.status).toBe("pending");
      expect(res.body.items).toEqual(validCreateBody.items);
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it("persists the order so a subsequent GET returns it", async () => {
      const createRes = await request(app).post("/orders").send(validCreateBody);
      expect(createRes.status).toBe(201);

      const getRes = await request(app).get(`/orders/${createRes.body.id}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(createRes.body.id);
    });

    it("publishes an order.created event after successful creation", async () => {
      await request(app).post("/orders").send(validCreateBody);
      expect(publishSpy).toHaveBeenCalledWith(
        "order.created",
        expect.objectContaining({ type: "order.created" }),
      );
    });

    it("responds 400 when customerId is missing", async () => {
      const res = await request(app)
        .post("/orders")
        .send({ items: validCreateBody.items });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("responds 400 when items array is empty", async () => {
      const res = await request(app)
        .post("/orders")
        .send({ customerId: "c1", items: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/items/i);
    });

    it("responds 400 when an item has quantity 0", async () => {
      const res = await request(app).post("/orders").send({
        customerId: "c1",
        items: [{ productId: "p1", quantity: 0, unitPrice: 10 }],
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/quantity/i);
    });

    it("responds 400 when an item has a negative unitPrice", async () => {
      const res = await request(app).post("/orders").send({
        customerId: "c1",
        items: [{ productId: "p1", quantity: 1, unitPrice: -1 }],
      });

      expect(res.status).toBe(400);
    });

    it("each call generates a unique order id", async () => {
      const res1 = await request(app).post("/orders").send(validCreateBody);
      const res2 = await request(app).post("/orders").send(validCreateBody);

      expect(res1.body.id).not.toBe(res2.body.id);
    });
  });

  // -------------------------------------------------------------------------
  // GET /orders/:id
  // -------------------------------------------------------------------------

  describe("GET /orders/:id", () => {
    it("responds 200 with the order when it exists", async () => {
      const created = (await request(app).post("/orders").send(validCreateBody)).body as OrderDTO;

      // bypass cache by clearing it — forces a read-repository hit
      cache.clear();

      const res = await request(app).get(`/orders/${created.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.status).toBe("pending");
    });

    it("serves the response from cache on the second request", async () => {
      const created = (await request(app).post("/orders").send(validCreateBody)).body as OrderDTO;

      // First request populates cache
      await request(app).get(`/orders/${created.id}`);
      // Second request hits cache — result should still be correct
      const res = await request(app).get(`/orders/${created.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
    });

    it("responds 404 when the order id does not exist", async () => {
      const res = await request(app).get("/orders/does-not-exist");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/order not found/i);
    });
  });

  // -------------------------------------------------------------------------
  // PUT /orders/:id/cancel
  // -------------------------------------------------------------------------

  describe("PUT /orders/:id/cancel", () => {
    it("responds 200 with the cancelled order when it exists and is pending", async () => {
      const created = (await request(app).post("/orders").send(validCreateBody)).body as OrderDTO;

      const res = await request(app).put(`/orders/${created.id}/cancel`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.status).toBe("cancelled");
    });

    it("publishes an order.cancelled event after successful cancellation", async () => {
      const created = (await request(app).post("/orders").send(validCreateBody)).body as OrderDTO;
      publishSpy.mockClear();

      await request(app).put(`/orders/${created.id}/cancel`);

      expect(publishSpy).toHaveBeenCalledWith(
        "order.cancelled",
        expect.objectContaining({
          type: "order.cancelled",
          payload: expect.objectContaining({ orderId: created.id }),
        }),
      );
    });

    it("updates the cache so subsequent GET returns the cancelled status", async () => {
      const created = (await request(app).post("/orders").send(validCreateBody)).body as OrderDTO;
      await request(app).put(`/orders/${created.id}/cancel`);

      const getRes = await request(app).get(`/orders/${created.id}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.status).toBe("cancelled");
    });

    it("responds 404 when the order id does not exist", async () => {
      const res = await request(app).put("/orders/non-existent/cancel");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/order not found/i);
    });

    it("responds 409 when the order is already cancelled", async () => {
      const created = (await request(app).post("/orders").send(validCreateBody)).body as OrderDTO;

      await request(app).put(`/orders/${created.id}/cancel`);
      const secondCancel = await request(app).put(`/orders/${created.id}/cancel`);

      expect(secondCancel.status).toBe(409);
      expect(secondCancel.body.error).toMatch(/already cancelled/i);
    });

    it("does not publish a second event when cancellation fails due to conflict", async () => {
      const created = (await request(app).post("/orders").send(validCreateBody)).body as OrderDTO;

      await request(app).put(`/orders/${created.id}/cancel`); // first cancel
      publishSpy.mockClear();

      await request(app).put(`/orders/${created.id}/cancel`); // second (conflict)

      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Full happy-path workflow
  // -------------------------------------------------------------------------

  describe("full order lifecycle", () => {
    it("create → get → cancel → get reflects cancelled status throughout", async () => {
      // 1. Create
      const createRes = await request(app).post("/orders").send(validCreateBody);
      expect(createRes.status).toBe(201);
      const orderId = createRes.body.id as string;

      // 2. Get (pending)
      const getBeforeRes = await request(app).get(`/orders/${orderId}`);
      expect(getBeforeRes.status).toBe(200);
      expect(getBeforeRes.body.status).toBe("pending");

      // 3. Cancel
      const cancelRes = await request(app).put(`/orders/${orderId}/cancel`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.status).toBe("cancelled");

      // 4. Get after cancel (should be cancelled)
      const getAfterRes = await request(app).get(`/orders/${orderId}`);
      expect(getAfterRes.status).toBe(200);
      expect(getAfterRes.body.status).toBe("cancelled");
    });
  });
});
