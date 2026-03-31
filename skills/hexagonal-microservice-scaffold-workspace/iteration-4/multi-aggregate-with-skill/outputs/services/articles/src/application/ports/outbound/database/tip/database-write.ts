// src/application/ports/outbound/database/tip/database-write.ts
import type { TipDTO } from "../../../../../domain/tip/tip.js";
import type { TipFindByIdProjection } from "./database-read.js";

export abstract class ITipRepositoryWritePort {
  abstract findById(id: string): Promise<TipFindByIdProjection | null>;
  abstract save(entity: TipDTO): Promise<void>;
  abstract updateOne(entity: TipDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
