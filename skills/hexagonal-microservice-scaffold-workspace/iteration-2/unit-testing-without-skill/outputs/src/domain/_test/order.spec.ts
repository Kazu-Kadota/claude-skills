// src/domain/_test/order.spec.ts
import { describe, it, expect } from "vitest";
import { Order, OrderStatus } from "../order.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validItem = { productId: "prod-1", quantity: 2, unitPrice: 49.99 };

function makeOrder() {
  return Order.create({ customerId: "cust-abc", items: [validItem] });
}

// ---------------------------------------------------------------------------
// Order.create — factory & invariants
// ---------------------------------------------------------------------------

describe("Order.create", () => {
  it("creates an order with a generated UUID id", () => {
    const order = makeOrder();
    expect(order.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("sets initial status to pending", () => {
    const order = makeOrder();
    expect(order.toDTO().status).toBe(OrderStatus.pending);
  });

  it("stores the customerId exactly as provided", () => {
    const order = makeOrder();
    expect(order.toDTO().customerId).toBe("cust-abc");
  });

  it("stores items as a deep copy of the input array", () => {
    const items = [
      { productId: "p1", quantity: 1, unitPrice: 10 },
      { productId: "p2", quantity: 3, unitPrice: 25.5 },
    ];
    const order = Order.create({ customerId: "c1", items });
    expect(order.toDTO().items).toEqual(items);
  });

  it("throws when customerId is empty string", () => {
    expect(() =>
      Order.create({ customerId: "", items: [validItem] }),
    ).toThrowError(/customerId/i);
  });

  it("throws when items array is empty", () => {
    expect(() =>
      Order.create({ customerId: "c1", items: [] }),
    ).toThrowError(/items/i);
  });

  it("throws when any item has quantity <= 0", () => {
    expect(() =>
      Order.create({
        customerId: "c1",
        items: [{ productId: "p1", quantity: 0, unitPrice: 10 }],
      }),
    ).toThrowError(/quantity/i);
  });

  it("throws when any item has a negative unitPrice", () => {
    expect(() =>
      Order.create({
        customerId: "c1",
        items: [{ productId: "p1", quantity: 1, unitPrice: -5 }],
      }),
    ).toThrowError(/unitPrice|price/i);
  });

  it("throws when any item is missing a productId", () => {
    expect(() =>
      Order.create({
        customerId: "c1",
        items: [{ productId: "", quantity: 1, unitPrice: 10 }],
      }),
    ).toThrowError(/productId/i);
  });

  it("sets createdAt and updatedAt as ISO date strings", () => {
    const before = new Date().toISOString();
    const order = makeOrder();
    const after = new Date().toISOString();
    const dto = order.toDTO();

    expect(dto.createdAt >= before).toBe(true);
    expect(dto.createdAt <= after).toBe(true);
    expect(dto.updatedAt >= before).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Order.reconstitute — no-validation rebuilding from raw data
// ---------------------------------------------------------------------------

describe("Order.reconstitute", () => {
  it("rebuilds an order from a raw DTO without running validation", () => {
    const raw = {
      id: "00000000-0000-0000-0000-000000000001",
      customerId: "cust-xyz",
      items: [{ productId: "p1", quantity: 1, unitPrice: 100 }],
      status: OrderStatus.cancelled,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    } as const;

    const order = Order.reconstitute(raw);
    expect(order.toDTO()).toEqual(raw);
  });

  it("preserves cancelled status from persistence", () => {
    const raw = {
      id: "00000000-0000-0000-0000-000000000002",
      customerId: "c2",
      items: [{ productId: "p2", quantity: 2, unitPrice: 9.99 }],
      status: OrderStatus.cancelled,
      createdAt: "2025-06-01T10:00:00.000Z",
      updatedAt: "2025-06-02T12:00:00.000Z",
    } as const;

    const order = Order.reconstitute(raw);
    expect(order.toDTO().status).toBe(OrderStatus.cancelled);
  });
});

// ---------------------------------------------------------------------------
// Order.cancel — state transition
// ---------------------------------------------------------------------------

describe("Order#cancel", () => {
  it("changes status from pending to cancelled", () => {
    const order = makeOrder();
    order.cancel();
    expect(order.toDTO().status).toBe(OrderStatus.cancelled);
  });

  it("updates updatedAt after cancellation", () => {
    const order = makeOrder();
    const before = order.toDTO().updatedAt;

    // Ensure at least 1 ms elapses so timestamps differ
    const laterDate = new Date(new Date(before).getTime() + 1).toISOString();

    order.cancel();
    const after = order.toDTO().updatedAt;
    expect(after >= laterDate || after > before).toBe(true);
  });

  it("throws when attempting to cancel an already-cancelled order", () => {
    const order = makeOrder();
    order.cancel();
    expect(() => order.cancel()).toThrowError(/already cancelled|cancel/i);
  });
});

// ---------------------------------------------------------------------------
// Order.toDTO — serialisation
// ---------------------------------------------------------------------------

describe("Order#toDTO", () => {
  it("returns a plain object that matches the domain shape", () => {
    const order = makeOrder();
    const dto = order.toDTO();

    expect(dto).toMatchObject({
      id: expect.any(String),
      customerId: "cust-abc",
      items: [validItem],
      status: OrderStatus.pending,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it("does not expose private internals (is a plain object)", () => {
    const order = makeOrder();
    const dto = order.toDTO();
    // plain object — no class methods
    expect(typeof (dto as unknown as Record<string, unknown>).cancel).toBe("undefined");
  });
});
