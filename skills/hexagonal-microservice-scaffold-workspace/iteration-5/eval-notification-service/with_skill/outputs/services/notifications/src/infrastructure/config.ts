// src/infrastructure/config.ts
// Single source of truth for all environment configuration.
// process.env is ONLY accessed in this file.
import { z } from 'zod';

const schema = z.object({
  app: z.object({
    name: z.literal('notifications'),
    port: z.coerce.number().int().positive().default(3003),
  }),
  database: z.object({
    write: z.object({
      provider: z.enum(['postgres']).default('postgres'),
      host: z.string().default('localhost'),
      port: z.coerce.number().int().positive().default(5432),
      user: z.string().default('postgres'),
      password: z.string().default('postgres'),
    }),
  }),
  messaging: z.object({
    kafka: z.object({
      brokers: z
        .string()
        .default('localhost:9092')
        .transform((str) => str.split(',')),
      clientId: z.string().default('notifications-monorepo'),
    }),
  }),
  telemetry: z.object({
    otel: z.object({
      endpoint: z.string().default('http://localhost:4318'),
    }),
  }),
  fcm: z.object({
    projectId: z.string().default(''),
    clientEmail: z.string().default(''),
    privateKey: z.string().default(''),
  }),
});

export const config = schema.parse({
  app: {
    name: 'notifications',
    port: process.env.NOTIFICATIONS_PORT ?? 3003,
  },
  database: {
    write: {
      provider: 'postgres',
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: process.env.POSTGRES_PORT ?? 5432,
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    },
  },
  messaging: {
    kafka: {
      brokers: process.env.KAFKA_BROKERS ?? 'localhost:9092',
      clientId: process.env.KAFKA_CLIENT_ID ?? 'notifications-monorepo',
    },
  },
  telemetry: {
    otel: {
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318',
    },
  },
  fcm: {
    projectId: process.env.FCM_PROJECT_ID ?? '',
    clientEmail: process.env.FCM_CLIENT_EMAIL ?? '',
    privateKey: process.env.FCM_PRIVATE_KEY ?? '',
  },
});

export type Config = z.infer<typeof schema>;
