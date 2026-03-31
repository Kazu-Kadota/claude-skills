import type { ReviewDTO } from "../../../../domain/review/review.js";
import { FindByIdProjection } from "../../../../application/ports/outbound/database/database-read.js";
import { IReviewsRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";
import { PrismaClient } from "../../../../generated/reviews/client.js";

export class PostgresReviewRepositoryWrite
  implements IReviewsRepositoryWritePort
{
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(review: ReviewDTO): Promise<void> {
    await this.prismaClient.review.upsert({
      create: {
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
        comment: review.comment ?? null,
        status: review.status,
        createdAt: new Date(review.createdAt),
        updatedAt: new Date(review.updatedAt),
      },
      update: {
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
        comment: review.comment ?? null,
        status: review.status,
        updatedAt: new Date(review.updatedAt),
      },
      where: { id: review.id },
    });
  }

  async updateOne(review: ReviewDTO): Promise<void> {
    await this.prismaClient.review.upsert({
      create: {
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
        comment: review.comment ?? null,
        status: review.status,
        createdAt: new Date(review.createdAt),
        updatedAt: new Date(review.updatedAt),
      },
      update: {
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
        comment: review.comment ?? null,
        status: review.status,
        updatedAt: new Date(review.updatedAt),
      },
      where: { id: review.id },
    });
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
}
