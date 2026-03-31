// src/adapters/inbound/http/nest/product.module.ts
import { Module } from "@nestjs/common";
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
import { ProductController } from "./product.controller.js";
import { ProductService } from "./product.service.js";
import { ClientShutdownService } from "./infra/client-shutdown.service.js";
import {
  EVENT_BUS,
  KAFKA_CONNECTION,
  KAFKA_PRODUCER,
  MONGO_READ_COLLECTION,
  MONGO_READ_CONNECTION,
  MONGO_WRITE_COLLECTION,
  MONGO_WRITE_CONNECTION,
  POSTGRES_READ_CONNECTION,
  POSTGRES_READ_PRISMA_CLIENT,
  POSTGRES_WRITE_CONNECTION,
  POSTGRES_WRITE_PRISMA_CLIENT,
  PRODUCT_CACHE,
  READ_PRODUCT_REPOSITORY,
  REDIS_CONNECTION,
  TELEMETRY,
  WRITE_PRODUCT_REPOSITORY,
} from "./token.js";

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    ClientShutdownService,

    // Postgres write connection
    {
      provide: POSTGRES_WRITE_CONNECTION,
      useFactory: async () => {
        const url = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/inventory`;
        const connection = new PostgresConnection(url);
        if (config.database.write.provider === "postgres") await connection.connect();
        return connection;
      },
    },
    {
      provide: POSTGRES_WRITE_PRISMA_CLIENT,
      useFactory: async (c: PostgresConnection) =>
        config.database.write.provider === "postgres" ? c.getClient() : null,
      inject: [POSTGRES_WRITE_CONNECTION],
    },

    // Postgres read connection
    {
      provide: POSTGRES_READ_CONNECTION,
      useFactory: async () => {
        const url = `postgresql://${config.database.read.user}:${config.database.read.password}@${config.database.read.host}:${config.database.read.port}/inventory`;
        const connection = new PostgresConnection(url);
        if (config.database.read.provider === "postgres") await connection.connect();
        return connection;
      },
    },
    {
      provide: POSTGRES_READ_PRISMA_CLIENT,
      useFactory: async (c: PostgresConnection) =>
        config.database.read.provider === "postgres" ? c.getClient() : null,
      inject: [POSTGRES_READ_CONNECTION],
    },

    // MongoDB write connection
    {
      provide: MONGO_WRITE_CONNECTION,
      useFactory: async () => {
        const connection = new MongoConnection(config.database.write.uri, "inventory");
        if (config.database.write.provider === "mongodb") await connection.connect();
        return connection;
      },
    },
    {
      provide: MONGO_WRITE_COLLECTION,
      useFactory: async (c: MongoConnection) =>
        config.database.write.provider === "mongodb"
          ? c.getClient().collection<ProductDTO>("inventory")
          : null,
      inject: [MONGO_WRITE_CONNECTION],
    },

    // MongoDB read connection
    {
      provide: MONGO_READ_CONNECTION,
      useFactory: async () => {
        const connection = new MongoConnection(config.database.read.uri, "inventory");
        if (config.database.read.provider === "mongodb") await connection.connect();
        return connection;
      },
    },
    {
      provide: MONGO_READ_COLLECTION,
      useFactory: async (c: MongoConnection) =>
        config.database.read.provider === "mongodb"
          ? c.getClient().collection<ProductDTO>("inventory")
          : null,
      inject: [MONGO_READ_CONNECTION],
    },

    // Redis
    {
      provide: REDIS_CONNECTION,
      useFactory: () => {
        const r = new RedisConnection(config.cache.redis.url);
        r.connect();
        return r;
      },
    },

    // Kafka
    {
      provide: KAFKA_CONNECTION,
      useFactory: async () => {
        const k = new KafkaConnection(
          `${config.messaging.kafka.clientId}-inventory`,
          config.messaging.kafka.brokers,
        );
        await k.connect();
        return k;
      },
    },
    {
      provide: KAFKA_PRODUCER,
      useFactory: async (k: KafkaConnection) => k.producer(),
      inject: [KAFKA_CONNECTION],
    },

    // Repositories
    {
      provide: WRITE_PRODUCT_REPOSITORY,
      useFactory: (prisma: any, collection: any) =>
        config.database.write.provider === "postgres"
          ? new PostgresProductRepositoryWrite(prisma)
          : new MongoProductRepositoryWrite(collection),
      inject: [POSTGRES_WRITE_PRISMA_CLIENT, MONGO_WRITE_COLLECTION],
    },
    {
      provide: READ_PRODUCT_REPOSITORY,
      useFactory: (prisma: any, collection: any) =>
        config.database.read.provider === "postgres"
          ? new PostgresProductRepositoryRead(prisma)
          : new MongoProductRepositoryRead(collection),
      inject: [POSTGRES_READ_PRISMA_CLIENT, MONGO_READ_COLLECTION],
    },

    // Cache, event bus, telemetry
    {
      provide: PRODUCT_CACHE,
      useFactory: (r: RedisConnection) => new RedisProductCache(r.getClient()),
      inject: [REDIS_CONNECTION],
    },
    {
      provide: EVENT_BUS,
      useFactory: (p: any) => new KafkaEventBus(p),
      inject: [KAFKA_PRODUCER],
    },
    {
      provide: TELEMETRY,
      useFactory: () => new OTelTelemetry(),
    },

    // Use cases
    {
      provide: CreateProductUseCase,
      useFactory: (wr: any, c: any, eb: any, t: any) => new CreateProductUseCase(wr, c, eb, t),
      inject: [WRITE_PRODUCT_REPOSITORY, PRODUCT_CACHE, EVENT_BUS, TELEMETRY],
    },
    {
      provide: GetProductUseCase,
      useFactory: (rr: any, c: any, t: any) => new GetProductUseCase(rr, c, t),
      inject: [READ_PRODUCT_REPOSITORY, PRODUCT_CACHE, TELEMETRY],
    },
    {
      provide: DeactivateProductUseCase,
      useFactory: (rr: any, wr: any, c: any, eb: any, t: any) =>
        new DeactivateProductUseCase(rr, wr, c, eb, t),
      inject: [READ_PRODUCT_REPOSITORY, WRITE_PRODUCT_REPOSITORY, PRODUCT_CACHE, EVENT_BUS, TELEMETRY],
    },
    {
      provide: DeleteProductUseCase,
      useFactory: (wr: any, c: any, eb: any, t: any) => new DeleteProductUseCase(wr, c, eb, t),
      inject: [WRITE_PRODUCT_REPOSITORY, PRODUCT_CACHE, EVENT_BUS, TELEMETRY],
    },
  ],
})
export class ProductModule {}
