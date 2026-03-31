export type GetReviewParams = {
  id: string;
};

export type GetReviewOutput = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};
