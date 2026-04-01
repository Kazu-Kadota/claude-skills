// TDD: Red phase — tests for MarkAsFailedUseCase written before the implementation.

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkAsFailedUseCase } from '../mark-as-failed.js';
import { FakeWriteRepo, FakeEventBus, PassthroughTelemetry } from './doubles.js';
import type { NotificationDTO } from '../../../domain/notification.js';

const pendingNotification: NotificationDTO = {
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

describe('MarkAsFailedUseCase', () => {
  let writeRepo: FakeWriteRepo;
  let eventBus: FakeEventBus;
  let useCase: MarkAsFailedUseCase;

  beforeEach(() => {
    writeRepo = new FakeWriteRepo();
    eventBus = new FakeEventBus();
    useCase = new MarkAsFailedUseCase(writeRepo, eventBus, new PassthroughTelemetry());
  });

  it('updates notification status to failed in the write repository', async () => {
    writeRepo.store.push({ ...pendingNotification });
    await useCase.execute('notif-1', 'FCM rejected token');
    expect(writeRepo.store[0].status).toBe('failed');
  });

  it('publishes notification.failed event with reason', async () => {
    writeRepo.store.push({ ...pendingNotification });
    await useCase.execute('notif-1', 'FCM rejected token');
    expect(eventBus.events).toHaveLength(1);
    expect(eventBus.events[0].topic).toBe('notification.failed');
    expect(eventBus.events[0].message).toMatchObject({
      type: 'notification.failed',
      payload: { notificationId: 'notif-1', reason: 'FCM rejected token' },
    });
  });

  it('throws when notification is not found', async () => {
    await expect(useCase.execute('does-not-exist', 'reason')).rejects.toThrow(
      'Notification not found',
    );
  });

  it('throws when notification is already in a terminal state', async () => {
    writeRepo.store.push({ ...pendingNotification, status: 'failed' });
    await expect(useCase.execute('notif-1', 'another reason')).rejects.toThrow(
      'Cannot transition from terminal state: failed',
    );
  });
});
