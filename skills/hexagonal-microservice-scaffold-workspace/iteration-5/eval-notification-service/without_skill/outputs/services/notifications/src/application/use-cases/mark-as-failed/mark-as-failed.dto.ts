import { NotificationStatus } from '../../../domain/notification.entity'

export interface MarkAsFailedInput {
  id: string
  reason: string
}

export interface MarkAsFailedOutput {
  id: string
  status: NotificationStatus
  updatedAt: Date
}
