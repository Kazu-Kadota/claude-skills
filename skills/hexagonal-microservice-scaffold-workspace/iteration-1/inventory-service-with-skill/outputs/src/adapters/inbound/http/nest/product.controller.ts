// src/adapters/inbound/http/nest/product.controller.ts
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from "@nestjs/common";
import { ProductService } from "./product.service.js";
import { CreateProductDto } from "./dtos/product.js";

@Controller("product")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(201)
  async createProduct(@Body() body: CreateProductDto) {
    return await this.productService.createProduct(body);
  }

  @Get(":id")
  @HttpCode(200)
  async getProduct(@Param("id") id: string) {
    return await this.productService.getProduct(id);
  }

  @Put(":id/deactivate")
  @HttpCode(200)
  async deactivateProduct(@Param("id") id: string) {
    await this.productService.deactivateProduct(id);
  }

  @Delete(":id")
  @HttpCode(204)
  async deleteProduct(@Param("id") id: string) {
    await this.productService.deleteProduct(id);
  }
}
