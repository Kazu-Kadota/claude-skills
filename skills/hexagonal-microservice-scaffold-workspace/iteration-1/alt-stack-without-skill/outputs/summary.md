# Shipments Microservice — Alt Stack

Generated TypeScript microservice using hexagonal architecture (Ports & Adapters, Clean Architecture, DDD).

## Technology Stack

| Layer | Technology |
|---|---|
| Inbound protocol | gRPC (`@grpc/grpc-js` + `@grpc/proto-loader`) |
| Database | DynamoDB (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) — single port, no CQRS split |
| Messaging | AWS SQS (`@aws-sdk/client-sqs`) |
| Cache | In-memory `Map<string, ShipmentDTO>` |
| Tracing | OpenTelemetry (`@opentelemetry/api`, OTLP HTTP exporter) |
| Config validation | Zod |

## Domain

**Entity:** `Shipment`

Fields: `id`, `orderId`, `recipientName`, `address`, `trackingCode`, `status`, `createdAt`, `updatedAt`

Status transitions (enforced in domain layer):
- `pending` → `in_transit` (via `markAsInTransit()`)
- `in_transit` → `delivered` (via `markAsDelivered()`)
- `pending | in_transit` → `failed` (via `markAsFailed()`)

## All Generated Files

```
outputs/
├── .env.example
├── package.json
├── tsconfig.json
├── summary.md
└── src/
    ├── main.ts
    │
    ├── domain/
    │   └── shipment.ts                           # Entity, status enum, factory, state transitions
    │
    ├── application/
    │   ├── ports/
    │   │   ├── inbound/
    │   │   │   └── grpc.ts                       # IGRPCPort (abstract class)
    │   │   └── outbound/
    │   │       ├── database/
    │   │       │   └── database.ts               # IShipmentRepositoryPort (single, no CQRS)
    │   │       ├── cache/
    │   │       │   └── cache.ts                  # IShipmentCachePort
    │   │       ├── messaging/
    │   │       │   └── messaging.ts              # IShipmentEventBusPort
    │   │       └── telemetry/
    │   │           └── telemetry.ts              # IShipmentTelemetryPort
    │   └── use-cases/
    │       ├── create-shipment.ts                # CreateShipmentUseCase
    │       ├── get-shipment.ts                   # GetShipmentUseCase (cache-first)
    │       ├── mark-in-transit-shipment.ts       # MarkInTransitShipmentUseCase
    │       ├── mark-delivered-shipment.ts        # MarkDeliveredShipmentUseCase
    │       └── mark-failed-shipment.ts           # MarkFailedShipmentUseCase
    │
    ├── adapters/
    │   ├── inbound/
    │   │   └── grpc/
    │   │       ├── proto/
    │   │       │   └── shipment.proto            # Protobuf service definition
    │   │       ├── shipment-controller.ts        # Implements IGRPCPort; exposes buildServiceImpl()
    │   │       └── bootstrap.ts                  # Composition root — wires all adapters + starts server
    │   └── outbound/
    │       ├── database/
    │       │   └── dynamodb/
    │       │       └── shipment-repository.ts    # DynamoDBShipmentRepository
    │       ├── cache/
    │       │   └── memory/
    │       │       └── shipment-cache.ts         # InMemoryShipmentCache (Map-backed)
    │       ├── messaging/
    │       │   └── sqs/
    │       │       └── event-bus.ts              # SQSEventBus
    │       └── telemetry/
    │           └── otel/
    │               └── otel-telemetry.ts         # OTelTelemetry (span wrapper)
    │
    └── infrastructure/
        ├── config.ts                             # Zod-validated env config
        ├── database/
        │   ├── ports.ts                          # RepositoryConnectionPort
        │   └── dynamodb/
        │       └── connection.ts                 # DynamoDBConnection
        ├── messaging/
        │   ├── port.ts                           # MessagingConnectionPort
        │   └── sqs/
        │       └── connection.ts                 # SQSConnection
        └── telemetry/
            ├── ports.ts                          # TelemetryConnectionPort
            └── otel/
                └── connection.ts                 # TelemetryConnection (OTLPTraceExporter)
```

## Key Design Decisions

1. **Single DB port (no CQRS):** Because DynamoDB is the only database, there is one `IShipmentRepositoryPort` covering both reads and writes, rather than the split `RepositoryReadPort`/`RepositoryWritePort` used in Postgres+MongoDB CQRS setups.

2. **In-memory Map cache:** `InMemoryShipmentCache` wraps a `Map<string, ShipmentDTO>` injected at bootstrap. The port contract is identical to a Redis cache — swapping to Redis only requires a new adapter class.

3. **gRPC inbound adapter:** The `ShipmentController` implements `IGRPCPort` and exposes a `buildServiceImpl()` method that returns a plain object consumed by `grpc.Server.addService()`. The protobuf file lives at `adapters/inbound/grpc/proto/shipment.proto`.

4. **SQS messaging:** `SQSEventBus` sends each event as a single SQS message with a `topic` message attribute, matching the same `publish(topic, message)` interface as a Kafka adapter.

5. **OpenTelemetry tracing:** Every use case body is wrapped in `this.telemetry.span(name, fn)`, ensuring all operations are traced end-to-end. The OTLP HTTP exporter is configured via `OTEL_EXPORTER_OTLP_ENDPOINT`.

6. **State machine validation in domain:** Invalid status transitions (e.g., `delivered` → `failed`) throw domain errors, keeping business rules out of use cases and adapters.
