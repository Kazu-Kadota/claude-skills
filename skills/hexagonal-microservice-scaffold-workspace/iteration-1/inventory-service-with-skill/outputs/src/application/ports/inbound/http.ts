// src/application/ports/inbound/http.ts
import { CreateProductUseCaseExecuteParams } from "../../use-cases/create-product.js";

export abstract class IHTTPSPort {
  abstract createProduct(body: CreateProductUseCaseExecuteParams): Promise<unknown>;
  abstract getProduct(param: { id: string }): Promise<unknown>;
  abstract deactivateProduct(param: { id: string }): Promise<unknown>;
  abstract deleteProduct(param: { id: string }): Promise<unknown>;
}
