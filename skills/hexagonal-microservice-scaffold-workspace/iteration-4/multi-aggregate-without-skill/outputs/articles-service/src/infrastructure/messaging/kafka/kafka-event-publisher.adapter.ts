import { Producer } from 'kafkajs'
import { EventPublisherPort } from '../../../domain/shared'
import { ArticleDomainEvent } from '../../../domain/article/article.events'

export class KafkaEventPublisherAdapter implements EventPublisherPort<ArticleDomainEvent> {
  constructor(private readonly producer: Producer) {}

  async publish(topic: string, event: ArticleDomainEvent): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: event.payload.articleId,
          value: JSON.stringify(event),
          headers: {
            eventType: event.eventType,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    })
  }
}
