import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { CreateNotificationUseCase } from "../../../../application/use-cases/create-notification.js";
import { GetNotificationUseCase } from "../../../../application/use-cases/get-notification.js";
import { DeleteNotificationUseCase } from "../../../../application/use-cases/delete-notification.js";
import { IHTTPSPort } from "../../../../application/ports/inbound/http.js";
import type { CreateNotificationBody, CreateNotificationOutput } from "./dtos/create-notification.js";
import type { GetNotificationOutput, GetNotificationParams } from "./dtos/get-notification.js";

export class NotificationController implements IHTTPSPort {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getNotificationUseCase: GetNotificationUseCase,
    private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
  ) {}

  async createNotification(body: CreateNotificationBody): Promise<CreateNotificationOutput> {
    return await this.createNotificationUseCase.execute(body);
  }

  async getNotification(params: GetNotificationParams): Promise<GetNotificationOutput> {
    return await this.getNotificationUseCase.execute(params.id);
  }

  async deleteNotification(params: { id: string }): Promise<void> {
    await this.deleteNotificationUseCase.execute(params.id);
  }

  buildRouter(): Router {
    const router = createRouter();

    router.post("/notification", async (req: Request, res: Response) => {
      try {
        const result = await this.createNotification(req.body);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.get("/notification/:id", async (req: Request, res: Response) => {
      try {
        const result = await this.getNotification(req.params as GetNotificationParams);
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Notification not found") {
          res.status(404).json({ error: "Notification not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    router.delete("/notification/:id", async (req: Request, res: Response) => {
      try {
        await this.deleteNotification(req.params);
        res.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message === "Notification not found") {
          res.status(404).json({ error: "Notification not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    });

    return router;
  }
}
