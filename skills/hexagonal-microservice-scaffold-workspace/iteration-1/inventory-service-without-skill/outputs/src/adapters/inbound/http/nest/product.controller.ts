// src/adapters/inbound/http/nest/product.controller.ts

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put } from "@nestjs/common";
import { ProductService } from "./product.service.js";
import { CreateProductUseCaseExecuteParams } from "../../../../application/use-cases/create-product.js";
import { ProductDTO } from "../../../../domain/product.js";

@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() body: CreateProductUseCaseExecuteParams): Promise<ProductDTO> {
    return await this.productService.createProduct(body);
  }

  @Get(":id")
  async getProduct(@Param("id") id: string): Promise<ProductDTO> {
    try {
      return await this.productService.getProduct(id);
    } catch (error) {
      if (error instanceof Error && error.message === "Product not found") {
        throw new NotFoundException("Product not found");
      }
      throw error;
    }
  }

  @Put(":id/deactivate")
  @HttpCode(HttpStatus.OK)
  async deactivateProduct(@Param("id") id: string): Promise<void> {
    try {
      await this.productService.deactivateProduct(id);
    } catch (error) {
      if (error instanceof Error && error.message === "Product not found") {
        throw new NotFoundException("Product not found");
      }
      throw error;
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@Param("id") id: string): Promise<void> {
    await this.productService.deleteProduct(id);
  }
}
