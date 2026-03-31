// src/main.ts
import { config } from "./infrastructure/config.js";
import { TelemetryConnection } from "./infrastructure/telemetry/otel/connection.js";
import { bootstrapGrpc } from "./adapters/inbound/grpc/bootstrap.js";

async function bootstrap() {
  // Initialize OpenTelemetry before any other code so all spans are captured
  const telemetry = new TelemetryConnection(
    `${config.app.name}-service`,
    config.telemetry.otel.endpoint,
  );
  telemetry.start();

  await bootstrapGrpc();
}

bootstrap().catch((error) => {
  console.error("Fatal error during bootstrap:", error);
  process.exit(1);
});
