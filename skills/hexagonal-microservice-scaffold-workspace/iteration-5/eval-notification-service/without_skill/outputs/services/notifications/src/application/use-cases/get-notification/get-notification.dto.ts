import { NotificationStatus, NotificationType } from '../../../domain/notification.entity'

export interface GetNotificationInput {
  id: string
}

export interface GetNotificationOutput {
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
