// src/adapters/outbound/database/mongodb/write.ts

import type { Collection } from "mongodb";
import type { ProductDTO } from "../../../../domain/product.js";
import { FindByIdProjection } from "../../../../application/ports/outbound/database/database-read.js";
import { IInventoryRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";

export class MongoProductRepositoryWrite implements IInventoryRepositoryWritePort {
  constructor(private readonly collection: Collection<ProductDTO>) {}

  async save(entity: ProductDTO): Promise<void> {
    await this.collection.updateOne({ id: entity.id }, { $set: entity }, { upsert: true });
  }

  async updateOne(entity: ProductDTO): Promise<void> {
    await this.collection.updateOne({ id: entity.id }, { $set: entity }, { upsert: true });
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ id });
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
}
