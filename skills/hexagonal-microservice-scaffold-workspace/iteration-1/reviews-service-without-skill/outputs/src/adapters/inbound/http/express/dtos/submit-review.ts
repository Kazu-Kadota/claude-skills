export type SubmitReviewBody = {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
};

export type SubmitReviewOutput = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};
