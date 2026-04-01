import { Notification } from '../../../../domain/notification.entity'
import { NotificationRepository } from '../../../../domain/notification.repository'

export class InMemoryNotificationRepository implements NotificationRepository {
  private readonly store = new Map<string, Notification>()

  async save(notification: Notification): Promise<void> {
    this.store.set(notification.id, notification)
  }

  async findById(id: string): Promise<Notification | null> {
    return this.store.get(id) ?? null
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.store.values()).filter((n) => n.userId === userId)
  }

  async update(notification: Notification): Promise<void> {
    if (!this.store.has(notification.id)) {
      throw new Error(`Notification '${notification.id}' not found for update`)
    }
    this.store.set(notification.id, notification)
  }

  // Test helper
  all(): Notification[] {
    return Array.from(this.store.values())
  }

  clear(): void {
    this.store.clear()
  }
}
