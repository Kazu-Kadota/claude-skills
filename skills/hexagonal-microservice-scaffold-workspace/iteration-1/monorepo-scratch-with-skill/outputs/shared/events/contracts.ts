// Shared Kafka event type contracts for cross-service type safety

// notifications service events
export type NotificationCreatedEvent = {
  type: "notification.created";
  payload: {
    notificationId: string;
    recipientId: string;
    channel: "email" | "sms";
    message: string;
    status: "pending";
    idempotencyKey: string;
  };
};

export type NotificationDeletedEvent = {
  type: "notification.deleted";
  payload: {
    notificationId: string;
  };
};

// users service events
export type UserCreatedEvent = {
  type: "user.created";
  payload: {
    userId: string;
    email: string;
    name: string;
    role: "admin" | "member" | "guest";
    status: "active";
    idempotencyKey: string;
  };
};

export type UserDeletedEvent = {
  type: "user.deleted";
  payload: {
    userId: string;
  };
};

export type DomainEvent =
  | NotificationCreatedEvent
  | NotificationDeletedEvent
  | UserCreatedEvent
  | UserDeletedEvent;
