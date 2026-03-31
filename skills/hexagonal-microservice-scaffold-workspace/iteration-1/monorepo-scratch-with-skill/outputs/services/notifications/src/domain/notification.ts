// src/domain/notification.ts

export const NotificationStatus = {
  pending: "pending",
  sent: "sent",
  failed: "failed",
} as const;

export type NotificationStatusType = keyof typeof NotificationStatus;

export const NotificationChannel = {
  email: "email",
  sms: "sms",
} as const;

export type NotificationChannelType = keyof typeof NotificationChannel;

export type NotificationDomain = {
  id: string;
  recipientId: string;
  channel: NotificationChannelType;
  message: string;
  status: NotificationStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type NotificationDTO = NotificationDomain;

export type CreateNotificationParams = {
  recipientId: string;
  channel: NotificationChannelType;
  message: string;
};

export class Notification {
  private constructor(
    public readonly id: string,
    public readonly recipientId: string,
    public readonly channel: NotificationChannelType,
    public readonly message: string,
    private status: NotificationStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  static create(params: CreateNotificationParams): Notification {
    if (!params.recipientId) throw new Error("Must inform recipientId to create Notification");
    if (!params.channel) throw new Error("Must inform channel to create Notification");
    if (!params.message) throw new Error("Must inform message to create Notification");
    if (!NotificationChannel[params.channel]) {
      throw new Error(`Invalid channel: ${params.channel}. Must be one of: email, sms`);
    }

    return new Notification(
      crypto.randomUUID(),
      params.recipientId,
      params.channel,
      params.message,
      NotificationStatus.pending,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  static reconstitute(raw: NotificationDTO): Notification {
    return new Notification(
      raw.id,
      raw.recipientId,
      raw.channel,
      raw.message,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  markSent(): void {
    this.status = NotificationStatus.sent;
    this.updatedAt = new Date().toISOString();
  }

  markFailed(): void {
    this.status = NotificationStatus.failed;
    this.updatedAt = new Date().toISOString();
  }

  toDTO(): NotificationDTO {
    return {
      id: this.id,
      recipientId: this.recipientId,
      channel: this.channel,
      message: this.message,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
