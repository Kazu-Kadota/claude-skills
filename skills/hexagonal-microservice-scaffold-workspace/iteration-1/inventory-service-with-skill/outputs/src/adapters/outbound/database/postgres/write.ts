// src/adapters/outbound/database/postgres/write.ts
import type { ProductDTO } from "../../../../domain/product.js";
import { FindByIdProjection } from "../../../../application/ports/outbound/database/database-read.js";
import { IInventoryRepositoryWritePort } from "../../../../application/ports/outbound/database/database-write.js";
import { PrismaClient } from "../../../../generated/inventory/client.js";

export class PostgresProductRepositoryWrite implements IInventoryRepositoryWritePort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(entity: ProductDTO): Promise<void> {
    await this.prismaClient.product.upsert({
      create: entity,
      update: entity,
      where: { id: entity.id },
    });
  }

  async updateOne(entity: ProductDTO): Promise<void> {
    await this.prismaClient.product.upsert({
      create: entity,
      update: entity,
      where: { id: entity.id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.product.delete({ where: { id } });
  }

  async findById(id: string): Promise<FindByIdProjection | null> {
    return await this.prismaClient.product.findUnique({ where: { id } });
  }
}
