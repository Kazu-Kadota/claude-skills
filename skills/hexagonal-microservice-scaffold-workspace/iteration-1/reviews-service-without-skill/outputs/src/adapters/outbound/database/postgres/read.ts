import type { ReviewDTO } from "../../../../domain/review/review.js";
import {
  FindByIdProjection,
  FindByProductIdProjection,
  IReviewsRepositoryReadPort,
  PaginatedReviews,
  PaginationParameters,
} from "../../../../application/ports/outbound/database/database-read.js";
import { PrismaClient } from "../../../../generated/reviews/client.js";

export class PostgresReviewRepositoryRead implements IReviewsRepositoryReadPort {
  constructor(private readonly prismaClient: PrismaClient) {}

  private async paginationFind(
    query: object,
    pagination: PaginationParameters,
  ): Promise<[ReviewDTO[], number]> {
    const [docs, total] = await Promise.all([
      this.prismaClient.review.findMany({
        where: query,
        take: pagination.pageSize,
        skip: (pagination.page - 1) * pagination.pageSize,
        orderBy: pagination.orderBy,
      }),
      this.prismaClient.review.count({ where: query }),
    ]);

    return [docs as unknown as ReviewDTO[], total];
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    const review = await this.prismaClient.review.findUnique({
      where: { id },
    });

    if (!review) return null;

    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment ?? undefined,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async findByProductId(
    productId: string,
    pagination: PaginationParameters,
  ): Promise<PaginatedReviews<FindByProductIdProjection> | null> {
    const [docs, total] = await this.paginationFind({ productId }, pagination);

    return {
      data: docs.map((doc) => ({
        id: (doc as ReviewDTO).id,
        productId: (doc as ReviewDTO).productId,
        userId: (doc as ReviewDTO).userId,
        rating: (doc as ReviewDTO).rating,
        comment: (doc as ReviewDTO).comment,
        status: (doc as ReviewDTO).status,
        createdAt: (doc as ReviewDTO).createdAt,
        updatedAt: (doc as ReviewDTO).updatedAt,
      })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
