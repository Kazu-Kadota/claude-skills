import {
  FindByProductIdProjection,
  IReviewsRepositoryReadPort,
  PaginatedReviews,
  PaginationParameters,
} from "../ports/outbound/database/database-read.js";
import { IReviewsTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export type ListReviewsByProductParams = {
  productId: string;
  pagination: PaginationParameters;
};

export class ListReviewsByProductUseCase {
  constructor(
    private readonly readReviewRepository: IReviewsRepositoryReadPort,
    private readonly telemetry: IReviewsTelemetryPort,
  ) {}

  async execute(
    params: ListReviewsByProductParams,
  ): Promise<PaginatedReviews<FindByProductIdProjection> | null> {
    return this.telemetry.span("reviews.listByProduct", async () => {
      return this.readReviewRepository.findByProductId(
        params.productId,
        params.pagination,
      );
    });
  }
}
