// src/adapters/outbound/telemetry/otel/otel-telemetry.ts
import { trace } from "@opentelemetry/api";
import { IArticlesTelemetryPort } from "../../../../application/ports/outbound/telemetry/telemetry.js";

export class OTelTelemetry implements IArticlesTelemetryPort {
  async span<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const tracer = trace.getTracer("articles-service");
    return tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn();
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }
}
