import { PushNotificationPort, PushPayload, PushResult } from '../../../../domain/push-notification.port'

export class StubPushAdapter extends PushNotificationPort {
  public calls: PushPayload[] = []
  public shouldFail = false
  public failureMessage = 'Stub push failure'

  async send(payload: PushPayload): Promise<PushResult> {
    this.calls.push(payload)

    if (this.shouldFail) {
      throw new Error(this.failureMessage)
    }

    return {
      messageId: `stub-msg-${Date.now()}`,
      success: true,
    }
  }

  reset(): void {
    this.calls = []
    this.shouldFail = false
  }
}
