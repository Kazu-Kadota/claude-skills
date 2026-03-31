import { Kafka, Producer, KafkaConfig } from 'kafkajs'

export class KafkaClient {
  private static instance: KafkaClient
  private kafka: Kafka
  private producer: Producer

  private constructor(config: KafkaConfig) {
    this.kafka = new Kafka(config)
    this.producer = this.kafka.producer()
  }

  static getInstance(config?: KafkaConfig): KafkaClient {
    if (!KafkaClient.instance) {
      if (!config) {
        throw new Error('KafkaClient requires config on first instantiation')
      }
      KafkaClient.instance = new KafkaClient(config)
    }
    return KafkaClient.instance
  }

  getProducer(): Producer {
    return this.producer
  }

  async connect(): Promise<void> {
    await this.producer.connect()
    console.log('Kafka producer connected successfully')
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect()
    console.log('Kafka producer disconnected')
  }
}
