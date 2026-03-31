// _test/e2e/create-order.e2e.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp } from "./setup.js";

const validBody = {
  customerId: "cust-1",
  items: [{ productId: "prod-1", quantity: 2, unitPrice: 50 }],
};

describe("POST /orders", () => {
  // -------------------------------------------------------------------------
  // Happy path — 201
  // -------------------------------------------------------------------------

  it("returns 201 with the created order DTO", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/orders").send(validBody);

    expect(res.status).toBe(201);
  });

  it("response body contains a UUID id", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/orders").send(validBody);

    expect(res.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("response body has status pending", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/orders").send(validBody);

    expect(res.body.status).toBe("pending");
  });

  it("response body reflects the submitted customerId", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/orders").send(validBody);

    expect(res.body.customerId).toBe("cust-1");
  });

  it("response body reflects the submitted items", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/orders").send(validBody);

    expect(res.body.items).toEqual(validBody.items);
  });

  it("response body includes createdAt and updatedAt timestamps", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/orders").send(validBody);

    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it("response Content-Type is application/json", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/orders").send(validBody);

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  // -------------------------------------------------------------------------
  // Validation errors — 400
  // -------------------------------------------------------------------------

  it("returns 400 when customerId is missing", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/orders")
      .send({ items: validBody.items });

    expect(res.status).toBe(400);
  });

  it("returns 400 when customerId is empty string", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/orders")
      .send({ ...validBody, customerId: "" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when items array is empty", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/orders")
      .send({ ...validBody, items: [] });

    expect(res.status).toBe(400);
  });

  it("returns 400 when items is missing entirely", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/orders")
      .send({ customerId: "cust-1" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when an item has quantity 0", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/orders")
      .send({
        customerId: "cust-1",
        items: [{ productId: "p1", quantity: 0, unitPrice: 10 }],
      });

    expect(res.status).toBe(400);
  });

  it("returns 400 when an item has no productId", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/orders")
      .send({
        customerId: "cust-1",
        items: [{ productId: "", quantity: 1, unitPrice: 10 }],
      });

    expect(res.status).toBe(400);
  });

  // -------------------------------------------------------------------------
  // Side-effects
  // -------------------------------------------------------------------------

  it("persists the order so GET /orders/:id returns it", async () => {
    const { app } = buildTestApp();
    const created = await request(app).post("/orders").send(validBody);
    const fetched = await request(app).get(`/orders/${created.body.id}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(created.body.id);
  });

  it("publishes an order.created event", async () => {
    const { app, eventBus } = buildTestApp();
    await request(app).post("/orders").send(validBody);

    expect(eventBus.events).toHaveLength(1);
    expect(eventBus.events[0].topic).toBe("order.created");
  });

  it("populates the cache after creation", async () => {
    const { app, cache } = buildTestApp();
    const res = await request(app).post("/orders").send(validBody);

    expect(cache.store.get(res.body.id)).toBeDefined();
  });

  it("two consecutive POSTs create two distinct orders", async () => {
    const { app } = buildTestApp();
    const first = await request(app).post("/orders").send(validBody);
    const second = await request(app).post("/orders").send(validBody);

    expect(first.body.id).not.toBe(second.body.id);
  });
});
