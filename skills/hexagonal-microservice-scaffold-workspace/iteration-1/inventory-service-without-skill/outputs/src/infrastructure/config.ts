// src/infrastructure/config.ts

import z from "zod";

const schema = z.object({
  app: z.object({
    name: z.literal("inventory"),
    port: z.coerce.number().int().positive().default(3001),
  }),
  cache: z.object({
    redis: z.object({
      url: z.string().default("redis://localhost:6379"),
    }),
  }),
  database: z.object({
    write: z.object({
      provider: z.enum(["postgres", "mongodb"]).default("postgres"),
      host: z.string().default("localhost"),
      port: z.coerce.number().int().positive().default(5432),
      user: z.string().default("postgres"),
      password: z.string().default("postgres"),
      uri: z.string().default("mongodb://localhost:27017"),
    }),
    read: z.object({
      provider: z.enum(["postgres", "mongodb"]).default("mongodb"),
      host: z.string().default("localhost"),
      port: z.coerce.number().int().positive().default(5432),
      user: z.string().default("postgres"),
      password: z.string().default("postgres"),
      uri: z.string().default("mongodb://localhost:27017"),
    }),
  }),
  messaging: z.object({
    kafka: z.object({
      brokers: z
        .string()
        .default("localhost:9092")
        .transform((str) => str.split(",")),
      clientId: z.string().default("my-monorepo"),
    }),
  }),
  telemetry: z.object({
    otel: z.object({
      endpoint: z.string().default("http://localhost:4318"),
    }),
  }),
});

export const config = schema.parse({
  app: {
    name: "inventory",
    port: process.env.INVENTORY_PORT ?? 3001,
  },
  cache: {
    redis: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
  },
  database: {
    write: {
      provider: process.env.INVENTORY_DB_WRITE_ADAPTER ?? "postgres",
      host: process.env.POSTGRES_HOST ?? "localhost",
      port: process.env.POSTGRES_PORT ?? 5432,
      user: process.env.POSTGRES_USER ?? "postgres",
      password: process.env.POSTGRES_PASSWORD ?? "postgres",
      uri: process.env.MONGO_URI ?? "mongodb://localhost:27017",
    },
    read: {
      provider: process.env.INVENTORY_DB_READ_ADAPTER ?? "mongodb",
      host: process.env.POSTGRES_HOST ?? "localhost",
      port: process.env.POSTGRES_PORT ?? 5432,
      user: process.env.POSTGRES_USER ?? "postgres",
      password: process.env.POSTGRES_PASSWORD ?? "postgres",
      uri: process.env.MONGO_URI ?? "mongodb://localhost:27017",
    },
  },
  messaging: {
    kafka: {
      brokers: process.env.KAFKA_BROKERS ?? "localhost:9092",
      clientId: process.env.KAFKA_CLIENT_ID ?? "my-monorepo",
    },
  },
  telemetry: {
    otel: { endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318" },
  },
});

export type Config = z.infer<typeof schema>;
