# Kafka Payment Consumer — File Summary

## Files Created or Modified

### Modified

| File | Reason |
|------|--------|
| `entity/order/order.ts` | Added `paid` to `OrderStatus` const object and `OrderStatusType`. Added `markAsPaid()` transition method on the `Order` class that sets status to `paid` and bumps `updatedAt`. |
| `main.ts` | Imported and called `bootstrapKafkaPaymentConsumer()` after the HTTP server boots, then called `.start()` on the returned consumer instance so the Kafka consumer begins processing events. |

### Created (net-new)

| File | Reason |
|------|--------|
| `application/use-cases/mark-order-as-paid.ts` | New use case — `MarkOrderAsPaidUseCase`. Follows the same pattern as `CancelOrderUseCase`: fetches the order from cache first, falls back to the read repository, calls `order.markAsPaid()`, persists via the write repository, updates cache, and publishes an `order.paid` domain event to Kafka. |
| `application/ports/inbound/messaging.ts` | New inbound port — `IMessagingConsumerPort` with a single `start(): Promise<void>` contract. Keeps the consumer adapter decoupled from its concrete Kafka implementation. |
| `adapters/inbound/messaging/kafka/payment-events-consumer.ts` | Kafka inbound adapter — `KafkaPaymentEventsConsumer`. Subscribes to the `payment-events` topic. Parses each message as a `PaymentEvent` union type. Dispatches `payment.completed` to `MarkOrderAsPaidUseCase` and `payment.failed` to `CancelOrderUseCase`. Unknown event types and parse errors are logged and skipped (non-fatal). |
| `adapters/inbound/messaging/kafka/bootstrap.ts` | Wiring function — `bootstrapKafkaPaymentConsumer()`. Mirrors the pattern in `adapters/inbound/http/express/bootstrap.ts`: opens all infrastructure connections, instantiates repositories, cache, event bus, telemetry, use cases, and finally the consumer adapter, returning it ready to call `.start()`. |

## Design Decisions

- **No changes to the HTTP adapter** (`adapters/inbound/http/express/`). The task required this; the HTTP adapter is untouched.
- **Separate bootstrap for the consumer** rather than merging into the Express bootstrap. This matches the existing convention (Express bootstrap is self-contained) and makes it easy to run the consumer independently if needed.
- **`MarkOrderAsPaidUseCase` mirrors `CancelOrderUseCase` exactly** in structure — cache-first read, write-repository update, cache write, and domain event publication — to stay consistent with the existing use-case layer.
- **`paid` added to `OrderStatus` const** (not just the type) so it is available at runtime for persistence layers that stringify the status value.
- **Kafka consumer group id** is derived from `${clientId}-payment-events` via `KafkaConnection.consumer("payment-events")`, consistent with how the existing connection helper computes group IDs.
- **Error handling in the consumer** logs and continues rather than crashing; this avoids taking down the HTTP server when a single malformed or unrecognised event arrives.
