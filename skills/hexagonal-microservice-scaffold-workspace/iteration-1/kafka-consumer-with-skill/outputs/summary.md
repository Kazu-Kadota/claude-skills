# Kafka Consumer Addition — Summary

## Files Created or Modified

### Modified: `src/entity/order/order.ts`
Added `paid` to the `OrderStatus` const object and added a `markAsPaid()` transition method to the `Order` class. The method guards against marking a cancelled order as paid (throws), sets `status` to `paid`, and updates `updatedAt`. No other behaviour was changed.

### Created: `src/application/use-cases/mark-order-as-paid.ts`
New use case `MarkOrderAsPaidUseCase` that mirrors the existing `CancelOrderUseCase` pattern: cache-first read → `Order.reconstitute()` → `order.markAsPaid()` → write to DB → update cache → publish `order.paid` event. The entire body is wrapped in `telemetry.span("orders.mark-as-paid", ...)`.

### Created: `src/adapters/inbound/messaging/kafka/order-consumer.ts`
New inbound adapter `OrderKafkaConsumer`. Subscribes to `payment.completed` and `payment.failed`. On `payment.completed` it delegates to `MarkOrderAsPaidUseCase.execute(raw.payload.orderId)`; on `payment.failed` it delegates to `CancelOrderUseCase.execute(raw.payload.orderId)`. Malformed messages and unknown topics are logged and skipped — the consumer never throws, preventing one bad message from halting the entire group.

### Created: `src/adapters/inbound/messaging/kafka/bootstrap.ts`
Second composition root `bootstrapKafkaConsumer()`. Spins up its own set of connections (Postgres, Mongo, Redis, Kafka consumer + producer) independent of the HTTP bootstrap, instantiates `MarkOrderAsPaidUseCase` and `CancelOrderUseCase`, creates `OrderKafkaConsumer`, calls `start()`, and registers a graceful shutdown handler using `Promise.allSettled` across all connections.

### Modified: `src/main.ts`
Imports `bootstrapKafkaConsumer` from the new consumer bootstrap and runs it in parallel with `bootstrapExpress()` via `Promise.all([bootstrapExpress(), bootstrapKafkaConsumer()])`. The existing HTTP bootstrap import is untouched.

---

## What was NOT touched

- `src/adapters/inbound/http/express/` — no changes to the HTTP adapter or its bootstrap.
- All existing use cases (`create-order`, `get-order`, `cancel-order`, `delete-order`) — unchanged.
- All outbound adapters and infrastructure connections — unchanged; the consumer bootstrap reuses them by instantiation, not by modification.
- All application ports — unchanged; no new inbound port abstract class was introduced (the use case is already the boundary, as per the skill's design rule).

---

## Event payload assumed shape (from payments service)

```ts
// payment.completed
{ type: "payment.completed", payload: { orderId: string, ... } }

// payment.failed
{ type: "payment.failed", payload: { orderId: string, ... } }
```

The consumer reads `raw.payload.orderId` from each message. If the payments service uses a different field name (e.g. `order_id`), update the two `.execute(raw.payload.orderId)` calls in `order-consumer.ts`.
