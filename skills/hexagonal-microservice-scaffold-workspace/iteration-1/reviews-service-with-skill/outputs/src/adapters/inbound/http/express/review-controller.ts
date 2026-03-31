// src/adapters/inbound/http/express/review-controller.ts
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { SubmitReviewUseCase } from "../../../../application/use-cases/submit-review.js";
import { GetReviewUseCase } from "../../../../application/use-cases/get-review.js";
import { ApproveReviewUseCase } from "../../../../application/use-cases/approve-review.js";
import { RejectReviewUseCase } from "../../../../application/use-cases/reject-review.js";
import { ListReviewsByProductUseCase, ListReviewsByProductUseCaseExecuteParams } from "../../../../application/use-cases/list-reviews-by-product.js";
import { IHTTPSPort } from "../../../../application/ports/inbound/http.js";
import type { SubmitReviewBody, SubmitReviewOutput } from "./dtos/submit-review.js";
import type { GetReviewParams, GetReviewOutput } from "./dtos/get-review.js";

export class ReviewController implements IHTTPSPort {
  constructor(
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    private readonly getReviewUseCase: GetReviewUseCase,
    private readonly approveReviewUseCase: ApproveReviewUseCase,
    private readonly rejectReviewUseCase: RejectReviewUseCase,
    private readonly listReviewsByProductUseCase: ListReviewsByProductUseCase,
  ) {}

  async submitReview(body: SubmitReviewBody): Promise<SubmitReviewOutput> {
    return await this.submitReviewUseCase.execute(body);
  }

  async getReview(params: GetReviewParams): Promise<GetReviewOutput> {
    return await this.getReviewUseCase.execute(params.id);
  }

  async approveReview(params: { id: string }): Promise<void> {
    await this.approveReviewUseCase.execute(params.id);
  }

  async rejectReview(params: { id: string }): Promise<void> {
    await this.rejectReviewUseCase.execute(params.id);
  }

  async listReviewsByProduct(params: ListReviewsByProductUseCaseExecuteParams): Promise<unknown> {
    return await this.listReviewsByProductUseCase.execute(params);
  }

  buildRouter(): Router {
    const router = createRouter();

    router.post("/reviews", async (req: Request, res: Response) => {
      try {
        const result = await this.submitReview(req.body);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get("/reviews/:id", async (req: Request, res: Response) => {
      try {
        const result = await this.getReview(req.params as GetReviewParams);
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Review not found") {
          res.status(404).json({ error: "Review not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.put("/reviews/:id/approve", async (req: Request, res: Response) => {
      try {
        await this.approveReview(req.params);
        res.status(200).send();
      } catch (error) {
        if (error instanceof Error && error.message === "Review not found") {
          res.status(404).json({ error: "Review not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.put("/reviews/:id/reject", async (req: Request, res: Response) => {
      try {
        await this.rejectReview(req.params);
        res.status(200).send();
      } catch (error) {
        if (error instanceof Error && error.message === "Review not found") {
          res.status(404).json({ error: "Review not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get("/reviews/product/:productId", async (req: Request, res: Response) => {
      try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
        const result = await this.listReviewsByProduct({
          productId: req.params.productId,
          page,
          pageSize,
        });
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    return router;
  }
}
