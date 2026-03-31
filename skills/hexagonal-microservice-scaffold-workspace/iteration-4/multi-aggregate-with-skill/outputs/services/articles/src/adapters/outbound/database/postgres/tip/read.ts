// src/adapters/outbound/database/postgres/tip/read.ts
import { PrismaClient } from "../../../../../generated/articles/client.js";
import {
  ITipRepositoryReadPort,
  PaginatedTips,
  PaginationParameters,
  TipFindByIdProjection,
  TipFindByStatusProjection,
} from "../../../../../application/ports/outbound/database/tip/database-read.js";
import type { TipStatusType } from "../../../../../domain/tip/tip.js";

export class PostgresTipRepositoryRead implements ITipRepositoryReadPort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findById(id: string): Promise<TipFindByIdProjection | null> {
    return await this.prismaClient.tip.findUnique({ where: { id } });
  }

  async findByStatus(
    status: TipStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedTips<TipFindByStatusProjection> | null> {
    const [data, total] = await Promise.all([
      this.prismaClient.tip.findMany({
        where: { status },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        select: { id: true, category: true, status: true },
      }),
      this.prismaClient.tip.count({ where: { status } }),
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
