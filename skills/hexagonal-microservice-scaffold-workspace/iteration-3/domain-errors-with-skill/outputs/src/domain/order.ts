// src/domain/order.ts

import { ConflictError, ValidationError } from './errors.js'

// Status enum — always use `as const`, never TypeScript `enum`
export const OrderStatus = {
  pending: 'pending',
  cancelled: 'cancelled',
} as const

export type OrderStatusType = keyof typeof OrderStatus

export type OrderItem = {
  productId: string
  quantity: number
  unitPrice: number
}

export type OrderDomain = {
  id: string
  customerId: string
  items: OrderItem[]
  status: OrderStatusType
  createdAt: Date | string
  updatedAt: Date | string
}

export type OrderDTO = OrderDomain

export type CreateOrderParams = {
  customerId: string
  items: OrderItem[]
}

export class Order {
  // Private constructor enforces factory methods — callers can never do `new Order()`
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    private items: OrderItem[],
    private status: OrderStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  // Factory: validates business invariants, generates identity, sets initial state
  static create(params: CreateOrderParams): Order {
    if (!params.customerId) throw new ValidationError('customerId is required')
    if (!params.items || params.items.length === 0)
      throw new ValidationError('order must have at least one item')

    for (const item of params.items) {
      if (!item.productId) throw new ValidationError('each item must have a productId')
      if (item.quantity <= 0)
        throw new ValidationError('each item quantity must be greater than zero')
      if (item.unitPrice < 0)
        throw new ValidationError('each item unitPrice must be zero or greater')
    }

    return new Order(
      crypto.randomUUID(),
      params.customerId,
      params.items,
      OrderStatus.pending,
      new Date().toISOString(),
      new Date().toISOString(),
    )
  }

  // Reconstitute: rebuilds from stored data — NO validation (trust the database)
  static reconstitute(raw: OrderDTO): Order {
    return new Order(
      raw.id,
      raw.customerId,
      raw.items,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    )
  }

  // State transition: guards against invalid transitions, mutates private state
  cancel(): void {
    if (this.status === OrderStatus.cancelled)
      throw new ConflictError(`Order ${this.id} is already cancelled`)
    this.status = OrderStatus.cancelled
    this.updatedAt = new Date().toISOString()
  }

  // Serialize to a plain object — used when crossing layer boundaries
  toDTO(): OrderDTO {
    return {
      id: this.id,
      customerId: this.customerId,
      items: this.items,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
