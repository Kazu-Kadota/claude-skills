import { ConflictError, ValidationError } from './errors';

// ---------------------------------------------------------------------------
// Value objects / supporting types
// ---------------------------------------------------------------------------

export type OrderStatus = 'pending' | 'cancelled';

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// ---------------------------------------------------------------------------
// Order entity
// ---------------------------------------------------------------------------

export interface OrderProps {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  readonly id: string;
  readonly customerId: string;
  readonly items: OrderItem[];
  private _status: OrderStatus;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: OrderProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.items = props.items;
    this._status = props.status;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  get status(): OrderStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ---------------------------------------------------------------------------
  // Factory
  // ---------------------------------------------------------------------------

  static create(props: Omit<OrderProps, 'status' | 'createdAt' | 'updatedAt'>): Order {
    Order.validateItems(props.items);

    const now = new Date();
    return new Order({
      ...props,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstitute an Order from a persistence snapshot (no invariant re-check). */
  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  // ---------------------------------------------------------------------------
  // Domain behaviour
  // ---------------------------------------------------------------------------

  /**
   * Transition the order to the "cancelled" status.
   *
   * @throws {ConflictError} if the order has already been cancelled.
   */
  cancel(): void {
    if (this._status === 'cancelled') {
      throw new ConflictError(
        `Order "${this.id}" cannot be cancelled because it is already in status "${this._status}".`,
      );
    }

    this._status = 'cancelled';
    this._updatedAt = new Date();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private static validateItems(items: OrderItem[]): void {
    if (!items || items.length === 0) {
      throw new ValidationError('An order must contain at least one item.', {
        items: 'must not be empty',
      });
    }

    const details: Record<string, string> = {};

    items.forEach((item, idx) => {
      if (!item.productId || item.productId.trim() === '') {
        details[`items[${idx}].productId`] = 'must not be blank';
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        details[`items[${idx}].quantity`] = 'must be a positive integer';
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        details[`items[${idx}].unitPrice`] = 'must be a non-negative number';
      }
    });

    if (Object.keys(details).length > 0) {
      throw new ValidationError('One or more order items are invalid.', details);
    }
  }

  // ---------------------------------------------------------------------------
  // Serialisation helper
  // ---------------------------------------------------------------------------

  toJSON(): OrderProps {
    return {
      id: this.id,
      customerId: this.customerId,
      items: this.items,
      status: this._status,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
