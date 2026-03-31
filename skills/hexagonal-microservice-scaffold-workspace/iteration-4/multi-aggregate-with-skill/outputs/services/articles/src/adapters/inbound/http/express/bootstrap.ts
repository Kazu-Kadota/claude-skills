// src/adapters/inbound/http/express/bootstrap.ts
// Composition root — wires all infrastructure, adapters, use cases, and controllers for both aggregates
import express from "express";
import { config } from "../../../../infrastructure/config.js";
import type { ArticleDTO } from "../../../../domain/article/article.js";
import type { TipDTO } from "../../../../domain/tip/tip.js";
import { MongoConnection } from "../../../../infrastructure/database/mongodb/connection.js";
import { PostgresConnection } from "../../../../infrastructure/database/postgres/connection.js";
import { RedisConnection } from "../../../../infrastructure/cache/redis/connection.js";
import { KafkaConnection } from "../../../../infrastructure/messaging/kafka/connection.js";

// Article outbound adapters
import { PostgresArticleRepositoryWrite } from "../../../outbound/database/postgres/article/write.js";
import { MongoArticleRepositoryRead } from "../../../outbound/database/mongodb/article/read.js";
import { RedisArticleCache } from "../../../outbound/cache/redis/article-cache.js";
import { KafkaArticleEventBus } from "../../../outbound/messaging/kafka/article-event-bus.js";

// Tip outbound adapters
import { PostgresTipRepositoryWrite } from "../../../outbound/database/postgres/tip/write.js";
import { MongoTipRepositoryRead } from "../../../outbound/database/mongodb/tip/read.js";
import { RedisTipCache } from "../../../outbound/cache/redis/tip-cache.js";

// Shared telemetry adapter
import { OTelTelemetry } from "../../../outbound/telemetry/otel/otel-telemetry.js";

// Article use cases
import { CreateArticleUseCase } from "../../../../application/use-cases/article/create-article.js";
import { GetArticleUseCase } from "../../../../application/use-cases/article/get-article.js";
import { PublishArticleUseCase } from "../../../../application/use-cases/article/publish-article.js";

// Tip use cases
import { CreateTipUseCase } from "../../../../application/use-cases/tip/create-tip.js";
import { GetTipUseCase } from "../../../../application/use-cases/tip/get-tip.js";

// Controllers
import { ArticleController } from "./article/article-controller.js";
import { TipController } from "./tip/tip-controller.js";

export async function bootstrapExpress() {
  // ─── Infrastructure connections ───────────────────────────────────────────

  // Postgres (write) — shared across both aggregates via a single Prisma client
  const postgresWriteUrl = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/articles`;
  const postgresWriteConnection = new PostgresConnection(postgresWriteUrl);
  await postgresWriteConnection.connect();

  // MongoDB (read) — shared across both aggregates via separate collections
  const mongoReadConnection = new MongoConnection(config.database.read.uri, "articles");
  await mongoReadConnection.connect();

  // Redis (cache) — shared across both aggregates
  const redisConnection = new RedisConnection(config.cache.redis.url);
  const redis = redisConnection.connect();

  // Kafka (only Article publishes events)
  const kafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-articles`,
    config.messaging.kafka.brokers,
  );
  await kafkaConnection.connect();
  const producer = await kafkaConnection.producer();

  // Shared telemetry
  const telemetry = new OTelTelemetry();

  // ─── Article adapters & use cases ────────────────────────────────────────

  const articleWriteRepository = new PostgresArticleRepositoryWrite(postgresWriteConnection.getClient());
  const articleReadRepository = new MongoArticleRepositoryRead(
    mongoReadConnection.getClient().collection<ArticleDTO>("articles"),
  );
  const articleCache = new RedisArticleCache(redis);
  const articleEventBus = new KafkaArticleEventBus(producer);

  const createArticleUseCase = new CreateArticleUseCase(articleWriteRepository, articleCache, articleEventBus, telemetry);
  const getArticleUseCase = new GetArticleUseCase(articleReadRepository, articleCache, telemetry);
  const publishArticleUseCase = new PublishArticleUseCase(
    articleReadRepository,
    articleWriteRepository,
    articleCache,
    articleEventBus,
    telemetry,
  );

  const articleController = new ArticleController(createArticleUseCase, getArticleUseCase, publishArticleUseCase);

  // ─── Tip adapters & use cases ────────────────────────────────────────────

  const tipWriteRepository = new PostgresTipRepositoryWrite(postgresWriteConnection.getClient());
  const tipReadRepository = new MongoTipRepositoryRead(
    mongoReadConnection.getClient().collection<TipDTO>("tips"),
  );
  const tipCache = new RedisTipCache(redis);

  const createTipUseCase = new CreateTipUseCase(tipWriteRepository, tipCache, telemetry);
  const getTipUseCase = new GetTipUseCase(tipReadRepository, tipCache, telemetry);

  const tipController = new TipController(createTipUseCase, getTipUseCase);

  // ─── Express app ─────────────────────────────────────────────────────────

  const app = express();
  app.use(express.json());

  // Mount each aggregate's router at its own path
  app.use("/articles", articleController.buildRouter());
  app.use("/tips", tipController.buildRouter());

  const server = app.listen(config.app.port, () => {
    console.log(`articles service on :${config.app.port}`);
  });

  // ─── Graceful shutdown ───────────────────────────────────────────────────

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async (serverError) => {
      if (serverError) console.error("Error while closing HTTP server:", serverError);

      const results = await Promise.allSettled([
        postgresWriteConnection.close(),
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
