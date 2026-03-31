// src/domain/shipment.ts

// Status enum — always use `as const`, never TypeScript `enum`
export const ShipmentStatus = {
  pending: "pending",
  in_transit: "in_transit",
  delivered: "delivered",
  failed: "failed",
} as const;

export type ShipmentStatusType = keyof typeof ShipmentStatus;

// The full domain object — used as the transfer object across layer boundaries
export type ShipmentDomain = {
  id: string;
  orderId: string;
  recipientName: string;
  address: string;
  trackingCode: string;
  status: ShipmentStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

// DTO = what gets stored, cached, and returned to callers
export type ShipmentDTO = ShipmentDomain;

// Input for the factory method — only what the caller provides (no id, no timestamps)
export type CreateShipmentParams = {
  orderId: string;
  recipientName: string;
  address: string;
  trackingCode: string;
};

export class Shipment {
  // Private constructor enforces factory methods — callers can never do `new Shipment()`
  private constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly recipientName: string,
    public readonly address: string,
    public readonly trackingCode: string,
    private status: ShipmentStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  // Factory: validates business invariants, generates identity, sets initial state
  static create(params: CreateShipmentParams): Shipment {
    if (!params.orderId) throw new Error("Must inform orderId to create Shipment");
    if (!params.recipientName) throw new Error("Must inform recipientName to create Shipment");
    if (!params.address) throw new Error("Must inform address to create Shipment");
    if (!params.trackingCode) throw new Error("Must inform trackingCode to create Shipment");

    return new Shipment(
      crypto.randomUUID(),
      params.orderId,
      params.recipientName,
      params.address,
      params.trackingCode,
      ShipmentStatus.pending, // initial state is always pending
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  // Reconstitute: rebuilds from stored data — NO validation (trust the database)
  static reconstitute(raw: ShipmentDTO): Shipment {
    return new Shipment(
      raw.id,
      raw.orderId,
      raw.recipientName,
      raw.address,
      raw.trackingCode,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  // State transitions: mutate private state, record the time of change
  markAsInTransit(): void {
    if (this.status !== ShipmentStatus.pending) {
      throw new Error(`Cannot mark as in_transit from status '${this.status}'`);
    }
    this.status = ShipmentStatus.in_transit;
    this.updatedAt = new Date().toISOString();
  }

  markAsDelivered(): void {
    if (this.status !== ShipmentStatus.in_transit) {
      throw new Error(`Cannot mark as delivered from status '${this.status}'`);
    }
    this.status = ShipmentStatus.delivered;
    this.updatedAt = new Date().toISOString();
  }

  markAsFailed(): void {
    if (this.status === ShipmentStatus.delivered) {
      throw new Error("Cannot mark a delivered shipment as failed");
    }
    this.status = ShipmentStatus.failed;
    this.updatedAt = new Date().toISOString();
  }

  // Serialize to a plain object — used when crossing layer boundaries (to adapter, to DTO)
  toDTO(): ShipmentDTO {
    return {
      id: this.id,
      orderId: this.orderId,
      recipientName: this.recipientName,
      address: this.address,
      trackingCode: this.trackingCode,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
