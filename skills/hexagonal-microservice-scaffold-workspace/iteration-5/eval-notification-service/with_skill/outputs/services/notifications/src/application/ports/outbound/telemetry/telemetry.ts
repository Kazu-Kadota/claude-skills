// src/application/ports/outbound/telemetry/telemetry.ts

export abstract class INotificationsTelemetryPort {
  abstract span<T>(name: string, fn: () => Promise<T>): Promise<T>;
}
