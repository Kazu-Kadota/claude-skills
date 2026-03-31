// src/adapters/inbound/http/express/bootstrap.ts
// Composition root — connects all infrastructure, wires use cases, starts the server

import express from 'express'
import { config } from '../../../../infrastructure/config.js'
import { OrderDTO } from '../../../../domain/order.js'
import { MongoConnection } from '../../../../infrastructure/database/mongodb/connection.js'
import { PostgresConnection } from '../../../../infrastructure/database/postgres/connection.js'
import { RedisConnection } from '../../../../infrastructure/cache/redis/connection.js'
import { KafkaConnection } from '../../../../infrastructure/messaging/kafka/connection.js'
import { MongoOrderRepositoryRead } from '../../../outbound/database/mongodb/read.js'
import { PostgresOrderRepositoryWrite } from '../../../outbound/database/postgres/write.js'
import { RedisOrderCache } from '../../../outbound/cache/redis/order-cache.js'
import { KafkaEventBus } from '../../../outbound/messaging/kafka/event-bus.js'
import { OTelTelemetry } from '../../../outbound/telemetry/otel/otel-telemetry.js'
import { CreateOrderUseCase } from '../../../../application/use-cases/create-order.js'
import { GetOrderUseCase } from '../../../../application/use-cases/get-order.js'
import { CancelOrderUseCase } from '../../../../application/use-cases/cancel-order.js'
import { DeleteOrderUseCase } from '../../../../application/use-cases/delete-order.js'
import { OrderController } from './order-controller.js'
import { errorHandler } from './error-handler.js'

export async function bootstrapExpress(): Promise<void> {
  // --- Infrastructure connections ---
  const postgresWriteConnection = new PostgresConnection(
    `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/orders`,
  )
  await postgresWriteConnection.connect()

  const mongoReadConnection = new MongoConnection(config.database.read.uri, 'orders')
  await mongoReadConnection.connect()

  const redisConnection = new RedisConnection(config.cache.redis.url)
  const redis = redisConnection.connect()

  const kafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-orders`,
    config.messaging.kafka.brokers,
  )
  await kafkaConnection.connect()
  const producer = await kafkaConnection.producer()

  // --- Outbound adapters ---
  const writeRepository = new PostgresOrderRepositoryWrite(postgresWriteConnection.getClient())
  const readRepository = new MongoOrderRepositoryRead(
    mongoReadConnection.getClient().collection<OrderDTO>('orders'),
  )
  const cache = new RedisOrderCache(redis)
  const eventBus = new KafkaEventBus(producer)
  const telemetry = new OTelTelemetry()

  // --- Use cases ---
  const createOrderUseCase = new CreateOrderUseCase(writeRepository, cache, eventBus, telemetry)
  const getOrderUseCase = new GetOrderUseCase(readRepository, cache, telemetry)
  const cancelOrderUseCase = new CancelOrderUseCase(
    readRepository,
    writeRepository,
    cache,
    eventBus,
    telemetry,
  )
  const deleteOrderUseCase = new DeleteOrderUseCase(writeRepository, cache, eventBus, telemetry)

  // --- Controller ---
  const controller = new OrderController(
    createOrderUseCase,
    getOrderUseCase,
    cancelOrderUseCase,
    deleteOrderUseCase,
  )

  // --- Express app ---
  const app = express()
  app.use(express.json())
  app.use('/orders', controller.buildRouter())

  // Error handler must be registered AFTER all routes
  app.use(errorHandler)

  const server = app.listen(config.app.port, () => {
    console.log(`${config.app.name} service on :${config.app.port}`)
  })

  // --- Graceful shutdown ---
  let shuttingDown = false

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`Received ${signal}. Starting graceful shutdown...`)

    server.close(async (serverError) => {
      if (serverError) console.error('Error while closing HTTP server:', serverError)

      const results = await Promise.allSettled([
        postgresWriteConnection.close(),
        mongoReadConnection.close(),
        redisConnection.close(),
        kafkaConnection.close(),
      ])

      for (const result of results) {
        if (result.status === 'rejected') console.error('Shutdown error:', result.reason)
      }

      console.log('Graceful shutdown completed.')
      process.exit(serverError ? 1 : 0)
    })

    setTimeout(() => {
      console.error('Forced shutdown after timeout.')
      process.exit(1)
    }, 10_000).unref()
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}
