// src/domain/product.ts

// Status enum — always use `as const`, never TypeScript `enum`
export const ProductStatus = {
  active: "active",
  inactive: "inactive",
  discontinued: "discontinued",
} as const;

export type ProductStatusType = keyof typeof ProductStatus;

// The full domain object — used as the transfer object across layer boundaries
export type ProductDomain = {
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

// DTO = what gets stored, cached, and returned to callers (same shape as Domain here)
export type ProductDTO = ProductDomain;

// Input for the factory method — only what the caller provides (no id, no timestamps)
export type CreateProductParams = {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
};

export class Product {
  // Private constructor enforces factory methods — callers can never do `new Product()`
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly sku: string,
    public readonly price: number,
    public quantity: number,
    public readonly category: string,
    private status: ProductStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  // Factory: validates business invariants, generates identity, sets initial state
  static create(params: CreateProductParams): Product {
    if (!params.name) throw new Error("Must inform name to create Product");
    if (!params.sku) throw new Error("Must inform sku to create Product");
    if (params.price < 0) throw new Error("Product price must be greater than or equal to zero");
    if (params.quantity < 0) throw new Error("Product quantity must be greater than or equal to zero");
    if (!params.category) throw new Error("Must inform category to create Product");

    return new Product(
      crypto.randomUUID(),
      params.name,
      params.sku,
      params.price,
      params.quantity,
      params.category,
      ProductStatus.active, // initial state is active
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  // Reconstitute: rebuilds from stored data — NO validation (trust the database)
  static reconstitute(raw: ProductDTO): Product {
    return new Product(
      raw.id,
      raw.name,
      raw.sku,
      raw.price,
      raw.quantity,
      raw.category,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  // State transition: sets product to inactive
  deactivate(): void {
    this.status = ProductStatus.inactive;
    this.updatedAt = new Date().toISOString();
  }

  // Serialize to a plain object — used when crossing layer boundaries (to adapter, to DTO)
  toDTO(): ProductDTO {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      price: this.price,
      quantity: this.quantity,
      category: this.category,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
