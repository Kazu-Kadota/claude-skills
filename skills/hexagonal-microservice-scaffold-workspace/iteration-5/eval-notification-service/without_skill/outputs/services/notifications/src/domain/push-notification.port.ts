export interface PushPayload {
  deviceToken: string
  title: string
  body: string
  data?: Record<string, string>
}

export interface PushResult {
  messageId: string
  success: boolean
}

export abstract class PushNotificationPort {
  abstract send(payload: PushPayload): Promise<PushResult>
}
