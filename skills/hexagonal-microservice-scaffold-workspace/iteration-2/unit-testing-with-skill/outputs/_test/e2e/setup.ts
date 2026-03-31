// _test/e2e/setup.ts
//
// Builds a fully-wired Express application backed entirely by in-memory
// adapters. No real databases, no Kafka, no Redis — fast, hermetic E2E tests.
//
// The same FakeWriteRepo / FakeReadRepo share an in-memory store reference so
// that orders created through the write path are immediately visible via reads
// (simulating synchronous CQRS propagation, which is accurate enough for
// controller-level E2E tests).

import express, { type Express } from "express";
import { CreateOrderUseCase } from "../../src/application/use-cases/create-order.js";
import { GetOrderUseCase } from "../../src/application/use-cases/get-order.js";
import { CancelOrderUseCase } from "../../src/application/use-cases/cancel-order.js";
import { OrderController } from "../../src/adapters/inbound/http/express/order-controller.js";
import {
  FakeWriteRepo,
  FakeReadRepo,
  FakeCache,
  FakeEventBus,
  PassthroughTelemetry,
} from "../../src/application/use-cases/_test/doubles.js";

export type TestApp = {
  app: Express;
  writeRepo: FakeWriteRepo;
  readRepo: FakeReadRepo;
  cache: FakeCache;
  eventBus: FakeEventBus;
};

/**
 * Call this inside each test (or beforeEach) to get an isolated app instance.
 * Each call creates fresh in-memory stores — tests do not share state.
 */
export function buildTestApp(): TestApp {
  const writeRepo = new FakeWriteRepo();
  // Share writeRepo's backing array so reads see the same records
  const readRepo = new FakeReadRepo(writeRepo.store);
  const cache = new FakeCache();
  const eventBus = new FakeEventBus();
  const telemetry = new PassthroughTelemetry();

  const createOrder = new CreateOrderUseCase(writeRepo, cache, eventBus, telemetry);
  const getOrder = new GetOrderUseCase(readRepo, cache, telemetry);
  const cancelOrder = new CancelOrderUseCase(
    readRepo,
    writeRepo,
    cache,
    eventBus,
    telemetry,
  );

  const controller = new OrderController(createOrder, getOrder, cancelOrder);

  const app: Express = express();
  app.use(express.json());
  app.use("/orders", controller.buildRouter());

  return { app, writeRepo, readRepo, cache, eventBus };
}
