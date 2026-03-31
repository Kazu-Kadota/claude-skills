// src/adapters/outbound/database/mongodb/read.ts
import type { Collection, WithId } from "mongodb";
import type { ProductDTO, ProductStatusType } from "../../../../domain/product.js";
import {
  FindByIdProjection,
  FindByStatusProjection,
  IInventoryRepositoryReadPort,
  PaginatedProducts,
  PaginationParameters,
} from "../../../../application/ports/outbound/database/database-read.js";

export class MongoProductRepositoryRead implements IInventoryRepositoryReadPort {
  constructor(private readonly collection: Collection<ProductDTO>) {}

  private async paginationFind(
    query: object,
    pagination: PaginationParameters,
  ): Promise<[WithId<ProductDTO>[], number]> {
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

  async findById(id: string): Promise<FindByIdProjection | null> {
    const doc = await this.collection.findOne({ id });
    if (!doc) return null;
    return {
      id: doc.id,
      name: doc.name,
      sku: doc.sku,
      price: doc.price,
      quantity: doc.quantity,
      category: doc.category,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findByStatus(
    status: ProductStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedProducts<FindByStatusProjection> | null> {
    const [docs, total] = await this.paginationFind({ status }, pagination);
    return {
      data: docs.map((doc) => ({ id: doc.id, name: doc.name, sku: doc.sku, status: doc.status })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNext: pagination.page * pagination.pageSize < total,
    };
  }
}
