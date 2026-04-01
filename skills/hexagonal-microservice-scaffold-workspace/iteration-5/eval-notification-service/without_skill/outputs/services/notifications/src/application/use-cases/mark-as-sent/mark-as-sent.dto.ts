import { NotificationStatus } from '../../../domain/notification.entity'

export interface MarkAsSentInput {
  id: string
}

export interface MarkAsSentOutput {
  id: string
  status: NotificationStatus
  updatedAt: Date
}
