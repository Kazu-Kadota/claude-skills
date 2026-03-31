import express from "express";
import { config } from "../../../../infrastructure/config.js";
import { ReviewDTO } from "../../../../domain/review/review.js";
import { MongoReviewRepositoryRead } from "../../../outbound/database/mongodb/read.js";
import { MongoReviewRepositoryWrite } from "../../../outbound/database/mongodb/write.js";
import { PostgresReviewRepositoryRead } from "../../../outbound/database/postgres/read.js";
import { PostgresReviewRepositoryWrite } from "../../../outbound/database/postgres/write.js";
import { RedisReviewCache } from "../../../outbound/cache/redis/review-cache.js";
import { KafkaEventBus } from "../../../outbound/messaging/kafka/event-bus.js";
import { OTelTelemetry } from "../../../outbound/telemetry/otel/otel-telemetry.js";
import { SubmitReviewUseCase } from "../../../../application/use-cases/submit-review.js";
import { ApproveReviewUseCase } from "../../../../application/use-cases/approve-review.js";
import { RejectReviewUseCase } from "../../../../application/use-cases/reject-review.js";
import { GetReviewByIdUseCase } from "../../../../application/use-cases/get-review-by-id.js";
import { ListReviewsByProductUseCase } from "../../../../application/use-cases/list-reviews-by-product.js";
import { ReviewController } from "./review-controller.js";
import { MongoConnection } from "../../../../infrastructure/database/mongodb/connection.js";
import { RedisConnection } from "../../../../infrastructure/cache/redis/connection.js";
import { KafkaConnection } from "../../../../infrastructure/messaging/kafka/connection.js";
import { PostgresConnection } from "../../../../infrastructure/database/postgres/connection.js";

export async function bootstrapExpress() {
  const postgresWriteUrl = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/reviews`;
  const postgresReadUrl = `postgresql://${config.database.read.user}:${config.database.read.password}@${config.database.read.host}:${config.database.read.port}/reviews`;

  const postgresWriteConnection = new PostgresConnection(postgresWriteUrl);
  const postgresReadConnection = new PostgresConnection(postgresReadUrl);
  const mongoWriteConnection = new MongoConnection(
    config.database.write.uri,
    "reviews",
  );
  const mongoReadConnection = new MongoConnection(
    config.database.read.uri,
    "reviews",
  );

  if (config.database.write.provider === "postgres") {
    await postgresWriteConnection.connect();
  } else {
    await mongoWriteConnection.connect();
  }

  if (config.database.read.provider === "postgres") {
    await postgresReadConnection.connect();
  } else {
    await mongoReadConnection.connect();
  }

  const redisConnection = new RedisConnection(config.cache.redis.url);
  const redis = redisConnection.connect();

  const kafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-reviews`,
    config.messaging.kafka.brokers,
  );
  await kafkaConnection.connect();
  const producer = await kafkaConnection.producer();

  const writeRepository =
    config.database.write.provider === "postgres"
      ? new PostgresReviewRepositoryWrite(
          postgresWriteConnection.getClient(),
        )
      : new MongoReviewRepositoryWrite(
          mongoWriteConnection.getClient().collection<ReviewDTO>("reviews"),
        );

  const readRepository =
    config.database.read.provider === "postgres"
      ? new PostgresReviewRepositoryRead(postgresReadConnection.getClient())
      : new MongoReviewRepositoryRead(
          mongoReadConnection.getClient().collection<ReviewDTO>("reviews"),
        );

  const cache = new RedisReviewCache(redis);
  const eventBus = new KafkaEventBus(producer);
  const telemetry = new OTelTelemetry();

  const submitReviewUseCase = new SubmitReviewUseCase(
    writeRepository,
    cache,
    eventBus,
    telemetry,
  );
  const approveReviewUseCase = new ApproveReviewUseCase(
    writeRepository,
    cache,
    eventBus,
    telemetry,
  );
  const rejectReviewUseCase = new RejectReviewUseCase(
    writeRepository,
    cache,
    eventBus,
    telemetry,
  );
  const getReviewByIdUseCase = new GetReviewByIdUseCase(
    readRepository,
    cache,
    telemetry,
  );
  const listReviewsByProductUseCase = new ListReviewsByProductUseCase(
    readRepository,
    telemetry,
  );

  const reviewController = new ReviewController(
    submitReviewUseCase,
    approveReviewUseCase,
    rejectReviewUseCase,
    getReviewByIdUseCase,
    listReviewsByProductUseCase,
  );

  const appExpress = express();
  appExpress.use(express.json());
  appExpress.use(reviewController.buildRouter());

  const server = appExpress.listen(config.app.port, () => {
    console.log(`${config.app.name} service on :${config.app.port}`);
  });

  let shuttingDown = false;

  async function shutdown(signal: string) {
    await telemetry.span("shutdown", async () => {
      await performShutdown(signal);
    });
  }

  async function performShutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async (serverError) => {
      if (serverError) {
        console.error("Error while closing HTTP server:", serverError);
      }

      const results = await Promise.allSettled([
        postgresWriteConnection.close(),
        postgresReadConnection.close(),
        mongoWriteConnection.close(),
        mongoReadConnection.close(),
        redisConnection.close(),
        kafkaConnection.close(),
      ]);

      for (const result of results) {
        if (result.status === "rejected") {
          console.error("Shutdown error:", result.reason);
        }
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
