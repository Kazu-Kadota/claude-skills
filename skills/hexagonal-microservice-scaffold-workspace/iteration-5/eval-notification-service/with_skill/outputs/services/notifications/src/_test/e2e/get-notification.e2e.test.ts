// src/_test/e2e/get-notification.e2e.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildTestApp } from './setup.js';
import type { NotificationDTO } from '../../domain/notification.js';

describe('GET /notifications/:id', () => {
  it('returns 200 with the notification when found', async () => {
    const { app, readRepo } = buildTestApp();
    const notif: NotificationDTO = {
      id: 'notif-e2e-1',
      userId: 'user-1',
      deviceToken: 'token-abc',
      title: 'Hello',
      body: 'World',
      type: 'push',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    readRepo.store.push(notif);

    const res = await request(app).get('/notifications/notif-e2e-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('notif-e2e-1');
    expect(res.body.status).toBe('pending');
  });

  it('returns 404 when notification does not exist', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/notifications/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Notification not found');
  });
});
