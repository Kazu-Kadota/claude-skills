import { Notification } from './notification.entity'

export interface NotificationRepository {
  save(notification: Notification): Promise<void>
  findById(id: string): Promise<Notification | null>
  findByUserId(userId: string): Promise<Notification[]>
  update(notification: Notification): Promise<void>
}
