import { randomUUID } from 'crypto'

export type NotificationType = 'push'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface NotificationProps {
  id: string
  userId: string
  deviceToken: string
  title: string
  body: string
  type: NotificationType
  status: NotificationStatus
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface CreateNotificationProps {
  userId: string
  deviceToken: string
  title: string
  body: string
  type?: NotificationType
  metadata?: Record<string, unknown>
}

export class Notification {
  private readonly _id: string
  private readonly _userId: string
  private readonly _deviceToken: string
  private readonly _title: string
  private readonly _body: string
  private readonly _type: NotificationType
  private _status: NotificationStatus
  private _metadata?: Record<string, unknown>
  private readonly _createdAt: Date
  private _updatedAt: Date

  private constructor(props: NotificationProps) {
    this._id = props.id
    this._userId = props.userId
    this._deviceToken = props.deviceToken
    this._title = props.title
    this._body = props.body
    this._type = props.type
    this._status = props.status
    this._metadata = props.metadata
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  static create(props: CreateNotificationProps): Notification {
    const now = new Date()
    return new Notification({
      id: randomUUID(),
      userId: props.userId,
      deviceToken: props.deviceToken,
      title: props.title,
      body: props.body,
      type: props.type ?? 'push',
      status: 'pending',
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: NotificationProps): Notification {
    return new Notification(props)
  }

  markAsSent(): void {
    if (this._status !== 'pending') {
      throw new Error(
        `Cannot transition from '${this._status}' to 'sent'. Only 'pending' notifications can be marked as sent.`,
      )
    }
    this._status = 'sent'
    this._updatedAt = new Date()
  }

  markAsFailed(reason: string): void {
    if (this._status !== 'pending') {
      throw new Error(
        `Cannot transition from '${this._status}' to 'failed'. Only 'pending' notifications can be marked as failed.`,
      )
    }
    this._status = 'failed'
    this._metadata = { ...this._metadata, failureReason: reason }
    this._updatedAt = new Date()
  }

  get id(): string {
    return this._id
  }

  get userId(): string {
    return this._userId
  }

  get deviceToken(): string {
    return this._deviceToken
  }

  get title(): string {
    return this._title
  }

  get body(): string {
    return this._body
  }

  get type(): NotificationType {
    return this._type
  }

  get status(): NotificationStatus {
    return this._status
  }

  get metadata(): Record<string, unknown> | undefined {
    return this._metadata
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  toPlainObject(): NotificationProps {
    return {
      id: this._id,
      userId: this._userId,
      deviceToken: this._deviceToken,
      title: this._title,
      body: this._body,
      type: this._type,
      status: this._status,
      metadata: this._metadata,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
