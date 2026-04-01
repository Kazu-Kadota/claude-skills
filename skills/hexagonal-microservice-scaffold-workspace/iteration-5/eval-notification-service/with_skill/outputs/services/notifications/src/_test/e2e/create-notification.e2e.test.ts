// src/_test/e2e/create-notification.e2e.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildTestApp } from './setup.js';

describe('POST /notifications', () => {
  it('returns 201 with the created notification', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/notifications').send({
      userId: 'user-1',
      deviceToken: 'token-abc',
      title: 'Test Notification',
      body: 'Hello from test',
      type: 'push',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(res.body.status).toBe('pending');
    expect(res.body.userId).toBe('user-1');
  });

  it('returns 400 when userId is missing', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/notifications').send({
      deviceToken: 'token-abc',
      title: 'Test',
      body: 'Body',
      type: 'push',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('sends the push notification via the push adapter', async () => {
    const { app, pushAdapter } = buildTestApp();
    await request(app).post('/notifications').send({
      userId: 'user-1',
      deviceToken: 'device-xyz',
      title: 'Push Test',
      body: 'Push body',
      type: 'push',
    });

    expect(pushAdapter.sent).toHaveLength(1);
    expect(pushAdapter.sent[0].deviceToken).toBe('device-xyz');
  });

  it('stores the notification in the write repo', async () => {
    const { app, writeRepo } = buildTestApp();
    await request(app).post('/notifications').send({
      userId: 'user-2',
      deviceToken: 'token-def',
      title: 'Another',
      body: 'Message',
      type: 'push',
    });

    expect(writeRepo.store).toHaveLength(1);
    expect(writeRepo.store[0].userId).toBe('user-2');
  });
});
