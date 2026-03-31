// src/adapters/inbound/http/express/dtos/submit-review.ts
import type { ReviewDTO } from "../../../../../domain/review.js";

export type SubmitReviewBody = {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
};

export type SubmitReviewOutput = ReviewDTO;
