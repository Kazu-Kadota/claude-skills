// src/domain/product.ts

export const ProductStatus = {
  active: "active",
  inactive: "inactive",
  discontinued: "discontinued",
} as const;

export type ProductStatusType = keyof typeof ProductStatus;

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

export type ProductDTO = ProductDomain;

export type CreateProductParams = {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
};

export class Product {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly sku: string,
    public price: number,
    public quantity: number,
    public readonly category: string,
    private status: ProductStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

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
      ProductStatus.active,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

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

  deactivate(): void {
    this.status = ProductStatus.inactive;
    this.updatedAt = new Date().toISOString();
  }

  discontinue(): void {
    this.status = ProductStatus.discontinued;
    this.updatedAt = new Date().toISOString();
  }

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
