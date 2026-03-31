import { ReviewDTO } from "../../../../domain/review/review.js";

export abstract class IReviewsCachePort {
  abstract get(id: string): Promise<ReviewDTO | null>;
  abstract set(review: ReviewDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
