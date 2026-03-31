import { SubmitReviewUseCaseParams } from "../../use-cases/submit-review.js";

export abstract class IReviewsHTTPPort {
  abstract submitReview(body: SubmitReviewUseCaseParams): Promise<unknown>;
  abstract approveReview(param: { id: string }): Promise<unknown>;
  abstract rejectReview(param: { id: string }): Promise<unknown>;
  abstract getReviewById(param: { id: string }): Promise<unknown>;
  abstract listReviewsByProduct(param: { productId: string }, query: { page: number; pageSize: number }): Promise<unknown>;
}
