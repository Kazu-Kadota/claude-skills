// src/_test/e2e/mark-as-sent.e2e.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildTestApp } from './setup.js';
import type { NotificationDTO } from '../../domain/notification.js';

describe('PUT /notifications/:id/sent', () => {
  it('returns 200 and marks the notification as sent', async () => {
    const { app, writeRepo } = buildTestApp();
    const notif: NotificationDTO = {
      id: 'notif-sent-1',
      userId: 'user-1',
      deviceToken: 'token-abc',
      title: 'Hello',
      body: 'World',
      type: 'push',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    writeRepo.store.push(notif);

    const res = await request(app).put('/notifications/notif-sent-1/sent');
    expect(res.status).toBe(200);
    expect(writeRepo.store[0].status).toBe('sent');
  });

  it('returns 404 when notification does not exist', async () => {
    const { app } = buildTestApp();
    const res = await request(app).put('/notifications/unknown-id/sent');
    expect(res.status).toBe(404);
  });

  it('returns 422 when notification is already in terminal state', async () => {
    const { app, writeRepo } = buildTestApp();
    writeRepo.store.push({
      id: 'notif-already-sent',
      userId: 'user-1',
      deviceToken: 'token',
      title: 'T',
      body: 'B',
      type: 'push',
      status: 'sent',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    const res = await request(app).put('/notifications/notif-already-sent/sent');
    expect(res.status).toBe(422);
  });
});
