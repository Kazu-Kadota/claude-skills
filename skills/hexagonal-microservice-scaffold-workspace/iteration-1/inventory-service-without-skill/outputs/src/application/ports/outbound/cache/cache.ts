// src/application/ports/outbound/cache/cache.ts

import { ProductDTO } from "../../../../domain/product.js";

export abstract class IInventoryCachePort {
  abstract get(id: string): Promise<ProductDTO | null>;
  abstract set(entity: ProductDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
