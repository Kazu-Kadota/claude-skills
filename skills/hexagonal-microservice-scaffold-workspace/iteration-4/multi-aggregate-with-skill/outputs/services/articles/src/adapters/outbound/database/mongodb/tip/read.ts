// src/adapters/outbound/database/mongodb/tip/read.ts
import type { Collection, WithId } from "mongodb";
import type { TipDTO, TipStatusType } from "../../../../../domain/tip/tip.js";
import {
  ITipRepositoryReadPort,
  PaginatedTips,
  PaginationParameters,
  TipFindByIdProjection,
  TipFindByStatusProjection,
} from "../../../../../application/ports/outbound/database/tip/database-read.js";

export class MongoTipRepositoryRead implements ITipRepositoryReadPort {
  constructor(private readonly collection: Collection<TipDTO>) {}

  private async paginationFind(
    query: object,
    pagination: PaginationParameters,
  ): Promise<[WithId<TipDTO>[], number]> {
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

  async findById(id: string): Promise<TipFindByIdProjection | null> {
    const doc = await this.collection.findOne({ id });
    if (!doc) return null;
    return {
      id: doc.id,
      content: doc.content,
      category: doc.category,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findByStatus(
    status: TipStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedTips<TipFindByStatusProjection> | null> {
    const [docs, total] = await this.paginationFind({ status }, pagination);
    return {
      data: docs.map((doc) => ({ id: doc.id, category: doc.category, status: doc.status })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
