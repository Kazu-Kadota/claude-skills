// src/adapters/inbound/http/express/dtos/create-product.ts

export type CreateProductBody = {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
};

export type CreateProductOutput = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};
