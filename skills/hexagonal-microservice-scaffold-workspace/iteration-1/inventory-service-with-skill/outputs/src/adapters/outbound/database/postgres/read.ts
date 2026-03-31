// src/adapters/outbound/database/postgres/read.ts
import { PrismaClient } from "../../../../generated/inventory/client.js";
import {
  FindByIdProjection,
  FindByStatusProjection,
  IInventoryRepositoryReadPort,
  PaginatedProducts,
  PaginationParameters,
} from "../../../../application/ports/outbound/database/database-read.js";
import { ProductStatusType } from "../../../../domain/product.js";

export class PostgresProductRepositoryRead implements IInventoryRepositoryReadPort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findById(id: string): Promise<FindByIdProjection | null> {
    return await this.prismaClient.product.findUnique({ where: { id } });
  }

  async findByStatus(
    status: ProductStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedProducts<FindByStatusProjection> | null> {
    const [data, total] = await Promise.all([
      this.prismaClient.product.findMany({
        where: { status },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prismaClient.product.count({ where: { status } }),
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
