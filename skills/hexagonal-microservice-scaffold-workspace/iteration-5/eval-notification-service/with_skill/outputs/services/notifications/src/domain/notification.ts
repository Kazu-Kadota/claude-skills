// src/domain/notification.ts
// Pure domain entity — zero external imports.

export const NotificationStatus = {
  pending: 'pending',
  sent: 'sent',
  failed: 'failed',
} as const;

export type NotificationStatusType = keyof typeof NotificationStatus;

export const NotificationType = {
  push: 'push',
} as const;

export type NotificationTypeType = keyof typeof NotificationType;

export type NotificationDomain = {
  id: string;
  userId: string;
  deviceToken: string;
  title: string;
  body: string;
  type: NotificationTypeType;
  status: NotificationStatusType;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type NotificationDTO = NotificationDomain;

export type CreateNotificationParams = {
  userId: string;
  deviceToken: string;
  title: string;
  body: string;
  type: NotificationTypeType;
  metadata?: Record<string, unknown>;
};

const TERMINAL_STATES: NotificationStatusType[] = [
  NotificationStatus.sent,
  NotificationStatus.failed,
];

export class Notification {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly deviceToken: string,
    public readonly title: string,
    public readonly body: string,
    public readonly type: NotificationTypeType,
    private status: NotificationStatusType,
    private readonly metadata: Record<string, unknown> | undefined,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  static create(params: CreateNotificationParams): Notification {
    if (!params.userId) throw new Error('userId is required');
    if (!params.deviceToken) throw new Error('deviceToken is required');
    if (!params.title) throw new Error('title is required');
    if (!params.body) throw new Error('body is required');

    return new Notification(
      crypto.randomUUID(),
      params.userId,
      params.deviceToken,
      params.title,
      params.body,
      params.type,
      NotificationStatus.pending,
      params.metadata,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  static reconstitute(raw: NotificationDTO): Notification {
    return new Notification(
      raw.id,
      raw.userId,
      raw.deviceToken,
      raw.title,
      raw.body,
      raw.type,
      raw.status,
      raw.metadata,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  private assertNotTerminal(): void {
    if (TERMINAL_STATES.includes(this.status)) {
      throw new Error(`Cannot transition from terminal state: ${this.status}`);
    }
  }

  markAsSent(): void {
    this.assertNotTerminal();
    this.status = NotificationStatus.sent;
    this.updatedAt = new Date().toISOString();
  }

  markAsFailed(_reason: string): void {
    this.assertNotTerminal();
    this.status = NotificationStatus.failed;
    this.updatedAt = new Date().toISOString();
  }

  toDTO(): NotificationDTO {
    return {
      id: this.id,
      userId: this.userId,
      deviceToken: this.deviceToken,
      title: this.title,
      body: this.body,
      type: this.type,
      status: this.status,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
