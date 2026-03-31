import { Consumer, Kafka, Producer } from "kafkajs";
import { MessagingConnectionPort } from "../port.js";

export class KafkaConnection implements MessagingConnectionPort {
  private client: Kafka | null = null;
  private connectedProducer: Producer | null = null;
  private connectedConsumers: Consumer[] = [];

  constructor(
    private readonly clientId: string,
    private readonly brokers: string[],
  ) {}

  async connect(): Promise<Kafka> {
    if (this.client) return this.client;
    this.client = new Kafka({ brokers: this.brokers, clientId: this.clientId });
    return this.client;
  }

  async close(): Promise<void> {
    if (!this.client) return;
    const ops: Promise<unknown>[] = [];
    if (this.connectedProducer) {
      ops.push(this.connectedProducer.disconnect());
      this.connectedProducer = null;
    }
    if (this.connectedConsumers.length) {
      ops.push(...this.connectedConsumers.map((c) => c.disconnect()));
      this.connectedConsumers = [];
    }
    await Promise.allSettled(ops);
    this.client = null;
  }

  getClient(): Kafka {
    if (!this.client) throw new Error("Kafka Client is not set");
    return this.client;
  }

  async producer(): Promise<Producer> {
    if (!this.client) throw new Error("KafkaConnection is not connected");
    if (this.connectedProducer) return this.connectedProducer;
    const producer = this.client.producer();
    await producer.connect();
    this.connectedProducer = producer;
    return producer;
  }

  async consumer(name: string): Promise<Consumer> {
    if (!this.client) throw new Error("KafkaConnection is not connected");
    const consumer = this.client.consumer({ groupId: `${this.clientId}-${name}` });
    await consumer.connect();
    this.connectedConsumers.push(consumer);
    return consumer;
  }
}
