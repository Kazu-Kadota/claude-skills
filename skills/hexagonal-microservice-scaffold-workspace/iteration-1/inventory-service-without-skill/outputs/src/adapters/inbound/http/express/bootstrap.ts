// src/adapters/inbound/http/express/bootstrap.ts

import express from "express";
import { config } from "../../../../infrastructure/config.js";
import { ProductDTO } from "../../../../domain/product.js";
import { MongoConnection } from "../../../../infrastructure/database/mongodb/connection.js";
import { PostgresConnection } from "../../../../infrastructure/database/postgres/connection.js";
import { RedisConnection } from "../../../../infrastructure/cache/redis/connection.js";
import { KafkaConnection } from "../../../../infrastructure/messaging/kafka/connection.js";
import { MongoProductRepositoryRead } from "../../../outbound/database/mongodb/read.js";
import { MongoProductRepositoryWrite } from "../../../outbound/database/mongodb/write.js";
import { PostgresProductRepositoryRead } from "../../../outbound/database/postgres/read.js";
import { PostgresProductRepositoryWrite } from "../../../outbound/database/postgres/write.js";
import { RedisProductCache } from "../../../outbound/cache/redis/product-cache.js";
import { KafkaEventBus } from "../../../outbound/messaging/kafka/event-bus.js";
import { OTelTelemetry } from "../../../outbound/telemetry/otel/otel-telemetry.js";
import { CreateProductUseCase } from "../../../../application/use-cases/create-product.js";
import { GetProductUseCase } from "../../../../application/use-cases/get-product.js";
import { DeactivateProductUseCase } from "../../../../application/use-cases/deactivate-product.js";
import { DeleteProductUseCase } from "../../../../application/use-cases/delete-product.js";
import { ProductController } from "./product-controller.js";

export async function bootstrapExpress() {
  const postgresWriteUrl = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/inventory`;
  const postgresReadUrl = `postgresql://${config.database.read.user}:${config.database.read.password}@${config.database.read.host}:${config.database.read.port}/inventory`;

  const postgresWriteConnection = new PostgresConnection(postgresWriteUrl);
  const postgresReadConnection = new PostgresConnection(postgresReadUrl);
  const mongoWriteConnection = new MongoConnection(config.database.write.uri, "inventory");
  const mongoReadConnection = new MongoConnection(config.database.read.uri, "inventory");

  if (config.database.write.provider === "postgres") await postgresWriteConnection.connect();
  else await mongoWriteConnection.connect();

  if (config.database.read.provider === "postgres") await postgresReadConnection.connect();
  else await mongoReadConnection.connect();

  const redisConnection = new RedisConnection(config.cache.redis.url);
  const redis = redisConnection.connect();

  const kafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-inventory`,
    config.messaging.kafka.brokers,
  );
  await kafkaConnection.connect();
  const producer = await kafkaConnection.producer();

  const writeRepository =
    config.database.write.provider === "postgres"
      ? new PostgresProductRepositoryWrite(postgresWriteConnection.getClient())
      : new MongoProductRepositoryWrite(mongoWriteConnection.getClient().collection<ProductDTO>("inventory"));

  const readRepository =
    config.database.read.provider === "postgres"
      ? new PostgresProductRepositoryRead(postgresReadConnection.getClient())
      : new MongoProductRepositoryRead(mongoReadConnection.getClient().collection<ProductDTO>("inventory"));

  const cache = new RedisProductCache(redis);
  const eventBus = new KafkaEventBus(producer);
  const telemetry = new OTelTelemetry();

  const createProductUseCase = new CreateProductUseCase(writeRepository, cache, eventBus, telemetry);
  const getProductUseCase = new GetProductUseCase(readRepository, cache, telemetry);
  const deactivateProductUseCase = new DeactivateProductUseCase(readRepository, writeRepository, cache, eventBus, telemetry);
  const deleteProductUseCase = new DeleteProductUseCase(writeRepository, cache, eventBus, telemetry);

  const controller = new ProductController(
    createProductUseCase,
    getProductUseCase,
    deactivateProductUseCase,
    deleteProductUseCase,
  );

  const app = express();
  app.use(express.json());
  app.use(controller.buildRouter());

  const server = app.listen(config.app.port, () => {
    console.log(`${config.app.name} service on :${config.app.port}`);
  });

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async (serverError) => {
      if (serverError) console.error("Error while closing HTTP server:", serverError);

      const results = await Promise.allSettled([
        postgresWriteConnection.close(),
        postgresReadConnection.close(),
        mongoWriteConnection.close(),
        mongoReadConnection.close(),
        redisConnection.close(),
        kafkaConnection.close(),
      ]);

      for (const result of results) {
        if (result.status === "rejected") console.error("Shutdown error:", result.reason);
      }

      console.log("Graceful shutdown completed.");
      process.exit(serverError ? 1 : 0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
