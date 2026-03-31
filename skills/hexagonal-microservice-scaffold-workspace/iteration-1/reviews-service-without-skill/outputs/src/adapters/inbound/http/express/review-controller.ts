import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { SubmitReviewUseCase } from "../../../../application/use-cases/submit-review.js";
import { ApproveReviewUseCase } from "../../../../application/use-cases/approve-review.js";
import { RejectReviewUseCase } from "../../../../application/use-cases/reject-review.js";
import { GetReviewByIdUseCase } from "../../../../application/use-cases/get-review-by-id.js";
import { ListReviewsByProductUseCase } from "../../../../application/use-cases/list-reviews-by-product.js";
import { IReviewsHTTPPort } from "../../../../application/ports/inbound/http.js";
import { SubmitReviewBody, SubmitReviewOutput } from "./dtos/submit-review.js";
import { GetReviewParams, GetReviewOutput } from "./dtos/get-review.js";
import { ApproveReviewParams } from "./dtos/approve-review.js";
import { RejectReviewParams } from "./dtos/reject-review.js";
import {
  ListReviewsByProductParams,
  ListReviewsByProductQuery,
} from "./dtos/list-reviews.js";

export class ReviewController implements IReviewsHTTPPort {
  constructor(
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    private readonly approveReviewUseCase: ApproveReviewUseCase,
    private readonly rejectReviewUseCase: RejectReviewUseCase,
    private readonly getReviewByIdUseCase: GetReviewByIdUseCase,
    private readonly listReviewsByProductUseCase: ListReviewsByProductUseCase,
  ) {}

  async submitReview(body: SubmitReviewBody): Promise<SubmitReviewOutput> {
    return await this.submitReviewUseCase.execute(body);
  }

  async approveReview(param: ApproveReviewParams): Promise<void> {
    await this.approveReviewUseCase.execute(param.id);
  }

  async rejectReview(param: RejectReviewParams): Promise<void> {
    await this.rejectReviewUseCase.execute(param.id);
  }

  async getReviewById(param: GetReviewParams): Promise<GetReviewOutput> {
    return await this.getReviewByIdUseCase.execute(param.id);
  }

  async listReviewsByProduct(
    param: ListReviewsByProductParams,
    query: { page: number; pageSize: number },
  ) {
    return await this.listReviewsByProductUseCase.execute({
      productId: param.productId,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
      },
    });
  }

  buildRouter(): Router {
    const router = createRouter();

    router.post("/review", async (req: Request, res: Response) => {
      try {
        const review = await this.submitReview(req.body);
        res.status(201).json(review);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get("/review/:id", async (req: Request, res: Response) => {
      try {
        const review = await this.getReviewById(
          req.params as GetReviewParams,
        );
        res.status(200).json(review);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Review not found"
        ) {
          res.status(404).json({ error: "Review not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get(
      "/product/:productId/reviews",
      async (req: Request, res: Response) => {
        try {
          const page = parseInt((req.query.page as string) ?? "1", 10);
          const pageSize = parseInt(
            (req.query.pageSize as string) ?? "10",
            10,
          );
          const result = await this.listReviewsByProduct(
            req.params as ListReviewsByProductParams,
            { page, pageSize },
          );
          res.status(200).json(result);
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    router.put(
      "/review/:id/approve",
      async (req: Request, res: Response) => {
        try {
          await this.approveReview(req.params as ApproveReviewParams);
          res.status(200).send();
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Review not found"
          ) {
            res.status(404).json({ error: "Review not found" });
            return;
          }
          if (
            error instanceof Error &&
            error.message === "Only pending reviews can be approved"
          ) {
            res.status(422).json({ error: error.message });
            return;
          }
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    router.put(
      "/review/:id/reject",
      async (req: Request, res: Response) => {
        try {
          await this.rejectReview(req.params as RejectReviewParams);
          res.status(200).send();
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Review not found"
          ) {
            res.status(404).json({ error: "Review not found" });
            return;
          }
          if (
            error instanceof Error &&
            error.message === "Only pending reviews can be rejected"
          ) {
            res.status(422).json({ error: error.message });
            return;
          }
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    return router;
  }
}
