// src/application/ports/outbound/cache/cache.ts
import type { ReviewDTO } from "../../../../domain/review.js";

export abstract class IReviewsCachePort {
  abstract get(id: string): Promise<ReviewDTO | null>;
  abstract set(entity: ReviewDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
