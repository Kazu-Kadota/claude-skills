import { describe, it, expect, beforeEach } from 'vitest'
import { CreateNotificationUseCase } from '../create-notification/create-notification.use-case'
import { InMemoryNotificationRepository } from './doubles/in-memory-notification.repository'
import { StubPushAdapter } from './doubles/stub-push.adapter'

describe('CreateNotificationUseCase', () => {
  let repository: InMemoryNotificationRepository
  let pushAdapter: StubPushAdapter
  let useCase: CreateNotificationUseCase

  beforeEach(() => {
    repository = new InMemoryNotificationRepository()
    pushAdapter = new StubPushAdapter()
    useCase = new CreateNotificationUseCase(repository, pushAdapter)
  })

  it('should create a notification and mark it as sent when push succeeds', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      deviceToken: 'token-abc',
      title: 'Hello',
      body: 'World',
    })

    expect(result.id).toBeTruthy()
    expect(result.status).toBe('sent')
    expect(result.userId).toBe('user-1')
    expect(result.title).toBe('Hello')
    expect(result.body).toBe('World')
    expect(result.type).toBe('push')
  })

  it('should persist the notification in the repository', async () => {
    const result = await useCase.execute({
      userId: 'user-2',
      deviceToken: 'token-xyz',
      title: 'Test',
      body: 'Body',
    })

    const saved = await repository.findById(result.id)
    expect(saved).not.toBeNull()
    expect(saved!.status).toBe('sent')
  })

  it('should call pushAdapter.send() with correct payload', async () => {
    await useCase.execute({
      userId: 'user-3',
      deviceToken: 'device-999',
      title: 'Push Title',
      body: 'Push Body',
    })

    expect(pushAdapter.calls).toHaveLength(1)
    expect(pushAdapter.calls[0].deviceToken).toBe('device-999')
    expect(pushAdapter.calls[0].title).toBe('Push Title')
    expect(pushAdapter.calls[0].body).toBe('Push Body')
  })

  it('should mark notification as failed when push throws', async () => {
    pushAdapter.shouldFail = true
    pushAdapter.failureMessage = 'FCM unavailable'

    const result = await useCase.execute({
      userId: 'user-4',
      deviceToken: 'bad-token',
      title: 'Title',
      body: 'Body',
    })

    expect(result.status).toBe('failed')
    expect(result.metadata?.failureReason).toBe('FCM unavailable')
  })

  it('should pass metadata to push adapter as string key-value', async () => {
    await useCase.execute({
      userId: 'user-5',
      deviceToken: 'token',
      title: 'Title',
      body: 'Body',
      metadata: { orderId: 'order-42', count: 3 },
    })

    expect(pushAdapter.calls[0].data).toEqual({ orderId: 'order-42', count: '3' })
  })
})
