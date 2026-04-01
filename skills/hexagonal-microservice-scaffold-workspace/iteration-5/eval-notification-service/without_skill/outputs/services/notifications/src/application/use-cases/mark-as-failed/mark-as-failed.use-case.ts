import { NotificationRepository } from '../../../domain/notification.repository'
import { NotificationNotFoundError } from '../../../domain/errors/notification-not-found.error'
import { MarkAsFailedInput, MarkAsFailedOutput } from './mark-as-failed.dto'

export class MarkAsFailedUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: MarkAsFailedInput): Promise<MarkAsFailedOutput> {
    const notification = await this.notificationRepository.findById(input.id)

    if (!notification) {
      throw new NotificationNotFoundError(input.id)
    }

    notification.markAsFailed(input.reason)

    await this.notificationRepository.update(notification)

    return {
      id: notification.id,
      status: notification.status,
      updatedAt: notification.updatedAt,
    }
  }
}
