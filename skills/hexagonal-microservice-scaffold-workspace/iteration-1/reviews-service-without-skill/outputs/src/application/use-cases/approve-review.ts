import { Review } from "../../domain/review/review.js";
import { IReviewsCachePort } from "../ports/outbound/cache/cache.js";
import { IReviewsRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IReviewsEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IReviewsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class ApproveReviewUseCase {
  constructor(
    private readonly writeReviewRepository: IReviewsRepositoryWritePort,
    private readonly cache: IReviewsCachePort,
    private readonly eventBus: IReviewsEventBusPort,
    private readonly telemetry: IReviewsTelemetryPort,
  ) {}

  async execute(reviewId: string): Promise<void> {
    return this.telemetry.span("reviews.approve", async () => {
      const raw = await this.writeReviewRepository.findById(reviewId);
      if (!raw) throw new Error("Review not found");

      const review = Review.reconstitute(raw);
      review.approve();
      const reviewDTO = review.toDTO();

      await this.writeReviewRepository.updateOne(reviewDTO);
      await this.cache.set(reviewDTO);
      await this.eventBus.publish("review.approved", {
        type: "review.approved",
        payload: {
          reviewId: reviewDTO.id,
          productId: reviewDTO.productId,
          userId: reviewDTO.userId,
          rating: reviewDTO.rating,
          status: reviewDTO.status,
        },
      });
    });
  }
}
