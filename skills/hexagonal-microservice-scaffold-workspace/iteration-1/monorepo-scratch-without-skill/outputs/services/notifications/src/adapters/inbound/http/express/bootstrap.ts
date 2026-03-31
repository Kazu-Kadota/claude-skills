import express from "express";
import { config } from "../../../../infrastructure/config.js";
import { NotificationDTO } from "../../../../domain/notification.js";
import { MongoConnection } from "../../../../infrastructure/database/mongodb/connection.js";
import { PostgresConnection } from "../../../../infrastructure/database/postgres/connection.js";
import { RedisConnection } from "../../../../infrastructure/cache/redis/connection.js";
import { KafkaConnection } from "../../../../infrastructure/messaging/kafka/connection.js";
import { MongoNotificationRepositoryRead } from "../../../outbound/database/mongodb/read.js";
import { MongoNotificationRepositoryWrite } from "../../../outbound/database/mongodb/write.js";
import { PostgresNotificationRepositoryRead } from "../../../outbound/database/postgres/read.js";
import { PostgresNotificationRepositoryWrite } from "../../../outbound/database/postgres/write.js";
import { RedisNotificationCache } from "../../../outbound/cache/redis/notification-cache.js";
import { KafkaEventBus } from "../../../outbound/messaging/kafka/event-bus.js";
import { OTelTelemetry } from "../../../outbound/telemetry/otel/otel-telemetry.js";
import { CreateNotificationUseCase } from "../../../../application/use-cases/create-notification.js";
import { GetNotificationUseCase } from "../../../../application/use-cases/get-notification.js";
import { DeleteNotificationUseCase } from "../../../../application/use-cases/delete-notification.js";
import { NotificationController } from "./notification-controller.js";

export async function bootstrapExpress() {
  const postgresWriteUrl = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/notifications`;
  const postgresReadUrl = `postgresql://${config.database.read.user}:${config.database.read.password}@${config.database.read.host}:${config.database.read.port}/notifications`;

  const postgresWriteConnection = new PostgresConnection(postgresWriteUrl);
  const postgresReadConnection = new PostgresConnection(postgresReadUrl);
  const mongoWriteConnection = new MongoConnection(config.database.write.uri, "notifications");
  const mongoReadConnection = new MongoConnection(config.database.read.uri, "notifications");

  if (config.database.write.provider === "postgres") await postgresWriteConnection.connect();
  else await mongoWriteConnection.connect();

  if (config.database.read.provider === "postgres") await postgresReadConnection.connect();
  else await mongoReadConnection.connect();

  const redisConnection = new RedisConnection(config.cache.redis.url);
  const redis = redisConnection.connect();

  const kafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-notifications`,
    config.messaging.kafka.brokers,
  );
  await kafkaConnection.connect();
  const producer = await kafkaConnection.producer();

  const writeRepository =
    config.database.write.provider === "postgres"
      ? new PostgresNotificationRepositoryWrite(postgresWriteConnection.getClient())
      : new MongoNotificationRepositoryWrite(mongoWriteConnection.getClient().collection<NotificationDTO>("notifications"));

  const readRepository =
    config.database.read.provider === "postgres"
      ? new PostgresNotificationRepositoryRead(postgresReadConnection.getClient())
      : new MongoNotificationRepositoryRead(mongoReadConnection.getClient().collection<NotificationDTO>("notifications"));

  const cache = new RedisNotificationCache(redis);
  const eventBus = new KafkaEventBus(producer);
  const telemetry = new OTelTelemetry();

  const createNotificationUseCase = new CreateNotificationUseCase(writeRepository, cache, eventBus, telemetry);
  const getNotificationUseCase = new GetNotificationUseCase(readRepository, cache, telemetry);
  const deleteNotificationUseCase = new DeleteNotificationUseCase(writeRepository, cache, eventBus, telemetry);

  const controller = new NotificationController(
    createNotificationUseCase,
    getNotificationUseCase,
    deleteNotificationUseCase,
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

    setTimeout(() => { console.error("Forced shutdown after timeout."); process.exit(1); }, 10000).unref();
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
