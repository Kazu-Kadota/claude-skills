// src/application/use-cases/get-review.ts
import { IReviewsCachePort } from "../ports/outbound/cache/cache.js";
import { IReviewsRepositoryReadPort } from "../ports/outbound/database/database-read.js";
import { IReviewsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export class GetReviewUseCase {
  constructor(
    private readonly readRepository: IReviewsRepositoryReadPort,
    private readonly cache: IReviewsCachePort,
    private readonly telemetry: IReviewsTelemetryPort,
  ) {}

  async execute(id: string) {
    return this.telemetry.span("reviews.get", async () => {
      const cached = await this.cache.get(id);
      if (cached) return cached;

      const entity = await this.readRepository.findById(id);
      if (!entity) throw new Error("Review not found");

      await this.cache.set(entity);
      return entity;
    });
  }
}
