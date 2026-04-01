import { describe, it, expect, beforeEach } from 'vitest'
import { MarkAsSentUseCase } from '../mark-as-sent/mark-as-sent.use-case'
import { InMemoryNotificationRepository } from './doubles/in-memory-notification.repository'
import { Notification } from '../../../domain/notification.entity'
import { NotificationNotFoundError } from '../../../domain/errors/notification-not-found.error'

describe('MarkAsSentUseCase', () => {
  let repository: InMemoryNotificationRepository
  let useCase: MarkAsSentUseCase

  beforeEach(() => {
    repository = new InMemoryNotificationRepository()
    useCase = new MarkAsSentUseCase(repository)
  })

  it('should mark a pending notification as sent', async () => {
    const notification = Notification.create({
      userId: 'user-1',
      deviceToken: 'token',
      title: 'Hello',
      body: 'World',
    })
    await repository.save(notification)

    const result = await useCase.execute({ id: notification.id })

    expect(result.status).toBe('sent')
    expect(result.id).toBe(notification.id)
  })

  it('should persist the status change', async () => {
    const notification = Notification.create({
      userId: 'user-1',
      deviceToken: 'token',
      title: 'T',
      body: 'B',
    })
    await repository.save(notification)

    await useCase.execute({ id: notification.id })

    const updated = await repository.findById(notification.id)
    expect(updated!.status).toBe('sent')
  })

  it('should throw NotificationNotFoundError for unknown id', async () => {
    await expect(useCase.execute({ id: 'unknown' })).rejects.toThrow(NotificationNotFoundError)
  })

  it('should throw when trying to mark already-sent as sent', async () => {
    const notification = Notification.create({
      userId: 'u',
      deviceToken: 't',
      title: 'T',
      body: 'B',
    })
    notification.markAsSent()
    await repository.save(notification)

    await expect(useCase.execute({ id: notification.id })).rejects.toThrow(
      /Cannot transition from 'sent' to 'sent'/,
    )
  })
})
