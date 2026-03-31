// _test/e2e/cancel-order.e2e.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp } from "./setup.js";

const validBody = {
  customerId: "cust-1",
  items: [{ productId: "prod-1", quantity: 1, unitPrice: 25 }],
};

/** Helper: create an order and return its id. */
async function createOrder(app: Express): Promise<string> {
  const res = await request(app).post("/orders").send(validBody);
  return res.body.id as string;
}

// Node type import — supertest accepts Express-compatible app
type Express = Parameters<typeof request>[0];

describe("PUT /orders/:id/cancel", () => {
  // -------------------------------------------------------------------------
  // Happy path — 200
  // -------------------------------------------------------------------------

  it("returns 200 for a successful cancellation", async () => {
    const { app } = buildTestApp();
    const id = await createOrder(app);
    const res = await request(app).put(`/orders/${id}/cancel`);

    expect(res.status).toBe(200);
  });

  it("response body status is cancelled", async () => {
    const { app } = buildTestApp();
    const id = await createOrder(app);
    const res = await request(app).put(`/orders/${id}/cancel`);

    expect(res.body.status).toBe("cancelled");
  });

  it("response body id matches the cancelled order", async () => {
    const { app } = buildTestApp();
    const id = await createOrder(app);
    const res = await request(app).put(`/orders/${id}/cancel`);

    expect(res.body.id).toBe(id);
  });

  it("response body customerId is preserved", async () => {
    const { app } = buildTestApp();
    const id = await createOrder(app);
    const res = await request(app).put(`/orders/${id}/cancel`);

    expect(res.body.customerId).toBe("cust-1");
  });

  it("response Content-Type is application/json", async () => {
    const { app } = buildTestApp();
    const id = await createOrder(app);
    const res = await request(app).put(`/orders/${id}/cancel`);

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  // -------------------------------------------------------------------------
  // Persistence — GET after cancel reflects the new status
  // -------------------------------------------------------------------------

  it("GET /orders/:id returns cancelled status after cancellation", async () => {
    const { app } = buildTestApp();
    const id = await createOrder(app);
    await request(app).put(`/orders/${id}/cancel`);

    const fetched = await request(app).get(`/orders/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.status).toBe("cancelled");
  });

  it("write repo reflects cancelled status after cancellation", async () => {
    const { app, writeRepo } = buildTestApp();
    const id = await createOrder(app);
    await request(app).put(`/orders/${id}/cancel`);

    const stored = writeRepo.store.find((o) => o.id === id);
    expect(stored?.status).toBe("cancelled");
  });

  it("cache reflects cancelled status after cancellation", async () => {
    const { app, cache } = buildTestApp();
    const id = await createOrder(app);
    await request(app).put(`/orders/${id}/cancel`);

    expect(cache.store.get(id)?.status).toBe("cancelled");
  });

  // -------------------------------------------------------------------------
  // Event publishing
  // -------------------------------------------------------------------------

  it("publishes an order.cancelled event", async () => {
    const { app, eventBus } = buildTestApp();
    const id = await createOrder(app);

    // Reset events collected from create so we only check cancel's events
    eventBus.events.length = 0;

    await request(app).put(`/orders/${id}/cancel`);

    expect(eventBus.events).toHaveLength(1);
    expect(eventBus.events[0].topic).toBe("order.cancelled");
  });

  it("order.cancelled event payload contains the correct orderId", async () => {
    const { app, eventBus } = buildTestApp();
    const id = await createOrder(app);

    eventBus.events.length = 0;
    await request(app).put(`/orders/${id}/cancel`);

    expect(eventBus.events[0].message).toMatchObject({
      type: "order.cancelled",
      payload: { orderId: id },
    });
  });

  // -------------------------------------------------------------------------
  // Not found — 404
  // -------------------------------------------------------------------------

  it("returns 404 when the order does not exist", async () => {
    const { app } = buildTestApp();
    const res = await request(app).put("/orders/non-existent-id/cancel");

    expect(res.status).toBe(404);
  });

  it("returns an error body for a 404", async () => {
    const { app } = buildTestApp();
    const res = await request(app).put("/orders/non-existent-id/cancel");

    expect(res.body).toHaveProperty("error");
  });

  // -------------------------------------------------------------------------
  // Already cancelled — 409
  // -------------------------------------------------------------------------

  it("returns 409 when cancelling an already-cancelled order", async () => {
    const { app } = buildTestApp();
    const id = await createOrder(app);

    await request(app).put(`/orders/${id}/cancel`); // first cancel — succeeds
    const second = await request(app).put(`/orders/${id}/cancel`); // should be rejected

    expect(second.status).toBe(409);
  });

  it("returns an error body for a double-cancel 409", async () => {
    const { app } = buildTestApp();
    const id = await createOrder(app);

    await request(app).put(`/orders/${id}/cancel`);
    const res = await request(app).put(`/orders/${id}/cancel`);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/already cancelled/i);
  });

  it("does not publish a second event on a rejected double-cancel", async () => {
    const { app, eventBus } = buildTestApp();
    const id = await createOrder(app);

    eventBus.events.length = 0;
    await request(app).put(`/orders/${id}/cancel`); // success → 1 event
    await request(app).put(`/orders/${id}/cancel`); // fail → no additional event

    const cancelledEvents = eventBus.events.filter(
      (e) => e.topic === "order.cancelled",
    );
    expect(cancelledEvents).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Cache-miss path (evict cache before cancel)
  // -------------------------------------------------------------------------

  it("cancels correctly when the cache has been cleared (DB fallback)", async () => {
    const { app, cache } = buildTestApp();
    const id = await createOrder(app);

    // Evict cache to force DB fallback path
    cache.store.delete(id);

    const res = await request(app).put(`/orders/${id}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
  });
});
