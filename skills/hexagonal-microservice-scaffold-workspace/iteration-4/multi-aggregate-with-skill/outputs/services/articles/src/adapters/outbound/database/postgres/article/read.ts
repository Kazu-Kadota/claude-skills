// src/adapters/outbound/database/postgres/article/read.ts
import { PrismaClient } from "../../../../../generated/articles/client.js";
import {
  ArticleFindByIdProjection,
  ArticleFindByStatusProjection,
  IArticleRepositoryReadPort,
  PaginatedArticles,
  PaginationParameters,
} from "../../../../../application/ports/outbound/database/article/database-read.js";
import type { ArticleStatusType } from "../../../../../domain/article/article.js";

export class PostgresArticleRepositoryRead implements IArticleRepositoryReadPort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findById(id: string): Promise<ArticleFindByIdProjection | null> {
    return await this.prismaClient.article.findUnique({ where: { id } });
  }

  async findByStatus(
    status: ArticleStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedArticles<ArticleFindByStatusProjection> | null> {
    const [data, total] = await Promise.all([
      this.prismaClient.article.findMany({
        where: { status },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        select: { id: true, title: true, status: true },
      }),
      this.prismaClient.article.count({ where: { status } }),
    ]);
    return {
      data,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
