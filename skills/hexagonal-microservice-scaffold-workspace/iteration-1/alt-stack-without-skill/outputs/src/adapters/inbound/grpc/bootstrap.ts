// src/adapters/inbound/grpc/bootstrap.ts
// Composition root: the only place where concrete adapters are instantiated.
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { config } from "../../../infrastructure/config.js";
import { DynamoDBConnection } from "../../../infrastructure/database/dynamodb/connection.js";
import { SQSConnection } from "../../../infrastructure/messaging/sqs/connection.js";
import { TelemetryConnection } from "../../../infrastructure/telemetry/otel/connection.js";
import { DynamoDBShipmentRepository } from "../../outbound/database/dynamodb/shipment-repository.js";
import { InMemoryShipmentCache } from "../../outbound/cache/memory/shipment-cache.js";
import { SQSEventBus } from "../../outbound/messaging/sqs/event-bus.js";
import { OTelTelemetry } from "../../outbound/telemetry/otel/otel-telemetry.js";
import { CreateShipmentUseCase } from "../../../application/use-cases/create-shipment.js";
import { GetShipmentUseCase } from "../../../application/use-cases/get-shipment.js";
import { MarkInTransitShipmentUseCase } from "../../../application/use-cases/mark-in-transit-shipment.js";
import { MarkDeliveredShipmentUseCase } from "../../../application/use-cases/mark-delivered-shipment.js";
import { MarkFailedShipmentUseCase } from "../../../application/use-cases/mark-failed-shipment.js";
import { ShipmentController } from "./shipment-controller.js";
import { ShipmentDTO } from "../../../domain/shipment.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function bootstrapGRPC() {
  // Start OpenTelemetry tracing before anything else
  const telemetryConnection = new TelemetryConnection(
    config.app.name,
    config.telemetry.otel.endpoint,
  );
  telemetryConnection.start();

  // DynamoDB connection
  const dynamoDbConnection = new DynamoDBConnection(
    config.database.dynamodb.region,
    config.database.dynamodb.endpoint,
  );
  const docClient = dynamoDbConnection.getClient();

  // SQS connection
  const sqsConnection = new SQSConnection(
    config.messaging.sqs.region,
    config.messaging.sqs.endpoint,
  );
  const sqsClient = sqsConnection.getClient();

  // In-memory cache store (simple Map)
  const cacheStore = new Map<string, ShipmentDTO>();

  // Wire outbound adapters
  const repository = new DynamoDBShipmentRepository(docClient, config.database.dynamodb.tableName);
  const cache = new InMemoryShipmentCache(cacheStore);
  const eventBus = new SQSEventBus(sqsClient, config.messaging.sqs.queueUrl);
  const telemetry = new OTelTelemetry();

  // Wire use cases
  const createShipmentUseCase = new CreateShipmentUseCase(repository, cache, eventBus, telemetry);
  const getShipmentUseCase = new GetShipmentUseCase(repository, cache, telemetry);
  const markInTransitUseCase = new MarkInTransitShipmentUseCase(repository, cache, eventBus, telemetry);
  const markDeliveredUseCase = new MarkDeliveredShipmentUseCase(repository, cache, eventBus, telemetry);
  const markFailedUseCase = new MarkFailedShipmentUseCase(repository, cache, eventBus, telemetry);

  // Wire inbound adapter (controller)
  const controller = new ShipmentController(
    createShipmentUseCase,
    getShipmentUseCase,
    markInTransitUseCase,
    markDeliveredUseCase,
    markFailedUseCase,
  );

  // Load protobuf definition
  const protoPath = path.resolve(__dirname, "proto", "shipment.proto");
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDefinition) as any;

  // Start gRPC server
  const server = new grpc.Server();
  server.addService(proto.shipments.ShipmentService.service, controller.buildServiceImpl());

  const address = `0.0.0.0:${config.app.port}`;
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error("Failed to bind gRPC server:", err);
      process.exit(1);
    }
    console.log(`${config.app.name} gRPC service listening on :${port}`);
  });

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    server.tryShutdown(async (err) => {
      if (err) console.error("Error while shutting down gRPC server:", err);

      const results = await Promise.allSettled([
        dynamoDbConnection.close(),
        sqsConnection.close(),
      ]);

      for (const result of results) {
        if (result.status === "rejected") console.error("Shutdown error:", result.reason);
      }

      console.log("Graceful shutdown completed.");
      process.exit(err ? 1 : 0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
