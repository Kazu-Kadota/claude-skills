// src/infrastructure/messaging/port.ts

export abstract class MessagingConnectionPort {
  abstract connect(): unknown;
  abstract close(): Promise<void>;
  abstract getClient(): unknown;
}
