// src/adapters/inbound/http/express/notification-controller.ts
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { CreateNotificationUseCase } from '../../../../application/use-cases/create-notification.js';
import { GetNotificationUseCase } from '../../../../application/use-cases/get-notification.js';
import { MarkAsSentUseCase } from '../../../../application/use-cases/mark-as-sent.js';
import { MarkAsFailedUseCase } from '../../../../application/use-cases/mark-as-failed.js';
import { IHTTPSPort } from '../../../../application/ports/inbound/http.js';
import type { CreateNotificationBody, CreateNotificationOutput } from './dtos/create-notification.js';
import type { GetNotificationParams, GetNotificationOutput } from './dtos/get-notification.js';

export class NotificationController implements IHTTPSPort {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getNotificationUseCase: GetNotificationUseCase,
    private readonly markAsSentUseCase: MarkAsSentUseCase,
    private readonly markAsFailedUseCase: MarkAsFailedUseCase,
  ) {}

  async createNotification(body: CreateNotificationBody): Promise<CreateNotificationOutput> {
    return await this.createNotificationUseCase.execute(body);
  }

  async getNotification(params: GetNotificationParams): Promise<GetNotificationOutput> {
    return await this.getNotificationUseCase.execute(params.id);
  }

  async markAsSent(params: { id: string }): Promise<void> {
    await this.markAsSentUseCase.execute(params.id);
  }

  async markAsFailed(params: { id: string }, body: { reason: string }): Promise<void> {
    await this.markAsFailedUseCase.execute(params.id, body.reason);
  }

  buildRouter(): Router {
    const router = createRouter();

    router.post('/notifications', async (req: Request, res: Response) => {
      try {
        const result = await this.createNotification(req.body as CreateNotificationBody);
        res.status(201).json(result);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.get('/notifications/:id', async (req: Request, res: Response) => {
      try {
        const result = await this.getNotification(req.params as GetNotificationParams);
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message === 'Notification not found') {
          res.status(404).json({ error: 'Notification not found' });
          return;
        }
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.put('/notifications/:id/sent', async (req: Request, res: Response) => {
      try {
        await this.markAsSent(req.params);
        res.status(200).send();
      } catch (error) {
        if (error instanceof Error && error.message === 'Notification not found') {
          res.status(404).json({ error: 'Notification not found' });
          return;
        }
        if (error instanceof Error) {
          res.status(422).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.put('/notifications/:id/failed', async (req: Request, res: Response) => {
      try {
        await this.markAsFailed(req.params, req.body as { reason: string });
        res.status(200).send();
      } catch (error) {
        if (error instanceof Error && error.message === 'Notification not found') {
          res.status(404).json({ error: 'Notification not found' });
          return;
        }
        if (error instanceof Error) {
          res.status(422).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    return router;
  }
}
