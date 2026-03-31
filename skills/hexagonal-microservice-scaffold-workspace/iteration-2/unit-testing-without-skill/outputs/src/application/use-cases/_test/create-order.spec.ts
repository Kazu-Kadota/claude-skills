// src/application/use-cases/_test/create-order.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateOrderUseCase } from "../create-order.js";
import { IOrderRepositoryWritePort } from "../../ports/outbound/database/database-write.js";
import { IOrderCachePort } from "../../ports/outbound/cache/cache.js";
import { IOrderEventBusPort } from "../../ports/outbound/messaging/messaging.js";
import { IOrderTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";
import { OrderDTO } from "../../../domain/order.js";

// ---------------------------------------------------------------------------
// Stub factories
// ---------------------------------------------------------------------------

function makeWriteRepo(): IOrderRepositoryWritePort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    updateOne: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
  } as unknown as IOrderRepositoryWritePort;
}

function makeCache(): IOrderCachePort {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as IOrderCachePort;
}

function makeEventBus(): IOrderEventBusPort {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
  } as unknown as IOrderEventBusPort;
}

/** Pass-through telemetry — just executes the callback */
function makeTelemetry(): IOrderTelemetryPort {
  return {
    span: vi.fn().mockImplementation((_name: string, fn: () => Promise<unknown>) => fn()),
  } as unknown as IOrderTelemetryPort;
}

const validInput = {
  customerId: "cust-001",
  items: [{ productId: "prod-1", quantity: 2, unitPrice: 19.99 }],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CreateOrderUseCase", () => {
  let writeRepo: ReturnType<typeof makeWriteRepo>;
  let cache: ReturnType<typeof makeCache>;
  let eventBus: ReturnType<typeof makeEventBus>;
  let telemetry: ReturnType<typeof makeTelemetry>;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    writeRepo = makeWriteRepo();
    cache = makeCache();
    eventBus = makeEventBus();
    telemetry = makeTelemetry();
    useCase = new CreateOrderUseCase(writeRepo, cache, eventBus, telemetry);
  });

  it("returns an OrderDTO with a generated id and pending status", async () => {
    const result = await useCase.execute(validInput);

    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.status).toBe("pending");
    expect(result.customerId).toBe(validInput.customerId);
    expect(result.items).toEqual(validInput.items);
  });

  it("calls writeRepository.save once with the created DTO", async () => {
    const result = await useCase.execute(validInput);
    expect(writeRepo.save).toHaveBeenCalledOnce();
    expect(writeRepo.save).toHaveBeenCalledWith(result);
  });

  it("calls cache.set once with the created DTO", async () => {
    const result = await useCase.execute(validInput);
    expect(cache.set).toHaveBeenCalledOnce();
    expect(cache.set).toHaveBeenCalledWith(result);
  });

  it("publishes an order.created event via the event bus", async () => {
    const result = await useCase.execute(validInput);

    expect(eventBus.publish).toHaveBeenCalledOnce();
    const [topic, message] = (eventBus.publish as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { type: string; payload: { orderId: string; customerId: string } },
    ];
    expect(topic).toBe("order.created");
    expect(message.type).toBe("order.created");
    expect(message.payload.orderId).toBe(result.id);
    expect(message.payload.customerId).toBe(validInput.customerId);
  });

  it("wraps execution inside a telemetry span named 'orders.create'", async () => {
    await useCase.execute(validInput);
    expect(telemetry.span).toHaveBeenCalledWith("orders.create", expect.any(Function));
  });

  it("does NOT call readRepository or cache.get — create never reads first", async () => {
    await useCase.execute(validInput);
    expect(cache.get).not.toHaveBeenCalled();
    expect(writeRepo.findById).not.toHaveBeenCalled();
  });

  it("propagates domain validation errors (e.g. empty items)", async () => {
    await expect(
      useCase.execute({ customerId: "c1", items: [] }),
    ).rejects.toThrowError(/items/i);
  });

  it("propagates domain validation errors (e.g. empty customerId)", async () => {
    await expect(
      useCase.execute({ customerId: "", items: [{ productId: "p1", quantity: 1, unitPrice: 5 }] }),
    ).rejects.toThrowError(/customerId/i);
  });

  it("does not persist anything when domain validation fails", async () => {
    await expect(
      useCase.execute({ customerId: "", items: [] }),
    ).rejects.toThrow();

    expect(writeRepo.save).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
