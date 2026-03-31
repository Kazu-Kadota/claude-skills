export const ReviewStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export type ReviewStatusType = keyof typeof ReviewStatus;

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

export type ReviewDTO = ReviewDomain;

export type ReviewCreateDTO = {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
};

export class Review {
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly userId: string,
    public rating: number,
    public comment: string | undefined,
    private status: ReviewStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  static create(dto: ReviewCreateDTO): Review {
    if (!dto.productId) throw new Error("Must inform productId to create Review");
    if (!dto.userId) throw new Error("Must inform userId to create Review");
    if (dto.rating < 1 || dto.rating > 5) throw new Error("Rating must be between 1 and 5");

    return new Review(
      crypto.randomUUID(),
      dto.productId,
      dto.userId,
      dto.rating,
      dto.comment,
      ReviewStatus.pending,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

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

  approve(): void {
    if (this.status !== ReviewStatus.pending) {
      throw new Error("Only pending reviews can be approved");
    }
    this.status = ReviewStatus.approved;
    this.updatedAt = new Date().toISOString();
  }

  reject(): void {
    if (this.status !== ReviewStatus.pending) {
      throw new Error("Only pending reviews can be rejected");
    }
    this.status = ReviewStatus.rejected;
    this.updatedAt = new Date().toISOString();
  }

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
