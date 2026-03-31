export abstract class IMessagingConsumerPort {
  abstract start(): Promise<void>;
}
