// src/_test/e2e/setup.ts
// Builds the Express app with in-memory adapters — no test containers needed.
import express, { type Express } from 'express';
import { CreateNotificationUseCase } from '../../application/use-cases/create-notification.js';
import { GetNotificationUseCase } from '../../application/use-cases/get-notification.js';
import { MarkAsSentUseCase } from '../../application/use-cases/mark-as-sent.js';
import { MarkAsFailedUseCase } from '../../application/use-cases/mark-as-failed.js';
import { NotificationController } from '../../adapters/inbound/http/express/notification-controller.js';
import {
  FakeWriteRepo,
  FakeReadRepo,
  FakeEventBus,
  FakePushAdapter,
  PassthroughTelemetry,
} from '../../application/use-cases/_test/doubles.js';

export function buildTestApp() {
  const writeRepo = new FakeWriteRepo();
  const readRepo = new FakeReadRepo();
  const eventBus = new FakeEventBus();
  const pushAdapter = new FakePushAdapter();
  const telemetry = new PassthroughTelemetry();

  const createNotification = new CreateNotificationUseCase(
    writeRepo,
    eventBus,
    pushAdapter,
    telemetry,
  );
  const getNotification = new GetNotificationUseCase(readRepo, telemetry);
  const markAsSent = new MarkAsSentUseCase(writeRepo, eventBus, telemetry);
  const markAsFailed = new MarkAsFailedUseCase(writeRepo, eventBus, telemetry);

  const controller = new NotificationController(
    createNotification,
    getNotification,
    markAsSent,
    markAsFailed,
  );

  const app: Express = express();
  app.use(express.json());
  app.use(controller.buildRouter());

  return { app, writeRepo, readRepo, eventBus, pushAdapter };
}
