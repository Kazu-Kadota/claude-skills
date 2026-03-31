// src/adapters/outbound/database/postgres/tip/write.ts
import type { TipDTO } from "../../../../../domain/tip/tip.js";
import type { TipFindByIdProjection } from "../../../../../application/ports/outbound/database/tip/database-read.js";
import { ITipRepositoryWritePort } from "../../../../../application/ports/outbound/database/tip/database-write.js";
import { PrismaClient } from "../../../../../generated/articles/client.js";

export class PostgresTipRepositoryWrite implements ITipRepositoryWritePort {
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(entity: TipDTO): Promise<void> {
    await this.prismaClient.tip.upsert({
      create: {
        id: entity.id,
        content: entity.content,
        category: entity.category,
        status: entity.status,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      update: {
        content: entity.content,
        category: entity.category,
        status: entity.status,
        updatedAt: entity.updatedAt,
      },
      where: { id: entity.id },
    });
  }

  async updateOne(entity: TipDTO): Promise<void> {
    await this.prismaClient.tip.upsert({
      create: {
        id: entity.id,
        content: entity.content,
        category: entity.category,
        status: entity.status,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      update: {
        content: entity.content,
        category: entity.category,
        status: entity.status,
        updatedAt: entity.updatedAt,
      },
      where: { id: entity.id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.tip.delete({ where: { id } });
  }

  async findById(id: string): Promise<TipFindByIdProjection | null> {
    return await this.prismaClient.tip.findUnique({ where: { id } });
  }
}
