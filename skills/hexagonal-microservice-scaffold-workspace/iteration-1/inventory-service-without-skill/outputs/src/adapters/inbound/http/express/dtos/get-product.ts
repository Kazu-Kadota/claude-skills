// src/adapters/inbound/http/express/dtos/get-product.ts

export type GetProductParams = {
  id: string;
};

export type GetProductOutput = {
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
