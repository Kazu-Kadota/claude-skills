// src/application/ports/inbound/http.ts
import type { SubmitReviewUseCaseExecuteParams } from "../../use-cases/submit-review.js";
import type { ListReviewsByProductUseCaseExecuteParams } from "../../use-cases/list-reviews-by-product.js";

export abstract class IHTTPSPort {
  abstract submitReview(body: SubmitReviewUseCaseExecuteParams): Promise<unknown>;
  abstract getReview(param: { id: string }): Promise<unknown>;
  abstract approveReview(param: { id: string }): Promise<unknown>;
  abstract rejectReview(param: { id: string }): Promise<unknown>;
  abstract listReviewsByProduct(param: ListReviewsByProductUseCaseExecuteParams): Promise<unknown>;
}
