import { AppConfig } from './config/env'

// DB / Cache / Messaging clients
import { PostgresClient } from './database/postgres/postgres.client'
import { MongoDBClient } from './database/mongodb/mongodb.client'
import { RedisClient } from './cache/redis.client'
import { KafkaClient } from './messaging/kafka/kafka.client'

// Infrastructure adapters
import { ArticlePostgresRepository } from './database/postgres/repositories/article.postgres.repository'
import { TipPostgresRepository } from './database/postgres/repositories/tip.postgres.repository'
import { ArticleMongoRepository } from './database/mongodb/repositories/article.mongo.repository'
import { TipMongoRepository } from './database/mongodb/repositories/tip.mongo.repository'
import { RedisCacheAdapter } from './cache/redis-cache.adapter'
import { KafkaEventPublisherAdapter } from './messaging/kafka/kafka-event-publisher.adapter'

// Application use cases
import { CreateArticleUseCase } from '../application/article/use-cases/create-article.use-case'
import { GetArticleUseCase } from '../application/article/use-cases/get-article.use-case'
import { PublishArticleUseCase } from '../application/article/use-cases/publish-article.use-case'
import { CreateTipUseCase } from '../application/tip/use-cases/create-tip.use-case'
import { GetTipUseCase } from '../application/tip/use-cases/get-tip.use-case'

// HTTP controllers
import { ArticleController } from './http/express/controllers/article.controller'
import { TipController } from './http/express/controllers/tip.controller'

export interface Container {
  // Clients
  postgresClient: PostgresClient
  mongoClient: MongoDBClient
  redisClient: RedisClient
  kafkaClient: KafkaClient

  // Controllers (exposed for app wiring)
  articleController: ArticleController
  tipController: TipController
}

export function buildContainer(config: AppConfig): Container {
  // --- Infrastructure clients ---
  const postgresClient = PostgresClient.getInstance({
    host: config.postgres.host,
    port: config.postgres.port,
    database: config.postgres.database,
    user: config.postgres.user,
    password: config.postgres.password,
  })

  const mongoClient = MongoDBClient.getInstance(config.mongodb.uri)

  const redisClient = RedisClient.getInstance(
    config.redis.host,
    config.redis.port,
    config.redis.password,
  )

  const kafkaClient = KafkaClient.getInstance({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
  })

  // --- Repositories (outbound adapters) ---
  const articleWriteRepo = new ArticlePostgresRepository(postgresClient)
  const tipWriteRepo = new TipPostgresRepository(postgresClient)

  const articleReadRepo = new ArticleMongoRepository()
  const tipReadRepo = new TipMongoRepository()

  // --- Cache adapter ---
  const cache = new RedisCacheAdapter(redisClient.getClient())

  // --- Event publisher adapter ---
  const eventPublisher = new KafkaEventPublisherAdapter(kafkaClient.getProducer())

  // --- Application use cases ---
  const createArticleUseCase = new CreateArticleUseCase(articleWriteRepo, articleReadRepo, eventPublisher)
  const getArticleUseCase = new GetArticleUseCase(articleReadRepo, cache)
  const publishArticleUseCase = new PublishArticleUseCase(articleWriteRepo, articleReadRepo, eventPublisher, cache)

  const createTipUseCase = new CreateTipUseCase(tipWriteRepo, tipReadRepo)
  const getTipUseCase = new GetTipUseCase(tipReadRepo, cache)

  // --- HTTP controllers (inbound adapters) ---
  const articleController = new ArticleController(createArticleUseCase, getArticleUseCase, publishArticleUseCase)
  const tipController = new TipController(createTipUseCase, getTipUseCase)

  return {
    postgresClient,
    mongoClient,
    redisClient,
    kafkaClient,
    articleController,
    tipController,
  }
}
