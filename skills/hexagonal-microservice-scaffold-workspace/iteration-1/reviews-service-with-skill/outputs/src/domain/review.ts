// src/domain/review.ts

// Status enum — always use `as const`, never TypeScript `enum`
export const ReviewStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export type ReviewStatusType = keyof typeof ReviewStatus;

// The full domain object — used as the transfer object across layer boundaries
export type ReviewDomain = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
  status: ReviewStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

// DTO = what gets stored, cached, and returned to callers
export type ReviewDTO = ReviewDomain;

// Input for the factory method — only what the caller provides
export type CreateReviewParams = {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
};

export class Review {
  // Private constructor enforces factory methods — callers can never do `new Review()`
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly userId: string,
    public readonly rating: number,
    private comment: string | undefined,
    private status: ReviewStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  // Factory: validates business invariants, generates identity, sets initial state
  static create(params: CreateReviewParams): Review {
    if (!params.productId) throw new Error("Must inform productId to create Review");
    if (!params.userId) throw new Error("Must inform userId to create Review");
    if (params.rating < 1 || params.rating > 5) throw new Error("Review rating must be between 1 and 5");

    return new Review(
      crypto.randomUUID(),
      params.productId,
      params.userId,
      params.rating,
      params.comment,
      ReviewStatus.pending,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  // Reconstitute: rebuilds from stored data — NO validation (trust the database)
  static reconstitute(raw: ReviewDTO): Review {
    return new Review(
      raw.id,
      raw.productId,
      raw.userId,
      raw.rating,
      raw.comment,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  // State transition: approve the review
  approve(): void {
    this.status = ReviewStatus.approved;
    this.updatedAt = new Date().toISOString();
  }

  // State transition: reject the review
  reject(): void {
    this.status = ReviewStatus.rejected;
    this.updatedAt = new Date().toISOString();
  }

  // Serialize to a plain object — used when crossing layer boundaries
  toDTO(): ReviewDTO {
    return {
      id: this.id,
      productId: this.productId,
      userId: this.userId,
      rating: this.rating,
      comment: this.comment,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
