// src/infrastructure/cache/ports.ts
import { Redis } from "ioredis";

export abstract class CacheConnectionPort {
  abstract connect(): Redis;
  abstract close(): Promise<void>;
  abstract getClient(): Redis;
}
