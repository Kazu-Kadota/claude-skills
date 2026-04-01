import { describe, it, expect, beforeEach } from 'vitest'
import { GetNotificationUseCase } from '../get-notification/get-notification.use-case'
import { InMemoryNotificationRepository } from './doubles/in-memory-notification.repository'
import { Notification } from '../../../domain/notification.entity'
import { NotificationNotFoundError } from '../../../domain/errors/notification-not-found.error'

describe('GetNotificationUseCase', () => {
  let repository: InMemoryNotificationRepository
  let useCase: GetNotificationUseCase

  beforeEach(() => {
    repository = new InMemoryNotificationRepository()
    useCase = new GetNotificationUseCase(repository)
  })

  it('should return a notification by id', async () => {
    const notification = Notification.create({
      userId: 'user-1',
      deviceToken: 'token',
      title: 'Hello',
      body: 'World',
    })
    await repository.save(notification)

    const result = await useCase.execute({ id: notification.id })

    expect(result.id).toBe(notification.id)
    expect(result.userId).toBe('user-1')
    expect(result.status).toBe('pending')
  })

  it('should throw NotificationNotFoundError when id does not exist', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      NotificationNotFoundError,
    )
  })

  it('should throw with the correct message', async () => {
    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(
      "Notification with id 'missing' was not found.",
    )
  })
})
