import { describe, it, expect, beforeEach } from 'vitest'
import { MarkAsFailedUseCase } from '../mark-as-failed/mark-as-failed.use-case'
import { InMemoryNotificationRepository } from './doubles/in-memory-notification.repository'
import { Notification } from '../../../domain/notification.entity'
import { NotificationNotFoundError } from '../../../domain/errors/notification-not-found.error'

describe('MarkAsFailedUseCase', () => {
  let repository: InMemoryNotificationRepository
  let useCase: MarkAsFailedUseCase

  beforeEach(() => {
    repository = new InMemoryNotificationRepository()
    useCase = new MarkAsFailedUseCase(repository)
  })

  it('should mark a pending notification as failed', async () => {
    const notification = Notification.create({
      userId: 'user-1',
      deviceToken: 'token',
      title: 'Hello',
      body: 'World',
    })
    await repository.save(notification)

    const result = await useCase.execute({ id: notification.id, reason: 'Device not found' })

    expect(result.status).toBe('failed')
    expect(result.id).toBe(notification.id)
  })

  it('should persist the status and failure reason', async () => {
    const notification = Notification.create({
      userId: 'u',
      deviceToken: 't',
      title: 'T',
      body: 'B',
    })
    await repository.save(notification)

    await useCase.execute({ id: notification.id, reason: 'Token revoked' })

    const updated = await repository.findById(notification.id)
    expect(updated!.status).toBe('failed')
    expect(updated!.metadata?.failureReason).toBe('Token revoked')
  })

  it('should throw NotificationNotFoundError for unknown id', async () => {
    await expect(
      useCase.execute({ id: 'ghost', reason: 'reason' }),
    ).rejects.toThrow(NotificationNotFoundError)
  })

  it('should throw when trying to fail an already-failed notification', async () => {
    const notification = Notification.create({
      userId: 'u',
      deviceToken: 't',
      title: 'T',
      body: 'B',
    })
    notification.markAsFailed('first')
    await repository.save(notification)

    await expect(
      useCase.execute({ id: notification.id, reason: 'second' }),
    ).rejects.toThrow(/Cannot transition from 'failed' to 'failed'/)
  })
})
