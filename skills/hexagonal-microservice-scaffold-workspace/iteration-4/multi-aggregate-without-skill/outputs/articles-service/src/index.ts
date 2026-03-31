import { loadConfig } from './infrastructure/config/env'
import { initTracing, shutdownTracing } from './infrastructure/telemetry/tracer'
import { buildContainer } from './infrastructure/container'
import { createApp } from './infrastructure/http/express/app'

async function bootstrap(): Promise<void> {
  const config = loadConfig()

  // Init tracing BEFORE importing any instrumented modules
  initTracing(config.otel.serviceName, config.otel.jaegerEndpoint)

  const container = buildContainer(config)

  // Connect to all infrastructure
  await container.postgresClient.connect()
  await container.mongoClient.connect()
  await container.redisClient.connect()
  await container.kafkaClient.connect()

  // Build Express app
  const app = createApp({
    articleController: container.articleController,
    tipController: container.tipController,
  })

  const server = app.listen(config.port, () => {
    console.log(`[${config.serviceName}] HTTP server listening on port ${config.port}`)
    console.log(`[${config.serviceName}] Environment: ${config.nodeEnv}`)
  })

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[${config.serviceName}] Received ${signal} — shutting down gracefully...`)
    server.close(async () => {
      try {
        await container.kafkaClient.disconnect()
        await container.redisClient.disconnect()
        await container.mongoClient.disconnect()
        await container.postgresClient.disconnect()
        await shutdownTracing()
        console.log(`[${config.serviceName}] Shutdown complete`)
        process.exit(0)
      } catch (err) {
        console.error(`[${config.serviceName}] Error during shutdown:`, err)
        process.exit(1)
      }
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('Failed to start service:', err)
  process.exit(1)
})
