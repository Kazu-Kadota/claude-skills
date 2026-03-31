import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { trace, Tracer } from '@opentelemetry/api'

let sdk: NodeSDK

export function initTracing(serviceName: string, jaegerEndpoint: string): void {
  const exporter = new JaegerExporter({
    endpoint: jaegerEndpoint,
  })

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
    spanProcessor: new SimpleSpanProcessor(exporter),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  })

  sdk.start()
  console.log(`OpenTelemetry tracing initialized for service: ${serviceName}`)
}

export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown()
    console.log('OpenTelemetry tracing shut down')
  }
}

export function getTracer(name: string): Tracer {
  return trace.getTracer(name)
}
