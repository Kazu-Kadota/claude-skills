// src/adapters/inbound/http/express/bootstrap.ts
// Composition root for the Express HTTP server.
// This is the ONLY place where concrete adapters are instantiated.
import express from 'express';
import { initializeApp, cert, App } from 'firebase-admin/app';
import { config } from '../../../../infrastructure/config.js';
import { PostgresConnection } from '../../../../infrastructure/database/postgres/connection.js';
import { KafkaConnection } from '../../../../infrastructure/messaging/kafka/connection.js';
import { PostgresNotificationRepositoryWrite } from '../../../outbound/database/postgres/write.js';
import { PostgresNotificationRepositoryRead } from '../../../outbound/database/postgres/read.js';
import { KafkaEventBus } from '../../../outbound/messaging/kafka/event-bus.js';
import { OTelTelemetry } from '../../../outbound/telemetry/otel/otel-telemetry.js';
import { FcmPushAdapter } from '../../../outbound/push/fcm/fcm-push-adapter.js';
import { CreateNotificationUseCase } from '../../../../application/use-cases/create-notification.js';
import { GetNotificationUseCase } from '../../../../application/use-cases/get-notification.js';
import { MarkAsSentUseCase } from '../../../../application/use-cases/mark-as-sent.js';
import { MarkAsFailedUseCase } from '../../../../application/use-cases/mark-as-failed.js';
import { NotificationController } from './notification-controller.js';

export async function bootstrapExpress(): Promise<void> {
  const databaseUrl = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/notifications`;

  const postgresWriteConnection = new PostgresConnection(databaseUrl);
  await postgresWriteConnection.connect();

  // For read, we use the same Postgres DB (no CQRS split)
  const postgresReadConnection = new PostgresConnection(databaseUrl);
  await postgresReadConnection.connect();

  const kafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-notifications`,
    config.messaging.kafka.brokers,
  );
  await kafkaConnection.connect();
  const producer = await kafkaConnection.producer();

  // Firebase Admin SDK initialisation
  let firebaseApp: App;
  if (config.fcm.projectId && config.fcm.clientEmail && config.fcm.privateKey) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: config.fcm.projectId,
        clientEmail: config.fcm.clientEmail,
        privateKey: config.fcm.privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // In development without real credentials, initialise with no credential
    // (push will fail at runtime — use a test double in tests)
    firebaseApp = initializeApp({ projectId: config.fcm.projectId || 'dev-project' });
  }

  const writeRepository = new PostgresNotificationRepositoryWrite(
    postgresWriteConnection.getClient(),
  );
  const readRepository = new PostgresNotificationRepositoryRead(
    postgresReadConnection.getClient(),
  );

  const eventBus = new KafkaEventBus(producer);
  const telemetry = new OTelTelemetry();
  const pushAdapter = new FcmPushAdapter(firebaseApp);

  const createNotificationUseCase = new CreateNotificationUseCase(
    writeRepository,
    eventBus,
    pushAdapter,
    telemetry,
  );
  const getNotificationUseCase = new GetNotificationUseCase(readRepository, telemetry);
  const markAsSentUseCase = new MarkAsSentUseCase(writeRepository, eventBus, telemetry);
  const markAsFailedUseCase = new MarkAsFailedUseCase(writeRepository, eventBus, telemetry);

  const controller = new NotificationController(
    createNotificationUseCase,
    getNotificationUseCase,
    markAsSentUseCase,
    markAsFailedUseCase,
  );

  const app = express();
  app.use(express.json());
  app.use(controller.buildRouter());

  const server = app.listen(config.app.port, () => {
    console.log(`${config.app.name} service on :${config.app.port}`);
  });

  let shuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async (serverError) => {
      if (serverError) console.error('Error while closing HTTP server:', serverError);

      const results = await Promise.allSettled([
        postgresWriteConnection.close(),
        postgresReadConnection.close(),
        kafkaConnection.close(),
      ]);

      for (const result of results) {
        if (result.status === 'rejected') console.error('Shutdown error:', result.reason);
      }

      console.log('Graceful shutdown completed.');
      process.exit(serverError ? 1 : 0);
    });

    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
