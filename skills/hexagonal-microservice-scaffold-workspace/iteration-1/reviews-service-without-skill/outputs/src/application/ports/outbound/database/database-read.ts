import { ReviewStatusType } from "../../../../domain/review/review.js";

export type PaginationParameters = {
  page: number;
  pageSize: number;
  totalPages?: number;
  orderBy?: object;
};

export abstract class PaginatedReviews<T> {
  abstract data: T[];
  abstract page: number;
  abstract pageSize: number;
  abstract total: number;
  abstract hasNext: boolean;
}

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

export type FindByProductIdProjection = {
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
  ): Promise<PaginatedReviews<FindByProductIdProjection> | null>;
}
