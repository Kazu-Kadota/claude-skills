import type { Collection } from "mongodb";
import type { ReviewDTO } from "../../../../domain/review/review.js";
import { FindByIdProjection } from "../../../../application/ports/outbound/database/database-read.js";
import { IReviewsRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";

export class MongoReviewRepositoryWrite implements IReviewsRepositoryWritePort {
  constructor(private readonly collection: Collection<ReviewDTO>) {}

  async save(review: ReviewDTO): Promise<void> {
    await this.collection.insertOne(review);
  }

  async updateOne(review: ReviewDTO): Promise<void> {
    await this.collection.updateOne(
      { id: review.id },
      { $set: { ...review } },
    );
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    const review = await this.collection.findOne({ id });
    if (!review) return null;

    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
