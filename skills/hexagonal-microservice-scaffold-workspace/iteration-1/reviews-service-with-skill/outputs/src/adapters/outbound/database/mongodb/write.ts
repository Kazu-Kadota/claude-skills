// src/adapters/outbound/database/mongodb/write.ts
import type { Collection } from "mongodb";
import type { ReviewDTO } from "../../../../domain/review.js";
import type { FindByIdProjection } from "../../../../application/ports/outbound/database/database-read.js";
import { IReviewsRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";

export class MongoReviewRepositoryWrite implements IReviewsRepositoryWritePort {
  constructor(private readonly collection: Collection<ReviewDTO>) {}

  async save(entity: ReviewDTO): Promise<void> {
    await this.collection.updateOne({ id: entity.id }, { $set: entity }, { upsert: true });
  }

  async updateOne(entity: ReviewDTO): Promise<void> {
    await this.collection.updateOne({ id: entity.id }, { $set: entity }, { upsert: true });
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ id });
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
}
