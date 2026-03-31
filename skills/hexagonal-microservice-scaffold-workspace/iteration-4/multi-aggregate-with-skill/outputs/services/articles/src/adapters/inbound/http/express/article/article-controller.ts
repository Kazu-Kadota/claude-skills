// src/adapters/inbound/http/express/article/article-controller.ts
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { CreateArticleUseCase } from "../../../../../application/use-cases/article/create-article.js";
import { GetArticleUseCase } from "../../../../../application/use-cases/article/get-article.js";
import { PublishArticleUseCase } from "../../../../../application/use-cases/article/publish-article.js";
import type { CreateArticleBody, CreateArticleOutput } from "./dtos/create-article.js";
import type { GetArticleOutput, GetArticleParams } from "./dtos/get-article.js";

export class ArticleController {
  constructor(
    private readonly createArticleUseCase: CreateArticleUseCase,
    private readonly getArticleUseCase: GetArticleUseCase,
    private readonly publishArticleUseCase: PublishArticleUseCase,
  ) {}

  async createArticle(body: CreateArticleBody): Promise<CreateArticleOutput> {
    return await this.createArticleUseCase.execute(body);
  }

  async getArticle(params: GetArticleParams): Promise<GetArticleOutput> {
    return await this.getArticleUseCase.execute(params.id);
  }

  async publishArticle(params: { id: string }): Promise<void> {
    await this.publishArticleUseCase.execute(params.id);
  }

  buildRouter(): Router {
    const router = createRouter();

    router.post("/", async (req: Request, res: Response) => {
      try {
        const result = await this.createArticle(req.body);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get("/:id", async (req: Request, res: Response) => {
      try {
        const result = await this.getArticle(req.params as GetArticleParams);
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Article not found") {
          res.status(404).json({ error: "Article not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.put("/:id/publish", async (req: Request, res: Response) => {
      try {
        await this.publishArticle(req.params);
        res.status(200).send();
      } catch (error) {
        if (error instanceof Error && error.message === "Article not found") {
          res.status(404).json({ error: "Article not found" });
          return;
        }
        if (error instanceof Error && error.message === "Article is already published") {
          res.status(409).json({ error: "Article is already published" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    return router;
  }
}
