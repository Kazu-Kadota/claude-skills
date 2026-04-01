// TDD: Red phase — these tests define the expected behavior of the Notification domain entity.
// They are written BEFORE the implementation in src/domain/notification.ts.

import { describe, it, expect } from 'vitest'
import { Notification, NotificationStatus } from '../notification.js'

const validCreateInput = {
  userId: 'user-123',
  deviceToken: 'device-token-abc',
  title: 'Order Update',
  body: 'Your order has been confirmed.',
  type: 'push' as const,
}

describe('Notification.create()', () => {
  it('creates a notification with pending status and a generated id', () => {
    const dto = Notification.create(validCreateInput).toDTO()
    expect(dto.status).toBe(NotificationStatus.pending)
    expect(dto.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('sets all provided fields correctly', () => {
    const dto = Notification.create(validCreateInput).toDTO()
    expect(dto.userId).toBe('user-123')
    expect(dto.deviceToken).toBe('device-token-abc')
    expect(dto.title).toBe('Order Update')
    expect(dto.body).toBe('Your order has been confirmed.')
    expect(dto.type).toBe('push')
  })

  it('sets createdAt and updatedAt to ISO strings', () => {
    const dto = Notification.create(validCreateInput).toDTO()
    expect(typeof dto.createdAt).toBe('string')
    expect(typeof dto.updatedAt).toBe('string')
  })

  it('allows optional metadata', () => {
    const dto = Notification.create({ ...validCreateInput, metadata: { orderId: '42' } }).toDTO()
    expect(dto.metadata).toEqual({ orderId: '42' })
  })

  it('metadata defaults to undefined when not provided', () => {
    const dto = Notification.create(validCreateInput).toDTO()
    expect(dto.metadata).toBeUndefined()
  })

  it('throws when userId is empty', () => {
    expect(() => Notification.create({ ...validCreateInput, userId: '' }))
      .toThrow('userId is required')
  })

  it('throws when deviceToken is empty', () => {
    expect(() => Notification.create({ ...validCreateInput, deviceToken: '' }))
      .toThrow('deviceToken is required')
  })

  it('throws when title is empty', () => {
    expect(() => Notification.create({ ...validCreateInput, title: '' }))
      .toThrow('title is required')
  })

  it('throws when body is empty', () => {
    expect(() => Notification.create({ ...validCreateInput, body: '' }))
      .toThrow('body is required')
  })
})

describe('Notification.markAsSent()', () => {
  it('transitions from pending to sent', () => {
    const notification = Notification.create(validCreateInput)
    notification.markAsSent()
    expect(notification.toDTO().status).toBe(NotificationStatus.sent)
  })

  it('updates updatedAt on transition', () => {
    const notification = Notification.create(validCreateInput)
    const originalUpdatedAt = notification.toDTO().updatedAt
    notification.markAsSent()
    expect(notification.toDTO().updatedAt).not.toBe(originalUpdatedAt)
  })

  it('throws when already sent (terminal state)', () => {
    const notification = Notification.reconstitute({
      id: 'n-1',
      ...validCreateInput,
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(() => notification.markAsSent()).toThrow('Cannot transition from terminal state: sent')
  })

  it('throws when already failed (terminal state)', () => {
    const notification = Notification.reconstitute({
      id: 'n-1',
      ...validCreateInput,
      status: 'failed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(() => notification.markAsSent()).toThrow('Cannot transition from terminal state: failed')
  })
})

describe('Notification.markAsFailed()', () => {
  it('transitions from pending to failed', () => {
    const notification = Notification.create(validCreateInput)
    notification.markAsFailed('FCM delivery error')
    expect(notification.toDTO().status).toBe(NotificationStatus.failed)
  })

  it('updates updatedAt on transition', () => {
    const notification = Notification.create(validCreateInput)
    const originalUpdatedAt = notification.toDTO().updatedAt
    notification.markAsFailed('error')
    expect(notification.toDTO().updatedAt).not.toBe(originalUpdatedAt)
  })

  it('throws when already sent (terminal state)', () => {
    const notification = Notification.reconstitute({
      id: 'n-1',
      ...validCreateInput,
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(() => notification.markAsFailed('reason')).toThrow('Cannot transition from terminal state: sent')
  })

  it('throws when already failed (terminal state)', () => {
    const notification = Notification.reconstitute({
      id: 'n-1',
      ...validCreateInput,
      status: 'failed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(() => notification.markAsFailed('reason')).toThrow('Cannot transition from terminal state: failed')
  })
})

describe('Notification.reconstitute() → toDTO()', () => {
  it('round-trips without mutation', () => {
    const raw = {
      id: 'n-abc',
      userId: 'user-1',
      deviceToken: 'token-xyz',
      title: 'Hello',
      body: 'World',
      type: 'push' as const,
      status: 'pending' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    const dto = Notification.reconstitute(raw).toDTO()
    expect(dto.id).toBe('n-abc')
    expect(dto.userId).toBe('user-1')
    expect(dto.deviceToken).toBe('token-xyz')
    expect(dto.title).toBe('Hello')
    expect(dto.body).toBe('World')
    expect(dto.status).toBe('pending')
  })

  it('preserves optional metadata', () => {
    const raw = {
      id: 'n-abc',
      userId: 'user-1',
      deviceToken: 'token-xyz',
      title: 'Hello',
      body: 'World',
      type: 'push' as const,
      status: 'sent' as const,
      metadata: { key: 'value' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    const dto = Notification.reconstitute(raw).toDTO()
    expect(dto.metadata).toEqual({ key: 'value' })
  })
})
