/**
 * bootstrap.ts
 *
 * Wires together every layer of the orders service:
 *   Domain → Application ports → Infrastructure adapters → HTTP server
 *
 * Adapters wired (stubs shown; swap for real implementations):
 *   - Postgres  (write repository)
 *   - MongoDB   (read / projection repository)
 *   - Redis     (cache)
 *   - Kafka     (event bus)
 *   - Express   (HTTP inbound adapter)
 */

import express, { Application } from 'express';
import { domainErrorHandler } from './adapters/inbound/http/express/error-handler';

// ---------------------------------------------------------------------------
// Minimal logger interface (swap for winston / pino in production)
// ---------------------------------------------------------------------------

const logger = {
  info: (msg: string, meta?: unknown) => console.info('[INFO]', msg, meta ?? ''),
  warn: (msg: string, meta?: unknown) => console.warn('[WARN]', msg, meta ?? ''),
  error: (msg: string, meta?: unknown) => console.error('[ERROR]', msg, meta ?? ''),
};

// ---------------------------------------------------------------------------
// Infrastructure stubs
// (Replace these with real adapter instances once the rest of the service
//  is wired; they exist here only to make the bootstrap self-contained.)
// ---------------------------------------------------------------------------

// Postgres write repository stub
const postgresOrderRepository = {
  save: async (_order: unknown) => { /* persist to Postgres */ },
  findById: async (_id: string) => null,
  update: async (_order: unknown) => { /* update in Postgres */ },
};

// MongoDB read model / projections stub
const mongoOrderReadRepository = {
  findById: async (_id: string) => null,
  findByCustomerId: async (_customerId: string) => [],
};

// Redis cache stub
const redisCache = {
  get: async (_key: string) => null,
  set: async (_key: string, _value: unknown, _ttlSeconds?: number) => { /* cache */ },
  del: async (_key: string) => { /* evict */ },
};

// Kafka event bus stub
const kafkaEventBus = {
  publish: async (_topic: string, _event: unknown) => { /* produce message */ },
};

// ---------------------------------------------------------------------------
// Application / use-case layer
// (Import real use-case classes and inject the repositories above.)
// ---------------------------------------------------------------------------

// Example use-case placeholders — replace with real implementations.
const cancelOrderUseCase = {
  execute: async (_orderId: string) => {
    // 1. Look up Order via postgresOrderRepository.findById
    // 2. If not found → throw NotFoundError
    // 3. Call order.cancel() — throws ConflictError if already cancelled
    // 4. Persist via postgresOrderRepository.update
    // 5. Invalidate cache via redisCache.del
    // 6. Publish event via kafkaEventBus.publish
  },
};

// ---------------------------------------------------------------------------
// Express HTTP adapter
// ---------------------------------------------------------------------------

function buildExpressApp(): Application {
  const app = express();

  // Make logger available to middleware via app.locals
  app.locals.logger = logger;

  // --- Global middleware ---
  app.use(express.json());

  // --- Routes ---
  app.post('/orders/:id/cancel', async (req, res, next) => {
    try {
      await cancelOrderUseCase.execute(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // Health-check (useful for K8s probes etc.)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // --- Error handler must be registered LAST ---
  app.use(domainErrorHandler);

  return app;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function bootstrap(): Promise<void> {
  const PORT = Number(process.env.PORT ?? 3000);

  // In production, open DB / broker connections here before binding the server.
  // e.g. await postgresClient.connect();
  //      await mongoClient.connect();
  //      await redisClient.connect();
  //      await kafkaProducer.connect();

  const app = buildExpressApp();

  app.listen(PORT, () => {
    logger.info(`Orders service listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal error during bootstrap', { error: (err as Error).message });
  process.exit(1);
});
