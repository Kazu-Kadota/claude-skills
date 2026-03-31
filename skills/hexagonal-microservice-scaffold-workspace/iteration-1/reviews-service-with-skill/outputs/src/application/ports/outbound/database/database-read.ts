// src/application/ports/outbound/database/database-read.ts
import type { ReviewStatusType } from "../../../../domain/review.js";

export type PaginationParameters = {
  page: number;
  pageSize: number;
  totalPages: number;
  orderBy?: object;
};

// Abstract pagination result — implementations fill in the concrete type
export abstract class PaginatedReviews<T> {
  abstract data: T[];
  abstract page: number;
  abstract pageSize: number;
  abstract total: number;
  abstract hasNext: boolean;
}

// Projection types — only what each query needs, not the whole entity
export type FindByIdProjection = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
  status: ReviewStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type FindByProductProjection = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
  status: ReviewStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export abstract class IReviewsRepositoryReadPort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract findByProductId(
    productId: string,
    pagination: PaginationParameters,
  ): Promise<PaginatedReviews<FindByProductProjection> | null>;
}
