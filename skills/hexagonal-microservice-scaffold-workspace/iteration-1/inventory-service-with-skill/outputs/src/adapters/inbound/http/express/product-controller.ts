// src/adapters/inbound/http/express/product-controller.ts
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { CreateProductUseCase } from "../../../../application/use-cases/create-product.js";
import { GetProductUseCase } from "../../../../application/use-cases/get-product.js";
import { DeactivateProductUseCase } from "../../../../application/use-cases/deactivate-product.js";
import { DeleteProductUseCase } from "../../../../application/use-cases/delete-product.js";
import { IHTTPSPort } from "../../../../application/ports/inbound/http.js";
import { CreateProductBody, CreateProductOutput } from "./dtos/create-product.js";
import { GetProductOutput, GetProductParams } from "./dtos/get-product.js";

export class ProductController implements IHTTPSPort {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly deactivateProductUseCase: DeactivateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  async createProduct(body: CreateProductBody): Promise<CreateProductOutput> {
    return await this.createProductUseCase.execute(body);
  }

  async getProduct(params: GetProductParams): Promise<GetProductOutput> {
    return await this.getProductUseCase.execute(params.id);
  }

  async deactivateProduct(params: { id: string }): Promise<void> {
    await this.deactivateProductUseCase.execute(params.id);
  }

  async deleteProduct(params: { id: string }): Promise<void> {
    await this.deleteProductUseCase.execute(params.id);
  }

  buildRouter(): Router {
    const router = createRouter();

    router.post("/product", async (req: Request, res: Response) => {
      try {
        const result = await this.createProduct(req.body);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get("/product/:id", async (req: Request, res: Response) => {
      try {
        const result = await this.getProduct(req.params as GetProductParams);
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Product not found") {
          res.status(404).json({ error: "Product not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.put("/product/:id/deactivate", async (req: Request, res: Response) => {
      try {
        await this.deactivateProduct(req.params);
        res.status(200).send();
      } catch (error) {
        if (error instanceof Error && error.message === "Product not found") {
          res.status(404).json({ error: "Product not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.delete("/product/:id", async (req: Request, res: Response) => {
      try {
        await this.deleteProduct(req.params);
        res.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message === "Product not found") {
          res.status(404).json({ error: "Product not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    return router;
  }
}
