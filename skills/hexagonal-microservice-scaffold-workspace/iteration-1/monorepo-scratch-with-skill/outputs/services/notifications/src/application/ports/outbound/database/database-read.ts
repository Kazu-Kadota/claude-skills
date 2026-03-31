import type { NotificationStatusType } from "../../../../domain/notification.js";

export type PaginationParameters = {
  page: number;
  pageSize: number;
  totalPages: number;
  orderBy?: object;
};

export abstract class PaginatedNotifications<T> {
  abstract data: T[];
  abstract page: number;
  abstract pageSize: number;
  abstract total: number;
  abstract hasNext: boolean;
}

export type FindByIdProjection = {
  id: string;
  recipientId: string;
  channel: string;
  message: string;
  status: NotificationStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type FindByStatusProjection = {
  id: string;
  recipientId: string;
  status: NotificationStatusType;
};

export abstract class INotificationsRepositoryReadPort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract findByStatus(
    status: NotificationStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedNotifications<FindByStatusProjection> | null>;
}
