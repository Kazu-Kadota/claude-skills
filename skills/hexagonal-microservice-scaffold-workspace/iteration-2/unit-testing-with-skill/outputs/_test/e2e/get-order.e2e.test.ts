// _test/e2e/get-order.e2e.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp } from "./setup.js";

const validBody = {
  customerId: "cust-1",
  items: [{ productId: "prod-1", quantity: 1, unitPrice: 10 }],
};

describe("GET /orders/:id", () => {
  // -------------------------------------------------------------------------
  // Happy path — 200
  // -------------------------------------------------------------------------

  it("returns 200 for an existing order", async () => {
    const { app } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);
    const res = await request(app).get(`/orders/${created.body.id}`);

    expect(res.status).toBe(200);
  });

  it("response body id matches the requested id", async () => {
    const { app } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);
    const res = await request(app).get(`/orders/${created.body.id}`);

    expect(res.body.id).toBe(created.body.id);
  });

  it("response body customerId matches what was created", async () => {
    const { app } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);
    const res = await request(app).get(`/orders/${created.body.id}`);

    expect(res.body.customerId).toBe("cust-1");
  });

  it("response body items match what was created", async () => {
    const { app } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);
    const res = await request(app).get(`/orders/${created.body.id}`);

    expect(res.body.items).toEqual(validBody.items);
  });

  it("response body status is pending for a fresh order", async () => {
    const { app } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);
    const res = await request(app).get(`/orders/${created.body.id}`);

    expect(res.body.status).toBe("pending");
  });

  it("response Content-Type is application/json", async () => {
    const { app } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);
    const res = await request(app).get(`/orders/${created.body.id}`);

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("returns the correct order when multiple orders exist", async () => {
    const { app } = buildTestApp();
    await request(app)
      .post("/orders")
      .send({ customerId: "cust-a", items: validBody.items });
    const target = await request(app)
      .post("/orders")
      .send({ customerId: "cust-b", items: validBody.items });
    await request(app)
      .post("/orders")
      .send({ customerId: "cust-c", items: validBody.items });

    const res = await request(app).get(`/orders/${target.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(target.body.id);
    expect(res.body.customerId).toBe("cust-b");
  });

  // -------------------------------------------------------------------------
  // Not found — 404
  // -------------------------------------------------------------------------

  it("returns 404 for a non-existent order id", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/orders/non-existent-id");

    expect(res.status).toBe(404);
  });

  it("returns an error body for a 404", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/orders/non-existent-id");

    expect(res.body).toHaveProperty("error");
  });

  // -------------------------------------------------------------------------
  // Cache behaviour (observable through side-effects)
  // -------------------------------------------------------------------------

  it("GET after POST hits cache (cache is populated by POST)", async () => {
    const { app, cache } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);

    // The cache should already contain the order (set by CreateOrderUseCase)
    expect(cache.store.get(created.body.id)).toBeDefined();

    const res = await request(app).get(`/orders/${created.body.id}`);
    expect(res.status).toBe(200);
  });

  it("GET still works after cache is manually cleared (falls back to DB)", async () => {
    const { app, cache } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);

    // Evict from cache to force DB path
    cache.store.delete(created.body.id);

    const res = await request(app).get(`/orders/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it("GET re-populates cache on cache miss", async () => {
    const { app, cache } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);

    cache.store.delete(created.body.id);
    await request(app).get(`/orders/${created.body.id}`);

    expect(cache.store.get(created.body.id)).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Status after cancellation
  // -------------------------------------------------------------------------

  it("returns cancelled status after the order has been cancelled", async () => {
    const { app } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);
    await request(app).put(`/orders/${created.body.id}/cancel`);

    const res = await request(app).get(`/orders/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
  });
});
