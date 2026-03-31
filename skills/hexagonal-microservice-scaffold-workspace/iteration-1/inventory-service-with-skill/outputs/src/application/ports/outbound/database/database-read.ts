// src/application/ports/outbound/database/database-read.ts
import { ProductStatusType } from "../../../../domain/product.js";

export type PaginationParameters = {
  page: number;
  pageSize: number;
  totalPages: number;
  orderBy?: object;
};

// Abstract pagination result — implementations fill in the concrete type
export abstract class PaginatedProducts<T> {
  abstract data: T[];
  abstract page: number;
  abstract pageSize: number;
  abstract total: number;
  abstract hasNext: boolean;
}

// Projection types — only what each query needs, not the whole entity
export type FindByIdProjection = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
  status: ProductStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type FindByStatusProjection = {
  id: string;
  name: string;
  sku: string;
  status: ProductStatusType;
};

export abstract class IInventoryRepositoryReadPort {
  abstract findById(id: string): Promise<FindByIdProjection | null>;
  abstract findByStatus(
    status: ProductStatusType,
    pagination: PaginationParameters,
  ): Promise<PaginatedProducts<FindByStatusProjection> | null>;
}
