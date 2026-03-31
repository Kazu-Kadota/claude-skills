// src/adapters/inbound/grpc/shipment-handler.ts
// gRPC server handler — implements IGRPCPort, maps proto messages to use case calls.
import type { ServerUnaryCall, sendUnaryData, ServiceDefinition, UntypedHandleCall } from "@grpc/grpc-js";
import { status as GrpcStatus } from "@grpc/grpc-js";
import { IGRPCPort } from "../../../application/ports/inbound/grpc.js";
import { CreateShipmentUseCase } from "../../../application/use-cases/create-shipment.js";
import { GetShipmentUseCase } from "../../../application/use-cases/get-shipment.js";
import { MarkInTransitUseCase } from "../../../application/use-cases/mark-in-transit.js";
import { MarkDeliveredUseCase } from "../../../application/use-cases/mark-delivered.js";
import { MarkFailedUseCase } from "../../../application/use-cases/mark-failed.js";
import type { ShipmentDTO } from "../../../domain/shipment.js";

// Proto-generated message types (simplified — actual generated types come from proto compilation)
interface CreateShipmentRequest {
  order_id: string;
  recipient_name: string;
  address: string;
  tracking_code: string;
}

interface GetShipmentRequest {
  id: string;
}

interface ShipmentIdRequest {
  id: string;
}

interface ShipmentResponse {
  id: string;
  order_id: string;
  recipient_name: string;
  address: string;
  tracking_code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface EmptyResponse {}

function toShipmentResponse(dto: ShipmentDTO): ShipmentResponse {
  return {
    id: dto.id,
    order_id: dto.orderId,
    recipient_name: dto.recipientName,
    address: dto.address,
    tracking_code: dto.trackingCode,
    status: dto.status,
    created_at: String(dto.createdAt),
    updated_at: String(dto.updatedAt),
  };
}

export class ShipmentGrpcHandler implements IGRPCPort {
  constructor(
    private readonly createShipmentUseCase: CreateShipmentUseCase,
    private readonly getShipmentUseCase: GetShipmentUseCase,
    private readonly markInTransitUseCase: MarkInTransitUseCase,
    private readonly markDeliveredUseCase: MarkDeliveredUseCase,
    private readonly markFailedUseCase: MarkFailedUseCase,
  ) {}

  async createShipment(body: {
    orderId: string;
    recipientName: string;
    address: string;
    trackingCode: string;
  }): Promise<ShipmentDTO> {
    return this.createShipmentUseCase.execute(body);
  }

  async getShipment(param: { id: string }): Promise<ShipmentDTO> {
    return this.getShipmentUseCase.execute(param.id);
  }

  async markInTransit(param: { id: string }): Promise<void> {
    return this.markInTransitUseCase.execute(param.id);
  }

  async markDelivered(param: { id: string }): Promise<void> {
    return this.markDeliveredUseCase.execute(param.id);
  }

  async markFailed(param: { id: string }): Promise<void> {
    return this.markFailedUseCase.execute(param.id);
  }

  /**
   * Returns the gRPC service implementation object that can be passed directly
   * to grpc.Server.addService(). All request/response serialization happens here —
   * use cases receive and return plain domain types.
   */
  buildServiceImpl(): Record<string, UntypedHandleCall> {
    return {
      createShipment: async (
        call: ServerUnaryCall<CreateShipmentRequest, ShipmentResponse>,
        callback: sendUnaryData<ShipmentResponse>,
      ) => {
        try {
          const dto = await this.createShipment({
            orderId: call.request.order_id,
            recipientName: call.request.recipient_name,
            address: call.request.address,
            trackingCode: call.request.tracking_code,
          });
          callback(null, toShipmentResponse(dto));
        } catch (error) {
          callback({
            code: GrpcStatus.INTERNAL,
            message: error instanceof Error ? error.message : "Internal server error",
          });
        }
      },

      getShipment: async (
        call: ServerUnaryCall<GetShipmentRequest, ShipmentResponse>,
        callback: sendUnaryData<ShipmentResponse>,
      ) => {
        try {
          const dto = await this.getShipment({ id: call.request.id });
          callback(null, toShipmentResponse(dto));
        } catch (error) {
          if (error instanceof Error && error.message === "Shipment not found") {
            callback({ code: GrpcStatus.NOT_FOUND, message: "Shipment not found" });
            return;
          }
          callback({
            code: GrpcStatus.INTERNAL,
            message: error instanceof Error ? error.message : "Internal server error",
          });
        }
      },

      markInTransit: async (
        call: ServerUnaryCall<ShipmentIdRequest, EmptyResponse>,
        callback: sendUnaryData<EmptyResponse>,
      ) => {
        try {
          await this.markInTransit({ id: call.request.id });
          callback(null, {});
        } catch (error) {
          if (error instanceof Error && error.message === "Shipment not found") {
            callback({ code: GrpcStatus.NOT_FOUND, message: "Shipment not found" });
            return;
          }
          callback({
            code: GrpcStatus.INTERNAL,
            message: error instanceof Error ? error.message : "Internal server error",
          });
        }
      },

      markDelivered: async (
        call: ServerUnaryCall<ShipmentIdRequest, EmptyResponse>,
        callback: sendUnaryData<EmptyResponse>,
      ) => {
        try {
          await this.markDelivered({ id: call.request.id });
          callback(null, {});
        } catch (error) {
          if (error instanceof Error && error.message === "Shipment not found") {
            callback({ code: GrpcStatus.NOT_FOUND, message: "Shipment not found" });
            return;
          }
          callback({
            code: GrpcStatus.INTERNAL,
            message: error instanceof Error ? error.message : "Internal server error",
          });
        }
      },

      markFailed: async (
        call: ServerUnaryCall<ShipmentIdRequest, EmptyResponse>,
        callback: sendUnaryData<EmptyResponse>,
      ) => {
        try {
          await this.markFailed({ id: call.request.id });
          callback(null, {});
        } catch (error) {
          if (error instanceof Error && error.message === "Shipment not found") {
            callback({ code: GrpcStatus.NOT_FOUND, message: "Shipment not found" });
            return;
          }
          callback({
            code: GrpcStatus.INTERNAL,
            message: error instanceof Error ? error.message : "Internal server error",
          });
        }
      },
    };
  }
}
