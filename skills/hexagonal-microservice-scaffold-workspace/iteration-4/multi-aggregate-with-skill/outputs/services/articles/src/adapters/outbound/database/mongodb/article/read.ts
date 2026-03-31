// src/adapters/outbound/database/mongodb/article/read.ts
import type { Collection, WithId } from "mongodb";
import type { ArticleDTO, ArticleStatusType } from "../../../../../domain/article/article.js";
import {
  ArticleFindByIdProjection,
  ArticleFindByStatusProjection,
  IArticleRepositoryReadPort,
  PaginatedArticles,
  PaginationParameters,
} from "../../../../../application/ports/outbound/database/article/database-read.js";

export class MongoArticleRepositoryRead implements IArticleRepositoryReadPort {
  constructor(private readonly collection: Collection<ArticleDTO>) {}

  private async paginationFind(
    query: object,
    pagination: PaginationParameters,
  ): Promise<[WithId<ArticleDTO>[], number]> {
    const [docs, total] = await Promise.all([
      this.collection
        .find(query)
        .skip((pagination.page - 1) * pagination.pageSize)
        .limit(pagination.pageSize)
        .toArray(),
      this.collection.countDocuments(query),
    ]);
    return [docs, total];
  }

  async findById(id: string): Promise<ArticleFindByIdProjection | null> {
    const doc = await this.collection.findOne({ id });
    if (!doc) return null;
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findByStatus(
    status: ArticleStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedArticles<ArticleFindByStatusProjection> | null> {
    const [docs, total] = await this.paginationFind({ status }, pagination);
    return {
      data: docs.map((doc) => ({ id: doc.id, title: doc.title, status: doc.status })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
