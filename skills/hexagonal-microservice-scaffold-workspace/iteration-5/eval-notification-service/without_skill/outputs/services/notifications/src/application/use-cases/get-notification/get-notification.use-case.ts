import { NotificationRepository } from '../../../domain/notification.repository'
import { NotificationNotFoundError } from '../../../domain/errors/notification-not-found.error'
import { GetNotificationInput, GetNotificationOutput } from './get-notification.dto'

export class GetNotificationUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: GetNotificationInput): Promise<GetNotificationOutput> {
    const notification = await this.notificationRepository.findById(input.id)

    if (!notification) {
      throw new NotificationNotFoundError(input.id)
    }

    return {
      id: notification.id,
      userId: notification.userId,
      deviceToken: notification.deviceToken,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      status: notification.status,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }
  }
}
