// src/adapters/inbound/http/express/order-controller.ts
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { CreateOrderUseCase } from "../../../../application/use-cases/create-order.js";
import { GetOrderUseCase } from "../../../../application/use-cases/get-order.js";
import { CancelOrderUseCase } from "../../../../application/use-cases/cancel-order.js";

export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  buildRouter(): Router {
    const router = createRouter();

    // POST /orders
    router.post("/orders", async (req: Request, res: Response) => {
      try {
        const result = await this.createOrderUseCase.execute(req.body);
        res.status(201).json(result);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // GET /orders/:id
    router.get("/orders/:id", async (req: Request, res: Response) => {
      try {
        const result = await this.getOrderUseCase.execute(req.params.id);
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Order not found") {
          res.status(404).json({ error: "Order not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // PUT /orders/:id/cancel
    router.put("/orders/:id/cancel", async (req: Request, res: Response) => {
      try {
        const result = await this.cancelOrderUseCase.execute(req.params.id);
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Order not found") {
          res.status(404).json({ error: "Order not found" });
          return;
        }
        if (error instanceof Error && /already cancelled/i.test(error.message)) {
          res.status(409).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    return router;
  }
}
