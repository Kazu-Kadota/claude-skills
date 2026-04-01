// TDD: Red phase — tests for MarkAsSentUseCase written before the implementation.

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkAsSentUseCase } from '../mark-as-sent.js';
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

describe('MarkAsSentUseCase', () => {
  let writeRepo: FakeWriteRepo;
  let eventBus: FakeEventBus;
  let useCase: MarkAsSentUseCase;

  beforeEach(() => {
    writeRepo = new FakeWriteRepo();
    eventBus = new FakeEventBus();
    useCase = new MarkAsSentUseCase(writeRepo, eventBus, new PassthroughTelemetry());
  });

  it('updates notification status to sent in the write repository', async () => {
    writeRepo.store.push({ ...pendingNotification });
    await useCase.execute('notif-1');
    expect(writeRepo.store[0].status).toBe('sent');
  });

  it('publishes notification.sent event', async () => {
    writeRepo.store.push({ ...pendingNotification });
    await useCase.execute('notif-1');
    expect(eventBus.events).toHaveLength(1);
    expect(eventBus.events[0].topic).toBe('notification.sent');
    expect(eventBus.events[0].message).toMatchObject({
      type: 'notification.sent',
      payload: { notificationId: 'notif-1' },
    });
  });

  it('throws when notification is not found', async () => {
    await expect(useCase.execute('does-not-exist')).rejects.toThrow('Notification not found');
  });

  it('throws when notification is already in a terminal state', async () => {
    writeRepo.store.push({ ...pendingNotification, status: 'sent' });
    await expect(useCase.execute('notif-1')).rejects.toThrow(
      'Cannot transition from terminal state: sent',
    );
  });
});
