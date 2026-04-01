import { createApp } from './infrastructure/http/express/app'
import { buildContainer } from './infrastructure/container'
import { NotificationKafkaConsumer } from './infrastructure/messaging/kafka/kafka.consumer'
import { disconnectPrisma } from './infrastructure/database/prisma/prisma.client'

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',')
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID ?? 'notifications-service'
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'notifications-service'

async function bootstrap(): Promise<void> {
  // Build dependency container
  const container = buildContainer()

  // Start HTTP server
  const app = createApp(container)
  const server = app.listen(PORT, () => {
    console.log(`Notifications service listening on port ${PORT}`)
  })

  // Start Kafka consumer
  const kafkaConsumer = new NotificationKafkaConsumer(
    {
      brokers: KAFKA_BROKERS,
      groupId: KAFKA_GROUP_ID,
      clientId: KAFKA_CLIENT_ID,
    },
    container.createNotificationUseCase,
  )

  try {
    await kafkaConsumer.start()
  } catch (err) {
    console.warn('Could not connect to Kafka (non-fatal in development):', err)
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down gracefully`)
    await kafkaConsumer.stop().catch(console.error)
    await disconnectPrisma()
    server.close(() => {
      console.log('HTTP server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('Failed to start service:', err)
  process.exit(1)
})
