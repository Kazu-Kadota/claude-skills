import { Review, ReviewDTO } from "../../domain/review/review.js";
import { IReviewsCachePort } from "../ports/outbound/cache/cache.js";
import { IReviewsRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IReviewsEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IReviewsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export type SubmitReviewUseCaseParams = {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
};

export class SubmitReviewUseCase {
  constructor(
    private readonly writeReviewRepository: IReviewsRepositoryWritePort,
    private readonly cache: IReviewsCachePort,
    private readonly eventBus: IReviewsEventBusPort,
    private readonly telemetry: IReviewsTelemetryPort,
  ) {}

  async execute(input: SubmitReviewUseCaseParams): Promise<ReviewDTO> {
    return this.telemetry.span("reviews.submit", async () => {
      const review = Review.create({
        productId: input.productId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment,
      });
      const reviewDTO = review.toDTO();

      await this.writeReviewRepository.save(reviewDTO);
      await this.cache.set(reviewDTO);
      await this.eventBus.publish("review.submitted", {
        type: "review.submitted",
        payload: {
          reviewId: reviewDTO.id,
          productId: reviewDTO.productId,
          userId: reviewDTO.userId,
          rating: reviewDTO.rating,
          status: reviewDTO.status,
        },
      });

      return reviewDTO;
    });
  }
}
