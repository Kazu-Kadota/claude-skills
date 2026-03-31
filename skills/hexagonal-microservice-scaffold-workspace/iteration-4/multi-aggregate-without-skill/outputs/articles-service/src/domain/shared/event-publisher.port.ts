export interface EventPublisherPort<TEvent = unknown> {
  publish(topic: string, event: TEvent): Promise<void>
}
