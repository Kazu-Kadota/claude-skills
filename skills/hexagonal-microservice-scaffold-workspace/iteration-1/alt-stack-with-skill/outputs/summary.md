# Shipments Microservice — Generation Summary

## Stack choices

| Concern       | Technology                    |
|---------------|-------------------------------|
| Database      | AWS DynamoDB (single store, no CQRS split) |
| Messaging     | AWS SQS                       |
| Inbound       | gRPC (`@grpc/grpc-js`)        |
| Cache         | In-memory `Map` (with TTL)    |
| Tracing       | OpenTelemetry (OTLP/HTTP)     |

---

## Files created

```
outputs/
├── .env.example
├── package.json
├── tsconfig.json
├── summary.md                                              ← this file
└── src/
    ├── main.ts
    │
    ├── domain/
    │   └── shipment.ts                                     ← entity, status enum, create/reconstitute/transition/toDTO
    │
    ├── application/
    │   ├── ports/
    │   │   ├── inbound/
    │   │   │   └── grpc.ts                                 ← IGRPCPort (abstract class)
    │   │   └── outbound/
    │   │       ├── database/
    │   │       │   └── database.ts                         ← IShipmentRepositoryPort (single port, no CQRS)
    │   │       ├── cache/
    │   │       │   └── cache.ts                            ← IShipmentCachePort
    │   │       ├── messaging/
    │   │       │   └── messaging.ts                        ← IShipmentEventBusPort
    │   │       └── telemetry/
    │   │           └── telemetry.ts                        ← IShipmentTelemetryPort
    │   └── use-cases/
    │       ├── create-shipment.ts                          ← create → save → cache → publish
    │       ├── get-shipment.ts                             ← cache-first read
    │       ├── mark-in-transit.ts                          ← state transition: pending → in_transit
    │       ├── mark-delivered.ts                           ← state transition: in_transit → delivered
    │       └── mark-failed.ts                              ← state transition: any non-delivered → failed
    │
    ├── adapters/
    │   ├── inbound/
    │   │   └── grpc/
    │   │       ├── shipment.proto                          ← Protobuf service definition
    │   │       ├── shipment-handler.ts                     ← implements IGRPCPort + buildServiceImpl()
    │   │       └── bootstrap.ts                            ← composition root: wires everything, starts server
    │   └── outbound/
    │       ├── database/
    │       │   └── dynamodb/
    │       │       └── shipment-repository.ts              ← implements IShipmentRepositoryPort via DynamoDB SDK
    │       ├── cache/
    │       │   └── memory/
    │       │       └── shipment-cache.ts                   ← implements IShipmentCachePort via Map + TTL
    │       ├── messaging/
    │       │   └── sqs/
    │       │       └── event-bus.ts                        ← implements IShipmentEventBusPort via SQS SDK
    │       └── telemetry/
    │           └── otel/
    │               └── otel-telemetry.ts                   ← implements IShipmentTelemetryPort via @opentelemetry/api
    │
    └── infrastructure/
        ├── config.ts                                       ← Zod schema, single process.env access point
        ├── database/
        │   ├── ports.ts                                    ← RepositoryConnectionPort (abstract)
        │   └── dynamodb/
        │       └── connection.ts                           ← lazy singleton DynamoDBDocumentClient
        ├── messaging/
        │   ├── port.ts                                     ← MessagingConnectionPort (abstract)
        │   └── sqs/
        │       └── connection.ts                           ← lazy singleton SQSClient
        └── telemetry/
            ├── ports.ts                                    ← TelemetryConnectionPort (abstract)
            └── otel/
                └── connection.ts                           ← OTLPTraceExporter + BasicTracerProvider setup
```

---

## Architecture decisions

### No CQRS
Because only one database (DynamoDB) is used, there is a single `IShipmentRepositoryPort` that handles both reads and writes. No separate read/write ports or adapters.

### In-memory cache
`MemoryShipmentCache` stores entries in a `Map<string, { value, expiresAt }>`. TTL is enforced on `get()` and there is an optional `purgeExpired()` for periodic cleanup. The cache implements the same `IShipmentCachePort` abstract class as a Redis adapter would — swapping is transparent to use cases.

### gRPC inbound adapter
- `shipment.proto` defines the service contract.
- `ShipmentGrpcHandler` implements `IGRPCPort` (the inbound port) and also provides `buildServiceImpl()` which returns the raw gRPC handler map for `server.addService()`.
- Proto snake_case fields (e.g. `order_id`) are mapped to domain camelCase (e.g. `orderId`) inside the handler — use cases never see proto types.

### SQS messaging
`SQSEventBus` sends a single `SendMessageCommand` per event. The `topic` is passed as a `MessageAttribute` so downstream consumers can filter by event type without deserializing the body.

### State transitions
| From       | To          | Method on domain |
|------------|-------------|------------------|
| pending    | in_transit  | `markInTransit()` |
| in_transit | delivered   | `markDelivered()` |
| any (not delivered) | failed | `markFailed()` |

Each transition use case follows: cache-first read → `Shipment.reconstitute()` → call method → `toDTO()` → `updateOne()` → `cache.set()` → `eventBus.publish()`.

### OpenTelemetry
Every use case wraps its `execute()` body in `this.telemetry.span("shipments.<action>", ...)`. Span names follow the `<domain>.<action>` convention (e.g. `shipments.create`, `shipments.mark_in_transit`).

### Layering (strictly enforced)
| Layer | Imports |
|-------|---------|
| `domain/` | nothing |
| `application/` | `domain/`, own `ports/` |
| `adapters/` | `application/`, `domain/` |
| `infrastructure/` | own connection SDKs only |
| `bootstrap.ts` | everything (composition root) |

---

## Running locally (with LocalStack)

```bash
# Start LocalStack
docker run -p 4566:4566 localstack/localstack

# Create DynamoDB table
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name shipments \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Create SQS queue
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name shipments

# Set env vars
export DYNAMODB_ENDPOINT=http://localhost:4566
export SQS_ENDPOINT=http://localhost:4566
export SQS_QUEUE_URL=http://localhost:4566/000000000000/shipments
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# Start the service
npm run dev
```
