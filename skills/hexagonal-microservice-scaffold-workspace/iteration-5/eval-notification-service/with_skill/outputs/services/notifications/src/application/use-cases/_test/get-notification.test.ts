// TDD: Red phase — tests for GetNotificationUseCase written before the implementation.

import { describe, it, expect, beforeEach } from 'vitest';
import { GetNotificationUseCase } from '../get-notification.js';
import { FakeReadRepo, PassthroughTelemetry } from './doubles.js';
import type { NotificationDTO } from '../../../domain/notification.js';

const sampleNotification: NotificationDTO = {
  id: 'notif-1',
  userId: 'user-1',
  deviceToken: 'token-abc',
  title: 'Hello',
  body: 'World',
  type: 'push',
  status: 'pending',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('GetNotificationUseCase', () => {
  let readRepo: FakeReadRepo;
  let useCase: GetNotificationUseCase;

  beforeEach(() => {
    readRepo = new FakeReadRepo();
    useCase = new GetNotificationUseCase(readRepo, new PassthroughTelemetry());
  });

  it('returns the notification from the read repository when found', async () => {
    readRepo.store.push(sampleNotification);
    const result = await useCase.execute('notif-1');
    expect(result.id).toBe('notif-1');
    expect(result.userId).toBe('user-1');
  });

  it('throws when notification is not found', async () => {
    await expect(useCase.execute('not-found')).rejects.toThrow('Notification not found');
  });
});
