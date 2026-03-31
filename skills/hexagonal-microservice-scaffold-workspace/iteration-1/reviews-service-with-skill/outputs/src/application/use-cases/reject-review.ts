// src/application/use-cases/reject-review.ts
import { Review } from "../../domain/review.js";
import { IReviewsCachePort } from "../ports/outbound/cache/cache.js";
import { IReviewsRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { IReviewsRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IReviewsEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IReviewsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class RejectReviewUseCase {
  constructor(
    private readonly readRepository: IReviewsRepositoryReadPort,
    private readonly writeRepository: IReviewsRepositoryWritePort,
    private readonly cache: IReviewsCachePort,
    private readonly eventBus: IReviewsEventBusPort,
    private readonly telemetry: IReviewsTelemetryPort,
  ) {}

  private async rejectReview(entity: Review): Promise<void> {
    entity.reject();
    const dto = entity.toDTO();

    await this.writeRepository.updateOne(dto);
    await this.cache.set(dto);
    await this.eventBus.publish("review.rejected", {
      type: "review.rejected",
      payload: {
        reviewId: dto.id,
        productId: dto.productId,
        userId: dto.userId,
        rating: dto.rating,
      },
    });
  }

  async execute(id: string): Promise<void> {
    return this.telemetry.span("reviews.reject", async () => {
      // Try cache first (avoids a DB round-trip in the hot path)
      const cached = await this.cache.get(id);
      if (cached) {
        const entity = Review.reconstitute(cached);
        await this.rejectReview(entity);
        return;
      }

      // Cache miss — fall back to the read DB
      const projection = await this.readRepository.findById(id);
      if (!projection) throw new Error("Review not found");

      const entity = Review.reconstitute(projection);
      await this.rejectReview(entity);
    });
  }
}
