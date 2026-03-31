// src/application/use-cases/_test/doubles.ts
//
// Shared in-memory test doubles. Each class extends the abstract port so that
// TypeScript verifies the full interface contract at compile time — no vi.fn()
// stubs that can silently fall out of sync with the real port.

import { IOrderRepositoryWritePort } from "../../ports/outbound/database/database-write.js";
import {
  IOrderRepositoryReadPort,
  FindByIdProjection,
} from "../../ports/outbound/database/database-read.js";
import { IOrderCachePort } from "../../ports/outbound/cache/cache.js";
import { IOrderEventBusPort } from "../../ports/outbound/messaging/messaging.js";
import { IOrderTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";
import type { OrderDTO } from "../../../domain/order.js";

// ---------------------------------------------------------------------------
// Write repository — stores DTOs in memory
// ---------------------------------------------------------------------------

export class FakeWriteRepo extends IOrderRepositoryWritePort {
  store: OrderDTO[] = [];

  async findById(id: string): Promise<FindByIdProjection | null> {
    return this.store.find((o) => o.id === id) ?? null;
  }

  async save(dto: OrderDTO): Promise<void> {
    this.store.push(dto);
  }

  async updateOne(dto: OrderDTO): Promise<void> {
    const i = this.store.findIndex((o) => o.id === dto.id);
    if (i >= 0) this.store[i] = dto;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((o) => o.id !== id);
  }
}

// ---------------------------------------------------------------------------
// Read repository — shares the same in-memory array as FakeWriteRepo when
// you pass the same `store` reference, enabling create-then-get patterns.
// ---------------------------------------------------------------------------

export class FakeReadRepo extends IOrderRepositoryReadPort {
  // Callers can inject the write repo's store to simulate CQRS propagation.
  constructor(private readonly sharedStore: OrderDTO[] = []) {
    super();
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    return this.sharedStore.find((o) => o.id === id) ?? null;
  }
}

// ---------------------------------------------------------------------------
// Cache — simple Map-backed store
// ---------------------------------------------------------------------------

export class FakeCache extends IOrderCachePort {
  store = new Map<string, OrderDTO>();

  async get(id: string): Promise<OrderDTO | null> {
    return this.store.get(id) ?? null;
  }

  async set(dto: OrderDTO): Promise<void> {
    this.store.set(dto.id, dto);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

// ---------------------------------------------------------------------------
// Event bus — records every publish call for assertion
// ---------------------------------------------------------------------------

export class FakeEventBus extends IOrderEventBusPort {
  events: { topic: string; message: unknown }[] = [];

  async publish(topic: string, message: object): Promise<void> {
    this.events.push({ topic, message });
  }
}

// ---------------------------------------------------------------------------
// Telemetry — passthrough; span() just invokes the function directly
// ---------------------------------------------------------------------------

export class PassthroughTelemetry extends IOrderTelemetryPort {
  async span<T>(_name: string, fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
