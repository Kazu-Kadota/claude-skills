// src/application/ports/outbound/database/article/database-read.ts
import type { ArticleStatusType } from "../../../../../domain/article/article.js";

export type PaginationParameters = {
  page: number;
  pageSize: number;
  totalPages: number;
  orderBy?: object;
};

export abstract class PaginatedArticles<T> {
  abstract data: T[];
  abstract page: number;
  abstract pageSize: number;
  abstract total: number;
  abstract hasNext: boolean;
}

export type ArticleFindByIdProjection = {
  id: string;
  title: string;
  content: string;
  status: ArticleStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type ArticleFindByStatusProjection = {
  id: string;
  title: string;
  status: ArticleStatusType;
};

export abstract class IArticleRepositoryReadPort {
  abstract findById(id: string): Promise<ArticleFindByIdProjection | null>;
  abstract findByStatus(
    status: ArticleStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedArticles<ArticleFindByStatusProjection> | null>;
}
