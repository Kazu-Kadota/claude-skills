// src/application/ports/outbound/database/tip/database-read.ts
import type { TipStatusType } from "../../../../../domain/tip/tip.js";

export type PaginationParameters = {
  page: number;
  pageSize: number;
  totalPages: number;
  orderBy?: object;
};

export abstract class PaginatedTips<T> {
  abstract data: T[];
  abstract page: number;
  abstract pageSize: number;
  abstract total: number;
  abstract hasNext: boolean;
}

export type TipFindByIdProjection = {
  id: string;
  content: string;
  category: string;
  status: TipStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type TipFindByStatusProjection = {
  id: string;
  category: string;
  status: TipStatusType;
};

export abstract class ITipRepositoryReadPort {
  abstract findById(id: string): Promise<TipFindByIdProjection | null>;
  abstract findByStatus(
    status: TipStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedTips<TipFindByStatusProjection> | null>;
}
