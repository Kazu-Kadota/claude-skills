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

export type OrderDTO = {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatusType;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderParams = {
  customerId: string;
  items: OrderItem[];
};

export class Order {
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly items: OrderItem[],
    private status: OrderStatusType,
    private readonly createdAt: string,
    private updatedAt: string,
  ) {}

  static create(params: CreateOrderParams): Order {
    if (!params.customerId) throw new Error("Must inform customerId to create Order");
    if (!params.items || params.items.length === 0)
      throw new Error("Order must contain at least one item in items array");

    for (const item of params.items) {
      if (!item.productId) throw new Error("Each item must have a valid productId");
      if (item.quantity <= 0) throw new Error("Each item quantity must be greater than zero");
      if (item.unitPrice < 0) throw new Error("Each item unitPrice must be greater than or equal to zero");
    }

    const now = new Date().toISOString();
    return new Order(
      crypto.randomUUID(),
      params.customerId,
      [...params.items],
      OrderStatus.pending,
      now,
      now,
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
      throw new Error("Order is already cancelled and cannot be cancelled again");
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
