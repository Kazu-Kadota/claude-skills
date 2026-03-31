export abstract class INotificationsEventBusPort {
  abstract publish(topic: string, message: object): Promise<void>;
}
