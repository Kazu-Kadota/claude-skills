// src/domain/order.ts

export const OrderStatus = {
  pending: "pending",
  cancelled: "cancelled",
} as const;

export type OrderStatusType = keyof typeof OrderStatus;

export type OrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type OrderDomain = {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type OrderDTO = OrderDomain;

export type CreateOrderParams = {
  customerId: string;
  items: OrderItem[];
};

export class Order {
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    private items: OrderItem[],
    private status: OrderStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  static create(params: CreateOrderParams): Order {
    if (!params.customerId) throw new Error("customerId is required");
    if (!params.items || params.items.length === 0)
      throw new Error("Order must have at least one item");

    for (const item of params.items) {
      if (!item.productId) throw new Error("Each item must have a productId");
      if (item.quantity <= 0)
        throw new Error("Item quantity must be greater than zero");
      if (item.unitPrice < 0)
        throw new Error("Item unitPrice must be non-negative");
    }

    return new Order(
      crypto.randomUUID(),
      params.customerId,
      params.items,
      OrderStatus.pending,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  static reconstitute(raw: OrderDTO): Order {
    return new Order(
      raw.id,
      raw.customerId,
      raw.items,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  cancel(): void {
    if (this.status === OrderStatus.cancelled) {
      throw new Error("Order is already cancelled");
    }
    this.status = OrderStatus.cancelled;
    this.updatedAt = new Date().toISOString();
  }

  toDTO(): OrderDTO {
    return {
      id: this.id,
      customerId: this.customerId,
      items: this.items,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
