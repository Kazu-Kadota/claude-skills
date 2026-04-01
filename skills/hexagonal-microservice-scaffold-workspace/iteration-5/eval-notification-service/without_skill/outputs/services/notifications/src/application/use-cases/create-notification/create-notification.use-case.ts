import { Notification } from '../../../domain/notification.entity'
import { NotificationRepository } from '../../../domain/notification.repository'
import { PushNotificationPort } from '../../../domain/push-notification.port'
import {
  CreateNotificationInput,
  CreateNotificationOutput,
} from './create-notification.dto'

export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly pushPort: PushNotificationPort,
  ) {}

  async execute(input: CreateNotificationInput): Promise<CreateNotificationOutput> {
    const notification = Notification.create({
      userId: input.userId,
      deviceToken: input.deviceToken,
      title: input.title,
      body: input.body,
      type: 'push',
      metadata: input.metadata,
    })

    await this.notificationRepository.save(notification)

    try {
      await this.pushPort.send({
        deviceToken: notification.deviceToken,
        title: notification.title,
        body: notification.body,
        data: input.metadata
          ? Object.fromEntries(
              Object.entries(input.metadata).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
      })

      notification.markAsSent()
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown push error'
      notification.markAsFailed(reason)
    }

    await this.notificationRepository.update(notification)

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
