// src/adapters/inbound/http/express/order-controller.ts
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { CreateOrderUseCase } from "../../../../application/use-cases/create-order.js";
import { GetOrderUseCase } from "../../../../application/use-cases/get-order.js";
import { CancelOrderUseCase } from "../../../../application/use-cases/cancel-order.js";
import { IHTTPSPort } from "../../../../application/ports/inbound/http.js";
import { CreateOrderUseCaseExecuteParams } from "../../../../application/use-cases/create-order.js";

export class OrderController implements IHTTPSPort {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  async createOrder(body: CreateOrderUseCaseExecuteParams): Promise<unknown> {
    return await this.createOrderUseCase.execute(body);
  }

  async getOrder(params: { id: string }): Promise<unknown> {
    return await this.getOrderUseCase.execute(params.id);
  }

  async cancelOrder(params: { id: string }): Promise<unknown> {
    return await this.cancelOrderUseCase.execute(params.id);
  }

  buildRouter(): Router {
    const router = createRouter();

    router.post("/", async (req: Request, res: Response) => {
      try {
        const result = await this.createOrder(req.body);
        res.status(201).json(result);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get("/:id", async (req: Request, res: Response) => {
      try {
        const result = await this.getOrder(req.params as { id: string });
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Order not found") {
          res.status(404).json({ error: "Order not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.put("/:id/cancel", async (req: Request, res: Response) => {
      try {
        const result = await this.cancelOrder(req.params as { id: string });
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Order not found") {
          res.status(404).json({ error: "Order not found" });
          return;
        }
        if (error instanceof Error && error.message === "Order is already cancelled") {
          res.status(409).json({ error: "Order is already cancelled" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    return router;
  }
}
