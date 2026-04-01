// src/adapters/outbound/push/fcm/fcm-push-adapter.ts
// Implements INotificationPushPort using Firebase Cloud Messaging (Admin SDK).
import type { App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { INotificationPushPort } from '../../../../application/ports/outbound/push/push.js';

export class FcmPushAdapter implements INotificationPushPort {
  constructor(private readonly firebaseApp: App) {}

  async send(deviceToken: string, title: string, body: string): Promise<void> {
    const messaging = getMessaging(this.firebaseApp);
    await messaging.send({
      token: deviceToken,
      notification: {
        title,
        body,
      },
    });
  }
}
