// shared/events/contracts.ts
// Shared event type contracts for cross-service type safety.

// Published by: orders service
export type OrderCreatedEvent = {
  type: 'order.created';
  payload: {
    orderId: string;
    customerId: string;
    userId: string;
    deviceToken: string;
    amount: number;
    currency: string;
    idempotencyKey: string;
  };
};

// Published by: notifications service
export type NotificationCreatedEvent = {
  type: 'notification.created';
  payload: {
    notificationId: string;
    userId: string;
    deviceToken: string;
    type: string;
    idempotencyKey: string;
  };
};

export type NotificationSentEvent = {
  type: 'notification.sent';
  payload: {
    notificationId: string;
    userId: string;
  };
};

export type NotificationFailedEvent = {
  type: 'notification.failed';
  payload: {
    notificationId: string;
    userId: string;
    reason: string;
  };
};

export type NotificationEvent =
  | NotificationCreatedEvent
  | NotificationSentEvent
  | NotificationFailedEvent;
