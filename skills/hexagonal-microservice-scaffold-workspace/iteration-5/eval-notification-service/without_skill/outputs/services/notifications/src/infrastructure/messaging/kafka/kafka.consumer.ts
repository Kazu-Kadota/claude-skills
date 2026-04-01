import { Kafka, Consumer, EachMessagePayload } from 'kafkajs'
import { CreateNotificationUseCase } from '../../../application/use-cases/create-notification/create-notification.use-case'

export interface KafkaConfig {
  brokers: string[]
  groupId: string
  clientId: string
}

export interface OrderCreatedEvent {
  orderId: string
  userId: string
  deviceToken: string
  items?: unknown[]
}

export class NotificationKafkaConsumer {
  private readonly kafka: Kafka
  private readonly consumer: Consumer

  constructor(
    private readonly config: KafkaConfig,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
    })
    this.consumer = this.kafka.consumer({ groupId: config.groupId })
  }

  async start(): Promise<void> {
    await this.consumer.connect()

    await this.consumer.subscribe({
      topics: ['order.created'],
      fromBeginning: false,
    })

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload)
      },
    })

    console.log('Kafka consumer started and listening on topics: order.created')
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect()
    console.log('Kafka consumer stopped')
  }

  private async handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
    if (!message.value) return

    try {
      const raw = JSON.parse(message.value.toString())

      if (topic === 'order.created') {
        await this.handleOrderCreated(raw as OrderCreatedEvent)
      }
    } catch (err) {
      console.error(`Error processing message from topic '${topic}':`, err)
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    if (!event.userId || !event.deviceToken) {
      console.warn('order.created event missing userId or deviceToken, skipping notification')
      return
    }

    await this.createNotificationUseCase.execute({
      userId: event.userId,
      deviceToken: event.deviceToken,
      title: 'Order Confirmed',
      body: `Your order ${event.orderId} has been created successfully.`,
      metadata: {
        orderId: event.orderId,
        source: 'order.created',
      },
    })
  }
}
