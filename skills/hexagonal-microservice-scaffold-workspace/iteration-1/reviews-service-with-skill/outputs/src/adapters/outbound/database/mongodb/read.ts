// src/adapters/outbound/database/mongodb/read.ts
import type { Collection, WithId } from "mongodb";
import type { ReviewDTO } from "../../../../domain/review.js";
import {
  FindByIdProjection,
  FindByProductProjection,
  IReviewsRepositoryReadPort,
  PaginatedReviews,
  PaginationParameters,
} from "../../../../application/ports/outbound/database/database-read.js";

export class MongoReviewRepositoryRead implements IReviewsRepositoryReadPort {
  constructor(private readonly collection: Collection<ReviewDTO>) {}

  private async paginationFind(
    query: object,
    pagination: PaginationParameters,
  ): Promise<[WithId<ReviewDTO>[], number]> {
    const [docs, total] = await Promise.all([
      this.collection
        .find(query)
        .skip((pagination.page - 1) * pagination.pageSize)
        .limit(pagination.pageSize)
        .toArray(),
      this.collection.countDocuments(query),
    ]);
    return [docs, total];
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    const doc = await this.collection.findOne({ id });
    if (!doc) return null;
    return {
      id: doc.id,
      productId: doc.productId,
      userId: doc.userId,
      rating: doc.rating,
      comment: doc.comment,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findByProductId(
    productId: string,
    pagination: PaginationParameters,
  ): Promise<PaginatedReviews<FindByProductProjection> | null> {
    const [docs, total] = await this.paginationFind({ productId }, pagination);
    return {
      data: docs.map((doc) => ({
        id: doc.id,
        productId: doc.productId,
        userId: doc.userId,
        rating: doc.rating,
        comment: doc.comment,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
