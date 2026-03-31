// src/adapters/outbound/database/postgres/article/write.ts
import type { ArticleDTO } from "../../../../../domain/article/article.js";
import type { ArticleFindByIdProjection } from "../../../../../application/ports/outbound/database/article/database-read.js";
import { IArticleRepositoryWritePort } from "../../../../../application/ports/outbound/database/article/database-write.js";
import { PrismaClient } from "../../../../../generated/articles/client.js";

export class PostgresArticleRepositoryWrite implements IArticleRepositoryWritePort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(entity: ArticleDTO): Promise<void> {
    await this.prismaClient.article.upsert({
      create: {
        id: entity.id,
        title: entity.title,
        content: entity.content,
        status: entity.status,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      update: {
        title: entity.title,
        content: entity.content,
        status: entity.status,
        updatedAt: entity.updatedAt,
      },
      where: { id: entity.id },
    });
  }

  async updateOne(entity: ArticleDTO): Promise<void> {
    await this.prismaClient.article.upsert({
      create: {
        id: entity.id,
        title: entity.title,
        content: entity.content,
        status: entity.status,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      update: {
        title: entity.title,
        content: entity.content,
        status: entity.status,
        updatedAt: entity.updatedAt,
      },
      where: { id: entity.id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.article.delete({ where: { id } });
  }

  async findById(id: string): Promise<ArticleFindByIdProjection | null> {
    return await this.prismaClient.article.findUnique({ where: { id } });
  }
}
