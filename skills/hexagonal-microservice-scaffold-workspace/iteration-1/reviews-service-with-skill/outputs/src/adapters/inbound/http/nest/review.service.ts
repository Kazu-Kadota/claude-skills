// src/adapters/inbound/http/nest/review.service.ts
import { Inject, Injectable } from "@nestjs/common";
import { SubmitReviewUseCase } from "../../../../application/use-cases/submit-review.js";
import { GetReviewUseCase } from "../../../../application/use-cases/get-review.js";
import { ApproveReviewUseCase } from "../../../../application/use-cases/approve-review.js";
import { RejectReviewUseCase } from "../../../../application/use-cases/reject-review.js";
import { ListReviewsByProductUseCase, ListReviewsByProductUseCaseExecuteParams } from "../../../../application/use-cases/list-reviews-by-product.js";
import { ReviewDTO } from "../../../../domain/review.js";

@Injectable()
export class ReviewService {
  constructor(
    @Inject(SubmitReviewUseCase) private readonly submitReviewUseCase: SubmitReviewUseCase,
    @Inject(GetReviewUseCase) private readonly getReviewUseCase: GetReviewUseCase,
    @Inject(ApproveReviewUseCase) private readonly approveReviewUseCase: ApproveReviewUseCase,
    @Inject(RejectReviewUseCase) private readonly rejectReviewUseCase: RejectReviewUseCase,
    @Inject(ListReviewsByProductUseCase) private readonly listReviewsByProductUseCase: ListReviewsByProductUseCase,
  ) {}

  async submitReview(input: { productId: string; userId: string; rating: number; comment?: string }): Promise<ReviewDTO> {
    return await this.submitReviewUseCase.execute(input);
  }

  async getReview(id: string): Promise<ReviewDTO> {
    return await this.getReviewUseCase.execute(id);
  }

  async approveReview(id: string): Promise<void> {
    await this.approveReviewUseCase.execute(id);
  }

  async rejectReview(id: string): Promise<void> {
    await this.rejectReviewUseCase.execute(id);
  }

  async listReviewsByProduct(input: ListReviewsByProductUseCaseExecuteParams): Promise<unknown> {
    return await this.listReviewsByProductUseCase.execute(input);
  }
}
