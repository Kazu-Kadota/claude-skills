// TDD: Red phase — tests for CreateNotificationUseCase written before the implementation.

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateNotificationUseCase } from '../create-notification.js';
import { FakeWriteRepo, FakeEventBus, FakePushAdapter, PassthroughTelemetry } from './doubles.js';

describe('CreateNotificationUseCase', () => {
  let writeRepo: FakeWriteRepo;
  let eventBus: FakeEventBus;
  let pushAdapter: FakePushAdapter;
  let useCase: CreateNotificationUseCase;

  beforeEach(() => {
    writeRepo = new FakeWriteRepo();
    eventBus = new FakeEventBus();
    pushAdapter = new FakePushAdapter();
    useCase = new CreateNotificationUseCase(
      writeRepo,
      eventBus,
      pushAdapter,
      new PassthroughTelemetry(),
    );
  });

  it('persists the notification in the write repository', async () => {
    await useCase.execute({
      userId: 'user-1',
      deviceToken: 'token-abc',
      title: 'Hello',
      body: 'World',
      type: 'push',
    });
    expect(writeRepo.store).toHaveLength(1);
    expect(writeRepo.store[0].userId).toBe('user-1');
    expect(writeRepo.store[0].status).toBe('pending');
  });

  it('returns the created notification DTO', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      deviceToken: 'token-abc',
      title: 'Hello',
      body: 'World',
      type: 'push',
    });
    expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(result.status).toBe('pending');
  });

  it('sends the push notification via the push adapter', async () => {
    await useCase.execute({
      userId: 'user-1',
      deviceToken: 'token-abc',
      title: 'Hello',
      body: 'World',
      type: 'push',
    });
    expect(pushAdapter.sent).toHaveLength(1);
    expect(pushAdapter.sent[0].deviceToken).toBe('token-abc');
    expect(pushAdapter.sent[0].title).toBe('Hello');
    expect(pushAdapter.sent[0].body).toBe('World');
  });

  it('publishes notification.created event with correct payload', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      deviceToken: 'token-abc',
      title: 'Hello',
      body: 'World',
      type: 'push',
    });
    expect(eventBus.events).toHaveLength(1);
    expect(eventBus.events[0].topic).toBe('notification.created');
    expect(eventBus.events[0].message).toMatchObject({
      type: 'notification.created',
      payload: { notificationId: result.id, userId: 'user-1' },
    });
  });

  it('throws domain error when userId is missing', async () => {
    await expect(
      useCase.execute({
        userId: '',
        deviceToken: 'token-abc',
        title: 'Hello',
        body: 'World',
        type: 'push',
      }),
    ).rejects.toThrow('userId is required');
  });
});
