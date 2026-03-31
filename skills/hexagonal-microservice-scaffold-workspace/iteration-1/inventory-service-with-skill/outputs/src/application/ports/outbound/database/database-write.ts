// src/application/ports/outbound/database/database-write.ts
import { ProductDTO } from "../../../../domain/product.js";
import { FindByIdProjection } from "./database-read.js";

export abstract class IInventoryRepositoryWritePort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract save(entity: ProductDTO): Promise<void>;
  abstract updateOne(entity: ProductDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
