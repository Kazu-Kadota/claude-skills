// src/domain/_test/order.test.ts
import { describe, it, expect } from "vitest";
import { Order, OrderStatus } from "../order.js";

const validItem = { productId: "prod-1", quantity: 2, unitPrice: 50 };

const validCreateInput = {
  customerId: "cust-1",
  items: [validItem],
};

// ---------------------------------------------------------------------------
// Order.create()
// ---------------------------------------------------------------------------

describe("Order.create()", () => {
  it("creates an order with pending status and a generated UUID", () => {
    const dto = Order.create(validCreateInput).toDTO();
    expect(dto.status).toBe(OrderStatus.pending);
    expect(dto.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("stores the customerId provided", () => {
    const dto = Order.create(validCreateInput).toDTO();
    expect(dto.customerId).toBe("cust-1");
  });

  it("stores the items provided", () => {
    const dto = Order.create(validCreateInput).toDTO();
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0]).toEqual(validItem);
  });

  it("sets createdAt and updatedAt as ISO strings", () => {
    const dto = Order.create(validCreateInput).toDTO();
    expect(typeof dto.createdAt).toBe("string");
    expect(typeof dto.updatedAt).toBe("string");
    expect(() => new Date(dto.createdAt as string)).not.toThrow();
    expect(() => new Date(dto.updatedAt as string)).not.toThrow();
  });

  it("throws when customerId is empty string", () => {
    expect(() => Order.create({ ...validCreateInput, customerId: "" })).toThrow(
      "customerId is required",
    );
  });

  it("throws when customerId is missing (undefined cast as empty)", () => {
    expect(() =>
      Order.create({ ...validCreateInput, customerId: undefined as unknown as string }),
    ).toThrow("customerId is required");
  });

  it("throws when items array is empty", () => {
    expect(() => Order.create({ ...validCreateInput, items: [] })).toThrow(
      "Order must have at least one item",
    );
  });

  it("throws when an item has no productId", () => {
    expect(() =>
      Order.create({
        ...validCreateInput,
        items: [{ productId: "", quantity: 1, unitPrice: 10 }],
      }),
    ).toThrow("Each item must have a productId");
  });

  it("throws when an item has quantity <= 0", () => {
    expect(() =>
      Order.create({
        ...validCreateInput,
        items: [{ productId: "p1", quantity: 0, unitPrice: 10 }],
      }),
    ).toThrow("Item quantity must be greater than zero");
  });

  it("throws when an item has negative unitPrice", () => {
    expect(() =>
      Order.create({
        ...validCreateInput,
        items: [{ productId: "p1", quantity: 1, unitPrice: -1 }],
      }),
    ).toThrow("Item unitPrice must be non-negative");
  });

  it("generates a unique id each time", () => {
    const dto1 = Order.create(validCreateInput).toDTO();
    const dto2 = Order.create(validCreateInput).toDTO();
    expect(dto1.id).not.toBe(dto2.id);
  });

  it("supports multiple items", () => {
    const dto = Order.create({
      customerId: "cust-1",
      items: [
        { productId: "p1", quantity: 1, unitPrice: 10 },
        { productId: "p2", quantity: 3, unitPrice: 25 },
      ],
    }).toDTO();
    expect(dto.items).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Order.cancel()
// ---------------------------------------------------------------------------

describe("Order.cancel()", () => {
  it("transitions status from pending to cancelled", () => {
    const order = Order.reconstitute({
      id: "ord-1",
      customerId: "cust-1",
      items: [validItem],
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    order.cancel();
    expect(order.toDTO().status).toBe(OrderStatus.cancelled);
  });

  it("updates updatedAt after cancellation", () => {
    const originalUpdatedAt = new Date(Date.now() - 5000).toISOString();
    const order = Order.reconstitute({
      id: "ord-1",
      customerId: "cust-1",
      items: [validItem],
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: originalUpdatedAt,
    });
    order.cancel();
    expect(order.toDTO().updatedAt).not.toBe(originalUpdatedAt);
  });

  it("does not change createdAt after cancellation", () => {
    const createdAt = new Date(Date.now() - 10000).toISOString();
    const order = Order.reconstitute({
      id: "ord-1",
      customerId: "cust-1",
      items: [validItem],
      status: "pending",
      createdAt,
      updatedAt: new Date().toISOString(),
    });
    order.cancel();
    expect(order.toDTO().createdAt).toBe(createdAt);
  });

  it("throws when the order is already cancelled", () => {
    const order = Order.reconstitute({
      id: "ord-1",
      customerId: "cust-1",
      items: [validItem],
      status: "cancelled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(() => order.cancel()).toThrow("Order is already cancelled");
  });

  it("cannot be cancelled twice in a row", () => {
    const order = Order.reconstitute({
      id: "ord-1",
      customerId: "cust-1",
      items: [validItem],
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    order.cancel();
    expect(() => order.cancel()).toThrow("Order is already cancelled");
  });
});

// ---------------------------------------------------------------------------
// Order.reconstitute() → toDTO() round-trip
// ---------------------------------------------------------------------------

describe("Order.reconstitute() → toDTO()", () => {
  it("round-trips all fields without mutation", () => {
    const raw = {
      id: "ord-123",
      customerId: "cust-42",
      items: [{ productId: "p9", quantity: 5, unitPrice: 100 }],
      status: "pending" as const,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    };
    const dto = Order.reconstitute(raw).toDTO();
    expect(dto.id).toBe(raw.id);
    expect(dto.customerId).toBe(raw.customerId);
    expect(dto.items).toEqual(raw.items);
    expect(dto.status).toBe(raw.status);
    expect(dto.createdAt).toBe(raw.createdAt);
    expect(dto.updatedAt).toBe(raw.updatedAt);
  });

  it("reconstitutes a cancelled order without error", () => {
    const raw = {
      id: "ord-456",
      customerId: "cust-7",
      items: [validItem],
      status: "cancelled" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const dto = Order.reconstitute(raw).toDTO();
    expect(dto.status).toBe("cancelled");
  });

  it("preserves items array exactly", () => {
    const items = [
      { productId: "p1", quantity: 2, unitPrice: 20 },
      { productId: "p2", quantity: 1, unitPrice: 99 },
    ];
    const dto = Order.reconstitute({
      id: "ord-1",
      customerId: "cust-1",
      items,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).toDTO();
    expect(dto.items).toEqual(items);
  });
});
