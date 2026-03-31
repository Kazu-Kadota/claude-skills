// src/infrastructure/config.ts
// Central configuration — the ONLY place where process.env is accessed.
import z from "zod";

const schema = z.object({
  app: z.object({
    name: z.literal("shipments"),
    port: z.coerce.number().int().positive().default(50051), // default gRPC port
  }),
  database: z.object({
    dynamodb: z.object({
      region: z.string().default("us-east-1"),
      tableName: z.string().default("shipments"),
      endpoint: z.string().optional(), // set for LocalStack / local dev
    }),
  }),
  messaging: z.object({
    sqs: z.object({
      region: z.string().default("us-east-1"),
      queueUrl: z.string().default("https://sqs.us-east-1.amazonaws.com/000000000000/shipments"),
      endpoint: z.string().optional(), // set for LocalStack / local dev
    }),
  }),
  cache: z.object({
    ttlSeconds: z.coerce.number().int().positive().default(60),
  }),
  telemetry: z.object({
    otel: z.object({
      endpoint: z.string().default("http://localhost:4318"),
    }),
  }),
});

export const config = schema.parse({
  app: {
    name: "shipments",
    port: process.env["SHIPMENTS_PORT"] ?? 50051,
  },
  database: {
    dynamodb: {
      region: process.env["AWS_REGION"] ?? "us-east-1",
      tableName: process.env["DYNAMODB_TABLE_NAME"] ?? "shipments",
      endpoint: process.env["DYNAMODB_ENDPOINT"],
    },
  },
  messaging: {
    sqs: {
      region: process.env["AWS_REGION"] ?? "us-east-1",
      queueUrl:
        process.env["SQS_QUEUE_URL"] ??
        "https://sqs.us-east-1.amazonaws.com/000000000000/shipments",
      endpoint: process.env["SQS_ENDPOINT"],
    },
  },
  cache: {
    ttlSeconds: process.env["CACHE_TTL_SECONDS"] ?? 60,
  },
  telemetry: {
    otel: {
      endpoint: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4318",
    },
  },
});

export type Config = z.infer<typeof schema>;
