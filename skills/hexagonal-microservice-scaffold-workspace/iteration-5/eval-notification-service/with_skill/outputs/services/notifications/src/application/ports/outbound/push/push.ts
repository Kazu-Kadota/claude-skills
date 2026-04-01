// src/application/ports/outbound/push/push.ts
// Port for sending push notifications to devices (e.g., via FCM).

export abstract class INotificationPushPort {
  abstract send(deviceToken: string, title: string, body: string): Promise<void>;
}
