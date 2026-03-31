// src/application/use-cases/list-reviews-by-product.ts
import { IReviewsRepositoryReadPort, PaginationParameters, PaginatedReviews, FindByProductProjection } from "../ports/outbound/database/database-read.js";
import { IReviewsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export type ListReviewsByProductUseCaseExecuteParams = {
  productId: string;
  page?: number;
  pageSize?: number;
};

export class ListReviewsByProductUseCase {
  constructor(
    private readonly readRepository: IReviewsRepositoryReadPort,
    private readonly telemetry: IReviewsTelemetryPort,
  ) {}

  async execute(
    input: ListReviewsByProductUseCaseExecuteParams,
  ): Promise<PaginatedReviews<FindByProductProjection> | null> {
    return this.telemetry.span("reviews.listByProduct", async () => {
      const pagination: PaginationParameters = {
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 10,
        totalPages: 0,
      };

      return this.readRepository.findByProductId(input.productId, pagination);
    });
  }
}
