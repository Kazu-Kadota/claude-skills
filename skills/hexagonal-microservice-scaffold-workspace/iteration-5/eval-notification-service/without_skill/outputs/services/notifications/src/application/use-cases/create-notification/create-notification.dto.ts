import { NotificationStatus, NotificationType } from '../../../domain/notification.entity'

export interface CreateNotificationInput {
  userId: string
  deviceToken: string
  title: string
  body: string
  metadata?: Record<string, unknown>
}

export interface CreateNotificationOutput {
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
