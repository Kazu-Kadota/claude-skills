// src/adapters/inbound/http/nest/review.controller.ts
import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ReviewService } from "./review.service.js";
import { SubmitReviewDto, ListReviewsByProductDto } from "./dtos/review.js";

@Controller("reviews")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async submitReview(@Body() body: SubmitReviewDto) {
    return await this.reviewService.submitReview(body);
  }

  @Get("product/:productId")
  async listReviewsByProduct(
    @Param("productId") productId: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ) {
    return await this.reviewService.listReviewsByProduct({ productId, page, pageSize });
  }

  @Get(":id")
  async getReview(@Param("id") id: string) {
    return await this.reviewService.getReview(id);
  }

  @Put(":id/approve")
  async approveReview(@Param("id") id: string) {
    await this.reviewService.approveReview(id);
  }

  @Put(":id/reject")
  async rejectReview(@Param("id") id: string) {
    await this.reviewService.rejectReview(id);
  }
}
