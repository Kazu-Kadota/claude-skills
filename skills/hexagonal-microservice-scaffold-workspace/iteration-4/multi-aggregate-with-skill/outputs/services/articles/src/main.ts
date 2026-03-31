// src/main.ts
import { config } from "./infrastructure/config.js";
import { bootstrapExpress } from "./adapters/inbound/http/express/bootstrap.js";
import { TelemetryConnection } from "./infrastructure/telemetry/otel/connection.js";

async function bootstrap() {
  const telemetry = new TelemetryConnection(`${config.app.name}-service`, config.telemetry.otel.endpoint);
  telemetry.start();

  await bootstrapExpress();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
