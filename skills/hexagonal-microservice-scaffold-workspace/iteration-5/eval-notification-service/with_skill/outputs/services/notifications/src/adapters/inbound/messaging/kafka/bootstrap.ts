// src/adapters/inbound/messaging/kafka/bootstrap.ts
// Second composition root for the Kafka consumer.
// Runs in parallel with the HTTP bootstrap in main.ts — owns its own connections.
import { initializeApp, cert, App } from 'firebase-admin/app';
import { config } from '../../../../infrastructure/config.js';
import { PostgresConnection } from '../../../../infrastructure/database/postgres/connection.js';
import { KafkaConnection } from '../../../../infrastructure/messaging/kafka/connection.js';
import { PostgresNotificationRepositoryWrite } from '../../../outbound/database/postgres/write.js';
import { KafkaEventBus } from '../../../outbound/messaging/kafka/event-bus.js';
import { OTelTelemetry } from '../../../outbound/telemetry/otel/otel-telemetry.js';
import { FcmPushAdapter } from '../../../outbound/push/fcm/fcm-push-adapter.js';
import { CreateNotificationUseCase } from '../../../../application/use-cases/create-notification.js';
import { NotificationKafkaConsumer } from './notification-consumer.js';

export async function bootstrapKafkaConsumer(): Promise<void> {
  const databaseUrl = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/notifications`;

  const postgresConnection = new PostgresConnection(databaseUrl);
  await postgresConnection.connect();

  // Producer connection for publishing outbound events
  const producerKafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-notifications-producer`,
    config.messaging.kafka.brokers,
  );
  await producerKafkaConnection.connect();
  const producer = await producerKafkaConnection.producer();

  // Consumer connection (separate Kafka client)
  const consumerKafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-notifications-consumer`,
    config.messaging.kafka.brokers,
  );
  await consumerKafkaConnection.connect();
  const consumer = await consumerKafkaConnection.consumer('notifications-group');

  let firebaseApp: App;
  if (config.fcm.projectId && config.fcm.clientEmail && config.fcm.privateKey) {
    firebaseApp = initializeApp(
      {
        credential: cert({
          projectId: config.fcm.projectId,
          clientEmail: config.fcm.clientEmail,
          privateKey: config.fcm.privateKey.replace(/\\n/g, '\n'),
        }),
      },
      'consumer', // unique name to avoid duplicate app error
    );
  } else {
    firebaseApp = initializeApp(
      { projectId: config.fcm.projectId || 'dev-project' },
      'consumer',
    );
  }

  const writeRepository = new PostgresNotificationRepositoryWrite(postgresConnection.getClient());
  const eventBus = new KafkaEventBus(producer);
  const telemetry = new OTelTelemetry();
  const pushAdapter = new FcmPushAdapter(firebaseApp);

  const createNotificationUseCase = new CreateNotificationUseCase(
    writeRepository,
    eventBus,
    pushAdapter,
    telemetry,
  );

  const notificationConsumer = new NotificationKafkaConsumer(consumer, createNotificationUseCase);
  await notificationConsumer.start();

  console.log('[notifications] Kafka consumer started — listening on: order.created');

  async function shutdown(signal: string): Promise<void> {
    console.log(`Received ${signal}. Disconnecting Kafka consumer...`);
    await Promise.allSettled([
      consumerKafkaConnection.close(),
      producerKafkaConnection.close(),
      postgresConnection.close(),
    ]);
    process.exit(0);
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
