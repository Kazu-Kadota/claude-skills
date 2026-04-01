import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { Application } from 'express'
import { createApp } from '../app'
import { CreateNotificationUseCase } from '../../../../application/use-cases/create-notification/create-notification.use-case'
import { GetNotificationUseCase } from '../../../../application/use-cases/get-notification/get-notification.use-case'
import { MarkAsSentUseCase } from '../../../../application/use-cases/mark-as-sent/mark-as-sent.use-case'
import { MarkAsFailedUseCase } from '../../../../application/use-cases/mark-as-failed/mark-as-failed.use-case'
import { InMemoryNotificationRepository } from '../../../database/in-memory/in-memory-notification.repository'
import { StubPushAdapter } from '../../../../application/use-cases/__tests__/doubles/stub-push.adapter'

describe('Notifications HTTP E2E', () => {
  let app: Application
  let repository: InMemoryNotificationRepository
  let pushAdapter: StubPushAdapter

  beforeAll(() => {
    repository = new InMemoryNotificationRepository()
    pushAdapter = new StubPushAdapter()

    const createNotificationUseCase = new CreateNotificationUseCase(repository, pushAdapter)
    const getNotificationUseCase = new GetNotificationUseCase(repository)
    const markAsSentUseCase = new MarkAsSentUseCase(repository)
    const markAsFailedUseCase = new MarkAsFailedUseCase(repository)

    app = createApp({
      createNotificationUseCase,
      getNotificationUseCase,
      markAsSentUseCase,
      markAsFailedUseCase,
    })
  })

  beforeEach(() => {
    repository.clear()
    pushAdapter.reset()
  })

  describe('GET /health', () => {
    it('should return 200 ok', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })
  })

  describe('POST /notifications', () => {
    it('should create a notification and return 201', async () => {
      const res = await request(app).post('/notifications').send({
        userId: 'user-1',
        deviceToken: 'device-abc',
        title: 'Hello',
        body: 'World',
      })

      expect(res.status).toBe(201)
      expect(res.body.id).toBeTruthy()
      expect(res.body.userId).toBe('user-1')
      expect(res.body.status).toBe('sent')
      expect(res.body.type).toBe('push')
    })

    it('should mark as failed when push adapter fails', async () => {
      pushAdapter.shouldFail = true
      pushAdapter.failureMessage = 'FCM error'

      const res = await request(app).post('/notifications').send({
        userId: 'user-2',
        deviceToken: 'device-xyz',
        title: 'Fail Test',
        body: 'Body',
      })

      expect(res.status).toBe(201)
      expect(res.body.status).toBe('failed')
      expect(res.body.metadata.failureReason).toBe('FCM error')
    })
  })

  describe('GET /notifications/:id', () => {
    it('should return a notification by id', async () => {
      const createRes = await request(app).post('/notifications').send({
        userId: 'user-3',
        deviceToken: 'device-yyy',
        title: 'Get Test',
        body: 'Body',
      })

      const { id } = createRes.body

      const getRes = await request(app).get(`/notifications/${id}`)
      expect(getRes.status).toBe(200)
      expect(getRes.body.id).toBe(id)
      expect(getRes.body.title).toBe('Get Test')
    })

    it('should return 404 for unknown id', async () => {
      const res = await request(app).get('/notifications/non-existent-id')
      expect(res.status).toBe(404)
      expect(res.body.error).toContain('non-existent-id')
    })
  })

  describe('PATCH /notifications/:id/sent', () => {
    it('should mark a pending notification as sent', async () => {
      // Create via repository directly to keep it pending
      const { Notification } = await import('../../../../domain/notification.entity')
      const notification = Notification.create({
        userId: 'u',
        deviceToken: 't',
        title: 'T',
        body: 'B',
      })
      await repository.save(notification)

      const res = await request(app).patch(`/notifications/${notification.id}/sent`)
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('sent')
    })

    it('should return 422 when trying to re-transition a terminal state', async () => {
      const createRes = await request(app).post('/notifications').send({
        userId: 'user-4',
        deviceToken: 'd',
        title: 'T',
        body: 'B',
      })

      // Already 'sent' from create
      const res = await request(app).patch(`/notifications/${createRes.body.id}/sent`)
      expect(res.status).toBe(422)
    })

    it('should return 404 for unknown id', async () => {
      const res = await request(app).patch('/notifications/no-such-id/sent')
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /notifications/:id/failed', () => {
    it('should mark a pending notification as failed', async () => {
      const { Notification } = await import('../../../../domain/notification.entity')
      const notification = Notification.create({
        userId: 'u',
        deviceToken: 't',
        title: 'T',
        body: 'B',
      })
      await repository.save(notification)

      const res = await request(app)
        .patch(`/notifications/${notification.id}/failed`)
        .send({ reason: 'Token expired' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('failed')
    })

    it('should return 404 for unknown id', async () => {
      const res = await request(app)
        .patch('/notifications/ghost-id/failed')
        .send({ reason: 'reason' })
      expect(res.status).toBe(404)
    })
  })
})
