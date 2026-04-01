import { describe, it, expect } from 'vitest'
import { Notification } from './notification.entity'

describe('Notification entity', () => {
  const validProps = {
    userId: 'user-123',
    deviceToken: 'device-token-abc',
    title: 'Hello',
    body: 'World',
  }

  describe('create()', () => {
    it('should create a notification with pending status', () => {
      const notification = Notification.create(validProps)
      expect(notification.status).toBe('pending')
      expect(notification.type).toBe('push')
      expect(notification.userId).toBe('user-123')
      expect(notification.deviceToken).toBe('device-token-abc')
      expect(notification.title).toBe('Hello')
      expect(notification.body).toBe('World')
    })

    it('should generate a uuid for id', () => {
      const notification = Notification.create(validProps)
      expect(notification.id).toBeTruthy()
      expect(notification.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    })

    it('should set createdAt and updatedAt to now', () => {
      const before = new Date()
      const notification = Notification.create(validProps)
      const after = new Date()
      expect(notification.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(notification.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should accept optional metadata', () => {
      const notification = Notification.create({
        ...validProps,
        metadata: { orderId: 'order-1' },
      })
      expect(notification.metadata).toEqual({ orderId: 'order-1' })
    })
  })

  describe('markAsSent()', () => {
    it('should transition from pending to sent', () => {
      const notification = Notification.create(validProps)
      notification.markAsSent()
      expect(notification.status).toBe('sent')
    })

    it('should update updatedAt when marking as sent', () => {
      const notification = Notification.create(validProps)
      const originalUpdatedAt = notification.updatedAt

      // Small delay to ensure time difference
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          notification.markAsSent()
          expect(notification.updatedAt.getTime()).toBeGreaterThanOrEqual(
            originalUpdatedAt.getTime(),
          )
          resolve()
        }, 5)
      })
    })

    it('should throw if already sent (terminal state)', () => {
      const notification = Notification.create(validProps)
      notification.markAsSent()
      expect(() => notification.markAsSent()).toThrowError(
        /Cannot transition from 'sent' to 'sent'/,
      )
    })

    it('should throw if already failed (terminal state)', () => {
      const notification = Notification.create(validProps)
      notification.markAsFailed('some reason')
      expect(() => notification.markAsSent()).toThrowError(
        /Cannot transition from 'failed' to 'sent'/,
      )
    })
  })

  describe('markAsFailed()', () => {
    it('should transition from pending to failed', () => {
      const notification = Notification.create(validProps)
      notification.markAsFailed('FCM error')
      expect(notification.status).toBe('failed')
    })

    it('should store the failure reason in metadata', () => {
      const notification = Notification.create(validProps)
      notification.markAsFailed('Token expired')
      expect(notification.metadata?.failureReason).toBe('Token expired')
    })

    it('should preserve existing metadata when failing', () => {
      const notification = Notification.create({
        ...validProps,
        metadata: { orderId: 'order-999' },
      })
      notification.markAsFailed('Network error')
      expect(notification.metadata?.orderId).toBe('order-999')
      expect(notification.metadata?.failureReason).toBe('Network error')
    })

    it('should throw if already failed (terminal state)', () => {
      const notification = Notification.create(validProps)
      notification.markAsFailed('first error')
      expect(() => notification.markAsFailed('second error')).toThrowError(
        /Cannot transition from 'failed' to 'failed'/,
      )
    })

    it('should throw if already sent (terminal state)', () => {
      const notification = Notification.create(validProps)
      notification.markAsSent()
      expect(() => notification.markAsFailed('error')).toThrowError(
        /Cannot transition from 'sent' to 'failed'/,
      )
    })
  })

  describe('reconstitute()', () => {
    it('should reconstitute from plain props', () => {
      const now = new Date()
      const notification = Notification.reconstitute({
        id: 'some-id',
        userId: 'user-1',
        deviceToken: 'token',
        title: 'T',
        body: 'B',
        type: 'push',
        status: 'sent',
        createdAt: now,
        updatedAt: now,
      })
      expect(notification.id).toBe('some-id')
      expect(notification.status).toBe('sent')
    })
  })

  describe('toPlainObject()', () => {
    it('should return a plain representation', () => {
      const notification = Notification.create(validProps)
      const plain = notification.toPlainObject()
      expect(plain.id).toBe(notification.id)
      expect(plain.status).toBe('pending')
      expect(plain.type).toBe('push')
    })
  })
})
