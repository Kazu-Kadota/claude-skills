// src/application/ports/outbound/database/database-write.ts
import type { ReviewDTO } from "../../../../domain/review.js";
import type { FindByIdProjection } from "./database-read.js";

export abstract class IReviewsRepositoryWritePort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract save(entity: ReviewDTO): Promise<void>;
  abstract updateOne(entity: ReviewDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
