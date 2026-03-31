// src/adapters/outbound/database/postgres/write.ts
import type { ReviewDTO } from "../../../../domain/review.js";
import type { FindByIdProjection } from "../../../../application/ports/outbound/database/database-read.js";
import { IReviewsRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";
import { PrismaClient } from "../../../../generated/reviews/client.js";

export class PostgresReviewRepositoryWrite implements IReviewsRepositoryWritePort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(entity: ReviewDTO): Promise<void> {
    await this.prismaClient.review.upsert({
      create: entity,
      update: entity,
      where: { id: entity.id },
    });
  }

  async updateOne(entity: ReviewDTO): Promise<void> {
    await this.prismaClient.review.upsert({
      create: entity,
      update: entity,
      where: { id: entity.id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.review.delete({ where: { id } });
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    return await this.prismaClient.review.findUnique({ where: { id } });
  }
}
