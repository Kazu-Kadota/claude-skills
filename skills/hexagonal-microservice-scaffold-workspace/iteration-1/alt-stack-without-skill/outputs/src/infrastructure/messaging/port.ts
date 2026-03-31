// src/infrastructure/messaging/port.ts

export abstract class MessagingConnectionPort {
  abstract connect(): Promise<unknown>;
  abstract close(): Promise<void>;
  abstract getClient(): unknown;
}
