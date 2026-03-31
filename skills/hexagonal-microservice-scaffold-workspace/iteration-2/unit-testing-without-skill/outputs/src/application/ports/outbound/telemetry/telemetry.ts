// src/application/ports/outbound/telemetry/telemetry.ts

export abstract class IOrderTelemetryPort {
  abstract span<T>(name: string, fn: () => Promise<T>): Promise<T>;
}
