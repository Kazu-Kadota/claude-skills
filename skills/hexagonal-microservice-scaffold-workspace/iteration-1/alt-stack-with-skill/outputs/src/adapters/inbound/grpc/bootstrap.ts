// src/adapters/inbound/grpc/bootstrap.ts
// Composition root — wires all infrastructure, adapters, use cases, and starts the gRPC server.
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "../../../infrastructure/config.js";
import { DynamoDBConnection } from "../../../infrastructure/database/dynamodb/connection.js";
import { SQSConnection } from "../../../infrastructure/messaging/sqs/connection.js";
import { DynamoDBShipmentRepository } from "../../outbound/database/dynamodb/shipment-repository.js";
import { MemoryShipmentCache } from "../../outbound/cache/memory/shipment-cache.js";
import { SQSEventBus } from "../../outbound/messaging/sqs/event-bus.js";
import { OTelTelemetry } from "../../outbound/telemetry/otel/otel-telemetry.js";
import { CreateShipmentUseCase } from "../../../application/use-cases/create-shipment.js";
import { GetShipmentUseCase } from "../../../application/use-cases/get-shipment.js";
import { MarkInTransitUseCase } from "../../../application/use-cases/mark-in-transit.js";
import { MarkDeliveredUseCase } from "../../../application/use-cases/mark-delivered.js";
import { MarkFailedUseCase } from "../../../application/use-cases/mark-failed.js";
import { ShipmentGrpcHandler } from "./shipment-handler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function bootstrapGrpc(): Promise<void> {
  // ── Infrastructure ────────────────────────────────────────────────────────
  const dynamoConnection = new DynamoDBConnection(
    config.database.dynamodb.region,
    config.database.dynamodb.endpoint,
  );
  await dynamoConnection.connect();

  const sqsConnection = new SQSConnection(
    config.messaging.sqs.region,
    config.messaging.sqs.endpoint,
  );
  sqsConnection.connect();

  // ── Adapters ─────────────────────────────────────────────────────────────
  const repository = new DynamoDBShipmentRepository(
    dynamoConnection.getClient(),
    config.database.dynamodb.tableName,
  );

  const cache = new MemoryShipmentCache(config.cache.ttlSeconds);
  const eventBus = new SQSEventBus(sqsConnection.getClient(), config.messaging.sqs.queueUrl);
  const telemetry = new OTelTelemetry();

  // ── Use cases ─────────────────────────────────────────────────────────────
  const createShipmentUseCase = new CreateShipmentUseCase(repository, cache, eventBus, telemetry);
  const getShipmentUseCase = new GetShipmentUseCase(repository, cache, telemetry);
  const markInTransitUseCase = new MarkInTransitUseCase(repository, cache, eventBus, telemetry);
  const markDeliveredUseCase = new MarkDeliveredUseCase(repository, cache, eventBus, telemetry);
  const markFailedUseCase = new MarkFailedUseCase(repository, cache, eventBus, telemetry);

  // ── Handler (inbound adapter) ──────────────────────────────────────────────
  const handler = new ShipmentGrpcHandler(
    createShipmentUseCase,
    getShipmentUseCase,
    markInTransitUseCase,
    markDeliveredUseCase,
    markFailedUseCase,
  );

  // ── gRPC Server ───────────────────────────────────────────────────────────
  const protoPath = path.join(__dirname, "shipment.proto");
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDefinition) as Record<string, unknown>;
  const shipmentsProto = proto["shipments"] as Record<string, { service: unknown }>;

  const server = new grpc.Server();
  server.addService(
    shipmentsProto["ShipmentService"].service as grpc.ServiceDefinition,
    handler.buildServiceImpl() as grpc.UntypedServiceImplementation,
  );

  const address = `0.0.0.0:${config.app.port}`;

  await new Promise<void>((resolve, reject) => {
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
      if (error) return reject(error);
      console.log(`${config.app.name} gRPC service listening on :${port}`);
      resolve();
    });
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    await new Promise<void>((resolve) => server.tryShutdown(() => resolve()));

    const results = await Promise.allSettled([
      dynamoConnection.close(),
      sqsConnection.close(),
    ]);

    for (const result of results) {
      if (result.status === "rejected") console.error("Shutdown error:", result.reason);
    }

    console.log("Graceful shutdown completed.");
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
