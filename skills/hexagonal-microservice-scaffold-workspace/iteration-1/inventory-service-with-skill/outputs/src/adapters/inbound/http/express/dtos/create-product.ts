// src/adapters/inbound/http/express/dtos/create-product.ts
import { ProductDTO } from "../../../../../domain/product.js";

export type CreateProductBody = {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
};

export type CreateProductOutput = ProductDTO;
