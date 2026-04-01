import { NotificationRepository } from '../../../domain/notification.repository'
import { NotificationNotFoundError } from '../../../domain/errors/notification-not-found.error'
import { MarkAsSentInput, MarkAsSentOutput } from './mark-as-sent.dto'

export class MarkAsSentUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: MarkAsSentInput): Promise<MarkAsSentOutput> {
    const notification = await this.notificationRepository.findById(input.id)

    if (!notification) {
      throw new NotificationNotFoundError(input.id)
    }

    notification.markAsSent()

    await this.notificationRepository.update(notification)

    return {
      id: notification.id,
      status: notification.status,
      updatedAt: notification.updatedAt,
    }
  }
}
