// src/adapters/inbound/http/express/tip/tip-controller.ts
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { CreateTipUseCase } from "../../../../../application/use-cases/tip/create-tip.js";
import { GetTipUseCase } from "../../../../../application/use-cases/tip/get-tip.js";
import type { CreateTipBody, CreateTipOutput } from "./dtos/create-tip.js";
import type { GetTipOutput, GetTipParams } from "./dtos/get-tip.js";

export class TipController {
  constructor(
    private readonly createTipUseCase: CreateTipUseCase,
    private readonly getTipUseCase: GetTipUseCase,
  ) {}

  async createTip(body: CreateTipBody): Promise<CreateTipOutput> {
    return await this.createTipUseCase.execute(body);
  }

  async getTip(params: GetTipParams): Promise<GetTipOutput> {
    return await this.getTipUseCase.execute(params.id);
  }

  buildRouter(): Router {
    const router = createRouter();

    router.post("/", async (req: Request, res: Response) => {
      try {
        const result = await this.createTip(req.body);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get("/:id", async (req: Request, res: Response) => {
      try {
        const result = await this.getTip(req.params as GetTipParams);
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Tip not found") {
          res.status(404).json({ error: "Tip not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    return router;
  }
}
