// src/adapters/inbound/http/nest/dtos/review.ts
import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class SubmitReviewDto {
  @IsString()
  productId!: string;

  @IsString()
  userId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ListReviewsByProductDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;
}
