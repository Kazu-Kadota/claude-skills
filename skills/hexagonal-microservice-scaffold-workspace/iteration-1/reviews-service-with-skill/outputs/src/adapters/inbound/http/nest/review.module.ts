// src/adapters/inbound/http/nest/review.module.ts
import { Module } from "@nestjs/common";
import { Collection } from "mongodb";
import { Producer } from "kafkajs";
import { ReviewController } from "./review.controller.js";
import { ReviewService } from "./review.service.js";
import { ClientShutdownService } from "./infra/client-shutdown.service.js";
import { config } from "../../../../infrastructure/config.js";
import { ReviewDTO } from "../../../../domain/review.js";
import { MongoConnection } from "../../../../infrastructure/database/mongodb/connection.js";
import { PostgresConnection } from "../../../../infrastructure/database/postgres/connection.js";
import { RedisConnection } from "../../../../infrastructure/cache/redis/connection.js";
import { KafkaConnection } from "../../../../infrastructure/messaging/kafka/connection.js";
import { PrismaClient } from "../../../../generated/reviews/client.js";
import { MongoReviewRepositoryRead } from "../../../outbound/database/mongodb/read.js";
import { MongoReviewRepositoryWrite } from "../../../outbound/database/mongodb/write.js";
import { PostgresReviewRepositoryRead } from "../../../outbound/database/postgres/read.js";
import { PostgresReviewRepositoryWrite } from "../../../outbound/database/postgres/write.js";
import { RedisReviewCache } from "../../../outbound/cache/redis/review-cache.js";
import { KafkaEventBus } from "../../../outbound/messaging/kafka/event-bus.js";
import { OTelTelemetry } from "../../../outbound/telemetry/otel/otel-telemetry.js";
import { SubmitReviewUseCase } from "../../../../application/use-cases/submit-review.js";
import { GetReviewUseCase } from "../../../../application/use-cases/get-review.js";
import { ApproveReviewUseCase } from "../../../../application/use-cases/approve-review.js";
import { RejectReviewUseCase } from "../../../../application/use-cases/reject-review.js";
import { ListReviewsByProductUseCase } from "../../../../application/use-cases/list-reviews-by-product.js";
import { IReviewsRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";
import { IReviewsRepositoryReadPort } from "../../../../application/ports/outbound/database/database-read.js";
import { IReviewsCachePort } from "../../../../application/ports/outbound/cache/cache.js";
import { IReviewsEventBusPort } from "../../../../application/ports/outbound/messaging/messaging.js";
import { IReviewsTelemetryPort } from "../../../../application/ports/outbound/telemetry/telemetry.js";
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
  READ_REVIEW_REPOSITORY,
  REDIS_CONNECTION,
  REVIEW_CACHE,
  TELEMETRY,
  WRITE_REVIEW_REPOSITORY,
} from "./token.js";

