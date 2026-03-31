// src/adapters/inbound/http/nest/product.service.ts
import { Inject, Injectable } from "@nestjs/common";
import { CreateProductUseCase } from "../../../../application/use-cases/create-product.js";
import { GetProductUseCase } from "../../../../application/use-cases/get-product.js";
import { DeactivateProductUseCase } from "../../../../application/use-cases/deactivate-product.js";
import { DeleteProductUseCase } from "../../../../application/use-cases/delete-product.js";
import { ProductDTO } from "../../../../domain/product.js";

@Injectable()
export class ProductService {
  constructor(
    @Inject(CreateProductUseCase) private readonly createProductUseCase: CreateProductUseCase,
    @Inject(GetProductUseCase) private readonly getProductUseCase: GetProductUseCase,
    @Inject(DeactivateProductUseCase) private readonly deactivateProductUseCase: DeactivateProductUseCase,
    @Inject(DeleteProductUseCase) private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  async createProduct(input: {
    name: string;
    sku: string;
    price: number;
    quantity: number;
    category: string;
  }): Promise<ProductDTO> {
    return await this.createProductUseCase.execute(input);
  }

  async getProduct(id: string): Promise<ProductDTO> {
    return await this.getProductUseCase.execute(id);
  }

  async deactivateProduct(id: string): Promise<void> {
    await this.deactivateProductUseCase.execute(id);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.deleteProductUseCase.execute(id);
  }
}
