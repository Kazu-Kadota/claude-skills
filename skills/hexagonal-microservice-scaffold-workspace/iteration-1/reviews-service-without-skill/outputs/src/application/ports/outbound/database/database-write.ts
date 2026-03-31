import { ReviewDTO } from "../../../../domain/review/review.js";
import { FindByIdProjection } from "./database-read.js";

export abstract class IReviewsRepositoryWritePort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract save(review: ReviewDTO): Promise<void>;
  abstract updateOne(review: ReviewDTO): Promise<void>;
}
