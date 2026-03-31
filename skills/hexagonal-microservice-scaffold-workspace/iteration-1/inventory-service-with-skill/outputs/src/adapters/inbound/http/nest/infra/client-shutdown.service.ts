// src/adapters/inbound/http/nest/infra/client-shutdown.service.ts
import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import {
  POSTGRES_WRITE_CONNECTION,
  POSTGRES_READ_CONNECTION,
  MONGO_WRITE_CONNECTION,
  MONGO_READ_CONNECTION,
  REDIS_CONNECTION,
  KAFKA_CONNECTION,
} from "../token.js";

@Injectable()
export class ClientShutdownService implements OnApplicationShutdown {
  constructor(
    @Inject(POSTGRES_WRITE_CONNECTION) private readonly postgresWrite: any,
    @Inject(POSTGRES_READ_CONNECTION) private readonly postgresRead: any,
    @Inject(MONGO_WRITE_CONNECTION) private readonly mongoWrite: any,
    @Inject(MONGO_READ_CONNECTION) private readonly mongoRead: any,
    @Inject(REDIS_CONNECTION) private readonly redis: any,
    @Inject(KAFKA_CONNECTION) private readonly kafka: any,
  ) {}

  async onApplicationShutdown(signal?: string) {
    console.log(`Received ${signal}. Closing connections...`);
    await Promise.allSettled([
      this.postgresWrite.close(),
      this.postgresRead.close(),
      this.mongoWrite.close(),
      this.mongoRead.close(),
      this.redis.close(),
      this.kafka.close(),
    ]);
  }
}
