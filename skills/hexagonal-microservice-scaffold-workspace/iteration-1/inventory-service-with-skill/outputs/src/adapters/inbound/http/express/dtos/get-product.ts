// src/adapters/inbound/http/express/dtos/get-product.ts
import { ProductDTO } from "../../../../../domain/product.js";

export type GetProductParams = {
  id: string;
};

export type GetProductOutput = ProductDTO;
