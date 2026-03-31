// src/adapters/inbound/http/express/dtos/get-review.ts
import type { ReviewDTO } from "../../../../../domain/review.js";

export type GetReviewParams = {
  id: string;
};

export type GetReviewOutput = ReviewDTO;
