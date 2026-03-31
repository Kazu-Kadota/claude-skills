// src/adapters/outbound/database/postgres/read.ts
import { PrismaClient } from "../../../../generated/reviews/client.js";
import {
  FindByIdProjection,
  FindByProductProjection,
  IReviewsRepositoryReadPort,
  PaginatedReviews,
  PaginationParameters,
} from "../../../../application/ports/outbound/database/database-read.js";

export class PostgresReviewRepositoryRead implements IReviewsRepositoryReadPort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findById(id: string): Promise<FindByIdProjection | null> {
    return await this.prismaClient.review.findUnique({ where: { id } });
  }

  async findByProductId(
    productId: string,
    pagination: PaginationParameters,
  ): Promise<PaginatedReviews<FindByProductProjection> | null> {
    const [data, total] = await Promise.all([
      this.prismaClient.review.findMany({
        where: { productId },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prismaClient.review.count({ where: { productId } }),
    ]);
    return {
      data,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
