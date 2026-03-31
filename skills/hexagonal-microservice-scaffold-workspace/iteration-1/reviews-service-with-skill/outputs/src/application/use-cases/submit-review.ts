// src/application/use-cases/submit-review.ts
import { Review, ReviewDTO } from "../../domain/review.js";
import { IReviewsCachePort } from "../ports/outbound/cache/cache.js";
import { IReviewsRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IReviewsEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IReviewsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export type SubmitReviewUseCaseExecuteParams = {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
};

export class SubmitReviewUseCase {
  constructor(
    private readonly writeRepository: IReviewsRepositoryWritePort,
    private readonly cache: IReviewsCachePort,
    private readonly eventBus: IReviewsEventBusPort,
    private readonly telemetry: IReviewsTelemetryPort,
  ) {}

  async execute(input: SubmitReviewUseCaseExecuteParams): Promise<ReviewDTO> {
    return this.telemetry.span("reviews.submit", async () => {
      const entity = Review.create({
        productId: input.productId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment,
      });
      const dto = entity.toDTO();

      await this.writeRepository.save(dto);
      await this.cache.set(dto);
      await this.eventBus.publish("review.submitted", {
        type: "review.submitted",
        payload: {
          reviewId: dto.id,
          productId: dto.productId,
          userId: dto.userId,
          rating: dto.rating,
          comment: dto.comment,
          status: dto.status,
        },
      });

      return dto;
    });
  }
}
