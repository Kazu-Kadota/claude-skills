export abstract class IReviewsEventBusPort {
  abstract publish(topic: string, message: object): Promise<void>;
}
