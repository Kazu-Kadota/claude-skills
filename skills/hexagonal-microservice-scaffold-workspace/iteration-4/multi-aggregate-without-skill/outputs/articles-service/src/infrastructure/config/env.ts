export interface AppConfig {
  nodeEnv: string
  port: number
  serviceName: string
  postgres: {
    host: string
    port: number
    database: string
    user: string
    password: string
  }
  mongodb: {
    uri: string
  }
  redis: {
    host: string
    port: number
    password?: string
  }
  kafka: {
    brokers: string[]
    clientId: string
    groupId: string
  }
  otel: {
    jaegerEndpoint: string
    serviceName: string
  }
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    serviceName: process.env.SERVICE_NAME || 'articles-service',
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'articles_db',
      user: process.env.POSTGRES_USER || 'articles_user',
      password: process.env.POSTGRES_PASSWORD || 'articles_password',
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/articles_read_db',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    kafka: {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'articles-service',
      groupId: process.env.KAFKA_GROUP_ID || 'articles-service-group',
    },
    otel: {
      jaegerEndpoint: process.env.OTEL_EXPORTER_JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      serviceName: process.env.OTEL_SERVICE_NAME || 'articles-service',
    },
  }
}
