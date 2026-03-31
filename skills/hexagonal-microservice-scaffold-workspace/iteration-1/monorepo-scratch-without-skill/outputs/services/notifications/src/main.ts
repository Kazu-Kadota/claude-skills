import { TelemetryConnection } from "./infrastructure/telemetry/otel/connection.js";
import { config } from "./infrastructure/config.js";

// Start telemetry before anything else
const telemetry = new TelemetryConnection("notifications", config.telemetry.otel.endpoint);
telemetry.start();

// Choose bootstrap: Express or NestJS
const adapter = process.env.INBOUND_ADAPTER ?? "express";

if (adapter === "nest") {
  const { bootstrapNest } = await import(
    "./adapters/inbound/http/nest/bootstrap.js"
  );
  await bootstrapNest();
} else {
  const { bootstrapExpress } = await import(
    "./adapters/inbound/http/express/bootstrap.js"
  );
  await bootstrapExpress();
}
