// src/adapters/inbound/grpc/shipment-controller.ts
import { ServerUnaryCall, sendUnaryData, status as grpcStatus } from "@grpc/grpc-js";
import { IGRPCPort } from "../../../application/ports/inbound/grpc.js";
import { CreateShipmentUseCase } from "../../../application/use-cases/create-shipment.js";
import { GetShipmentUseCase } from "../../../application/use-cases/get-shipment.js";
import { MarkInTransitShipmentUseCase } from "../../../application/use-cases/mark-in-transit-shipment.js";
import { MarkDeliveredShipmentUseCase } from "../../../application/use-cases/mark-delivered-shipment.js";
import { MarkFailedShipmentUseCase } from "../../../application/use-cases/mark-failed-shipment.js";

export class ShipmentController implements IGRPCPort {
  constructor(
    private readonly createShipmentUseCase: CreateShipmentUseCase,
    private readonly getShipmentUseCase: GetShipmentUseCase,
    private readonly markInTransitUseCase: MarkInTransitShipmentUseCase,
    private readonly markDeliveredUseCase: MarkDeliveredShipmentUseCase,
    private readonly markFailedUseCase: MarkFailedShipmentUseCase,
  ) {}

  async createShipment(body: {
    orderId: string;
    recipientName: string;
    address: string;
    trackingCode: string;
  }): Promise<unknown> {
    return await this.createShipmentUseCase.execute(body);
  }

  async getShipment(param: { id: string }): Promise<unknown> {
    return await this.getShipmentUseCase.execute(param.id);
  }

  async markAsInTransit(param: { id: string }): Promise<unknown> {
    await this.markInTransitUseCase.execute(param.id);
    return { success: true };
  }

  async markAsDelivered(param: { id: string }): Promise<unknown> {
    await this.markDeliveredUseCase.execute(param.id);
    return { success: true };
  }

  async markAsFailed(param: { id: string }): Promise<unknown> {
    await this.markFailedUseCase.execute(param.id);
    return { success: true };
  }

  // Builds the gRPC service implementation object consumed by grpc.Server.addService()
  buildServiceImpl() {
    return {
      createShipment: async (
        call: ServerUnaryCall<
          { orderId: string; recipientName: string; address: string; trackingCode: string },
          unknown
        >,
        callback: sendUnaryData<unknown>,
      ) => {
        try {
          const result = await this.createShipment(call.request);
          callback(null, result);
        } catch (error) {
          callback({ code: grpcStatus.INTERNAL, message: (error as Error).message }, null);
        }
      },

      getShipment: async (
        call: ServerUnaryCall<{ id: string }, unknown>,
        callback: sendUnaryData<unknown>,
      ) => {
        try {
          const result = await this.getShipment(call.request);
          callback(null, result);
        } catch (error) {
          const err = error as Error;
          if (err.message === "Shipment not found") {
            callback({ code: grpcStatus.NOT_FOUND, message: err.message }, null);
            return;
          }
          callback({ code: grpcStatus.INTERNAL, message: err.message }, null);
        }
      },

      markAsInTransit: async (
        call: ServerUnaryCall<{ id: string }, unknown>,
        callback: sendUnaryData<unknown>,
      ) => {
        try {
          const result = await this.markAsInTransit(call.request);
          callback(null, result);
        } catch (error) {
          const err = error as Error;
          if (err.message === "Shipment not found") {
            callback({ code: grpcStatus.NOT_FOUND, message: err.message }, null);
            return;
          }
          callback({ code: grpcStatus.FAILED_PRECONDITION, message: err.message }, null);
        }
      },

      markAsDelivered: async (
        call: ServerUnaryCall<{ id: string }, unknown>,
        callback: sendUnaryData<unknown>,
      ) => {
        try {
          const result = await this.markAsDelivered(call.request);
          callback(null, result);
        } catch (error) {
          const err = error as Error;
          if (err.message === "Shipment not found") {
            callback({ code: grpcStatus.NOT_FOUND, message: err.message }, null);
            return;
          }
          callback({ code: grpcStatus.FAILED_PRECONDITION, message: err.message }, null);
        }
      },

      markAsFailed: async (
        call: ServerUnaryCall<{ id: string }, unknown>,
        callback: sendUnaryData<unknown>,
      ) => {
        try {
          const result = await this.markAsFailed(call.request);
          callback(null, result);
        } catch (error) {
          const err = error as Error;
          if (err.message === "Shipment not found") {
            callback({ code: grpcStatus.NOT_FOUND, message: err.message }, null);
            return;
          }
          callback({ code: grpcStatus.FAILED_PRECONDITION, message: err.message }, null);
        }
      },
    };
  }
}
