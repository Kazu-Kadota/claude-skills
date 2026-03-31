export type GetNotificationParams = {
  id: string;
};

export type GetNotificationOutput = {
  id: string;
  recipientId: string;
  channel: string;
  message: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};
