import { config } from "../../../../infrastructure/config.js";
import { OrderDTO } from "../../../../entity/order/order.js";
import { KafkaConnection } from "../../../../infrastructure/messaging/kafka/connection.js";
import { MongoConnection } from "../../../../infrastructure/database/mongodb/connection.js";
import { PostgresConnection } from "../../../../infrastructure/database/postgres/connection.js";
import { RedisConnection } from "../../../../infrastructure/cache/redis/connection.js";
import { MongoOrderRepositoryRead } from "../../../outbound/database/mongodb/read.js";
import { MongoOrderRepositoryWrite } from "../../../outbound/database/mongodb/write.js";
import { PostgresOrderRepositoryRead } from "../../../outbound/database/postgres/read.js";
import { PostgresOrderRepositoryWrite } from "../../../outbound/database/postgres/write.js";
import { RedisOrderCache } from "../../../outbound/cache/redis/order-cache.js";
import { KafkaEventBus } from "../../../outbound/messaging/kafka/event-bus.js";
import { OTelTelemetry } from "../../../outbound/telemetry/otel/otel-telemetry.js";
import { MarkOrderAsPaidUseCase } from "../../../../application/use-cases/mark-order-as-paid.js";
import { CancelOrderUseCase } from "../../../../application/use-cases/cancel-order.js";
import { OrderKafkaConsumer } from "./order-consumer.js";

export async function bootstrapKafkaConsumer() {
  const postgresWriteUrl = `postgresql://${config.database.write.user}:${config.database.write.password}@${config.database.write.host}:${config.database.write.port}/orders`;
  const postgresReadUrl = `postgresql://${config.database.read.user}:${config.database.read.password}@${config.database.read.host}:${config.database.read.port}/orders`;

  const postgresWriteConnection = new PostgresConnection(postgresWriteUrl);
  const postgresReadConnection = new PostgresConnection(postgresReadUrl);
  const mongoWriteConnection = new MongoConnection(config.database.write.uri, "orders");
  const mongoReadConnection = new MongoConnection(config.database.read.uri, "orders");

  if (config.database.write.provider === "postgres") {
    await postgresWriteConnection.connect();
  } else {
    await mongoWriteConnection.connect();
  }

  if (config.database.read.provider === "postgres") {
    await postgresReadConnection.connect();
  } else {
    await mongoReadConnection.connect();
  }

  const redisConnection = new RedisConnection(config.cache.redis.url);
  const redis = redisConnection.connect();

  const kafkaConnection = new KafkaConnection(
    `${config.messaging.kafka.clientId}-orders-consumer`,
    config.messaging.kafka.brokers,
  );
  await kafkaConnection.connect();
  const consumer = await kafkaConnection.consumer("payments-events-group");

  const writeRepository =
    config.database.write.provider === "postgres"
      ? new PostgresOrderRepositoryWrite(postgresWriteConnection.getClient())
      : new MongoOrderRepositoryWrite(mongoWriteConnection.getClient().collection<OrderDTO>("orders"));

  const readRepository =
    config.database.read.provider === "postgres"
      ? new PostgresOrderRepositoryRead(postgresReadConnection.getClient())
      : new MongoOrderRepositoryRead(mongoReadConnection.getClient().collection<OrderDTO>("orders"));

  const cache = new RedisOrderCache(redis);
  const eventBus = new KafkaEventBus(await kafkaConnection.producer());
  const telemetry = new OTelTelemetry();

  const markOrderAsPaidUseCase = new MarkOrderAsPaidUseCase(
    readRepository,
    writeRepository,
    cache,
    eventBus,
    telemetry,
  );

  const cancelOrderUseCase = new CancelOrderUseCase(
    readRepository,
    writeRepository,
    cache,
    eventBus,
    telemetry,
  );

  const orderConsumer = new OrderKafkaConsumer(consumer, markOrderAsPaidUseCase, cancelOrderUseCase);
  await orderConsumer.start();

  console.log("[orders] Kafka consumer started, listening on payment.completed and payment.failed");

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`Received ${signal}. Shutting down Kafka consumer...`);

    const results = await Promise.allSettled([
      kafkaConnection.close(),
      postgresWriteConnection.close(),
      postgresReadConnection.close(),
      mongoWriteConnection.close(),
      mongoReadConnection.close(),
      redisConnection.close(),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Shutdown error:", result.reason);
      }
    }

    console.log("Kafka consumer shutdown completed.");
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
