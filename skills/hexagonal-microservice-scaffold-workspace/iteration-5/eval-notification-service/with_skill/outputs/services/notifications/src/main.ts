// src/main.ts
import { config } from './infrastructure/config.js';
import { TelemetryConnection } from './infrastructure/telemetry/otel/connection.js';
import { bootstrapExpress } from './adapters/inbound/http/express/bootstrap.js';
import { bootstrapKafkaConsumer } from './adapters/inbound/messaging/kafka/bootstrap.js';

async function bootstrap(): Promise<void> {
  const telemetry = new TelemetryConnection(
    `${config.app.name}-service`,
    config.telemetry.otel.endpoint,
  );
  telemetry.start();

  await Promise.all([
    bootstrapExpress(),       // HTTP server for internal status queries
    bootstrapKafkaConsumer(), // Kafka consumer for events from other services
  ]);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
