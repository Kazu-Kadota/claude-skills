import { ReviewDTO } from "../../domain/review/review.js";
import { IReviewsCachePort } from "../ports/outbound/cache/cache.js";
import { IReviewsRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { IReviewsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class GetReviewByIdUseCase {
  constructor(
    private readonly readReviewRepository: IReviewsRepositoryReadPort,
    private readonly cache: IReviewsCachePort,
    private readonly telemetry: IReviewsTelemetryPort,
  ) {}

  async execute(reviewId: string): Promise<ReviewDTO> {
    return this.telemetry.span("reviews.getById", async () => {
      const cached = await this.cache.get(reviewId);
      if (cached) return cached;

      const review = await this.readReviewRepository.findById(reviewId);
      if (!review) throw new Error("Review not found");

      await this.cache.set(review);
      return review;
    });
  }
}