@Module({
  imports: [],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ClientShutdownService,
    {
      provide: POSTGRES_WRITE_CONNECTION,
      useFactory: async (): Promise<PostgresConnection> => {
        const postgresUrl = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/reviews`;
        const postgres = new PostgresConnection(postgresUrl);
        if (config.database.write.provider === "postgres") {
          await postgres.connect();
        }
        return postgres;
      },
    },
    {
      provide: POSTGRES_WRITE_PRISMA_CLIENT,
      useFactory: async (postgresConnection: PostgresConnection): Promise<PrismaClient | null> => {
        return config.database.write.provider === "postgres" ? postgresConnection.getClient() : null;
      },
      inject: [POSTGRES_WRITE_CONNECTION],
    },
    {
      provide: POSTGRES_READ_CONNECTION,
      useFactory: async (): Promise<PostgresConnection> => {
        const postgresUrl = `postgresql://${config.database.read.user}:${config.database.read.password}@${config.database.read.host}:${config.database.read.port}/reviews`;
        const postgres = new PostgresConnection(postgresUrl);
        if (config.database.read.provider === "postgres") {
          await postgres.connect();
        }
        return postgres;
      },
    },
    {
      provide: POSTGRES_READ_PRISMA_CLIENT,
      useFactory: async (postgresConnection: PostgresConnection): Promise<PrismaClient | null> => {
        return config.database.read.provider === "postgres" ? postgresConnection.getClient() : null;
      },
      inject: [POSTGRES_READ_CONNECTION],
    },
    {
      provide: MONGO_WRITE_CONNECTION,
      useFactory: async (): Promise<MongoConnection> => {
        const mongo = new MongoConnection(config.database.write.uri, "reviews");
        if (config.database.write.provider === "mongodb") {
          await mongo.connect();
        }
        return mongo;
      },
    },
    {
      provide: MONGO_WRITE_COLLECTION,
      useFactory: async (mongoConnection: MongoConnection): Promise<Collection<ReviewDTO> | null> => {
        return config.database.write.provider === "mongodb"
          ? mongoConnection.getClient().collection<ReviewDTO>("reviews")
          : null;
      },
      inject: [MONGO_WRITE_CONNECTION],
    },
    {
      provide: MONGO_READ_CONNECTION,
      useFactory: async (): Promise<MongoConnection> => {
        const mongo = new MongoConnection(config.database.read.uri, "reviews");
        if (config.database.read.provider === "mongodb") {
          await mongo.connect();
        }
        return mongo;
      },
    },
    {
      provide: MONGO_READ_COLLECTION,
      useFactory: async (mongoConnection: MongoConnection): Promise<Collection<ReviewDTO> | null> => {
        return config.database.read.provider === "mongodb"
          ? mongoConnection.getClient().collection<ReviewDTO>("reviews")
          : null;
      },
      inject: [MONGO_READ_CONNECTION],
    },
    {
      provide: REDIS_CONNECTION,
      useFactory: (): RedisConnection => {
        const redis = new RedisConnection(config.cache.redis.url);
        redis.connect();
        return redis;
      },
    },
    {
      provide: KAFKA_CONNECTION,
      useFactory: async (): Promise<KafkaConnection> => {
        const kafka = new KafkaConnection(
          `${config.messaging.kafka.clientId}-reviews`,
          config.messaging.kafka.brokers,
        );
        await kafka.connect();
        return kafka;
      },
    },
    {
      provide: KAFKA_PRODUCER,
      useFactory: async (kafkaConnection: KafkaConnection): Promise<Producer> => {
        return await kafkaConnection.producer();
      },
      inject: [KAFKA_CONNECTION],
    },
    {
      provide: WRITE_REVIEW_REPOSITORY,
      useFactory: (
        prismaClient: PrismaClient | null,
        collection: Collection<ReviewDTO> | null,
      ): IReviewsRepositoryWritePort => {
        if (config.database.write.provider === "postgres") {
          if (!prismaClient) throw new Error("Postgres write client is not available");
          return new PostgresReviewRepositoryWrite(prismaClient);
        }
        if (!collection) throw new Error("Mongo write collection is not available");
        return new MongoReviewRepositoryWrite(collection);
      },
      inject: [POSTGRES_WRITE_PRISMA_CLIENT, MONGO_WRITE_COLLECTION],
    },
    {
      provide: READ_REVIEW_REPOSITORY,
      useFactory: (
        prismaClient: PrismaClient | null,
        collection: Collection<ReviewDTO> | null,
      ): IReviewsRepositoryReadPort => {
        if (config.database.read.provider === "postgres") {
          if (!prismaClient) throw new Error("Postgres read client is not available");
          return new PostgresReviewRepositoryRead(prismaClient);
        }
        if (!collection) throw new Error("Mongo read collection is not available");
        return new MongoReviewRepositoryRead(collection);
      },
      inject: [POSTGRES_READ_PRISMA_CLIENT, MONGO_READ_COLLECTION],
    },
    {
      provide: REVIEW_CACHE,
      useFactory: (redisConnection: RedisConnection): IReviewsCachePort => {
        return new RedisReviewCache(redisConnection.getClient());
      },
      inject: [REDIS_CONNECTION],
    },
    {
      provide: EVENT_BUS,
      useFactory: (producer: Producer): IReviewsEventBusPort => {
        return new KafkaEventBus(producer);
      },
      inject: [KAFKA_PRODUCER],
    },
    {
      provide: TELEMETRY,
      useFactory: (): IReviewsTelemetryPort => {
        return new OTelTelemetry();
      },
    },
    {
      provide: SubmitReviewUseCase,
      useFactory: (
        writeRepository: IReviewsRepositoryWritePort,
        cache: IReviewsCachePort,
        eventBus: IReviewsEventBusPort,
        telemetry: IReviewsTelemetryPort,
      ) => {
        return new SubmitReviewUseCase(writeRepository, cache, eventBus, telemetry);
      },
      inject: [WRITE_REVIEW_REPOSITORY, REVIEW_CACHE, EVENT_BUS, TELEMETRY],
    },
    {
      provide: GetReviewUseCase,
      useFactory: (
        readRepository: IReviewsRepositoryReadPort,
        cache: IReviewsCachePort,
        telemetry: IReviewsTelemetryPort,
      ) => {
        return new GetReviewUseCase(readRepository, cache, telemetry);
      },
      inject: [READ_REVIEW_REPOSITORY, REVIEW_CACHE, TELEMETRY],
    },
    {
      provide: ApproveReviewUseCase,
      useFactory: (
        readRepository: IReviewsRepositoryReadPort,
        writeRepository: IReviewsRepositoryWritePort,
        cache: IReviewsCachePort,
        eventBus: IReviewsEventBusPort,
        telemetry: IReviewsTelemetryPort,
      ) => {
        return new ApproveReviewUseCase(readRepository, writeRepository, cache, eventBus, telemetry);
      },
      inject: [READ_REVIEW_REPOSITORY, WRITE_REVIEW_REPOSITORY, REVIEW_CACHE, EVENT_BUS, TELEMETRY],
    },
    {
      provide: RejectReviewUseCase,
      useFactory: (
        readRepository: IReviewsRepositoryReadPort,
        writeRepository: IReviewsRepositoryWritePort,
        cache: IReviewsCachePort,
        eventBus: IReviewsEventBusPort,
        telemetry: IReviewsTelemetryPort,
      ) => {
        return new RejectReviewUseCase(readRepository, writeRepository, cache, eventBus, telemetry);
      },
      inject: [READ_REVIEW_REPOSITORY, WRITE_REVIEW_REPOSITORY, REVIEW_CACHE, EVENT_BUS, TELEMETRY],
    },
    {
      provide: ListReviewsByProductUseCase,
      useFactory: (readRepository: IReviewsRepositoryReadPort, telemetry: IReviewsTelemetryPort) => {
        return new ListReviewsByProductUseCase(readRepository, telemetry);
      },
      inject: [READ_REVIEW_REPOSITORY, TELEMETRY],
    },
  ],
})
export class ReviewModule {}
