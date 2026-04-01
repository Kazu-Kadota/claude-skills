import * as admin from 'firebase-admin'
import { PushNotificationPort, PushPayload, PushResult } from '../../../domain/push-notification.port'

export interface FcmConfig {
  projectId: string
  clientEmail: string
  privateKey: string
}

export class FcmPushAdapter extends PushNotificationPort {
  private readonly messaging: admin.messaging.Messaging

  constructor(config: FcmConfig) {
    super()

    // Initialize only if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey.replace(/\\n/g, '\n'),
        }),
      })
    }

    this.messaging = admin.messaging()
  }

  async send(payload: PushPayload): Promise<PushResult> {
    const message: admin.messaging.Message = {
      token: payload.deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    }

    const messageId = await this.messaging.send(message)

    return {
      messageId,
      success: true,
    }
  }
}
