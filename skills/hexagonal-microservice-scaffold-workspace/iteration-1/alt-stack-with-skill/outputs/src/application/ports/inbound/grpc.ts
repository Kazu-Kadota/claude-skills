// src/application/ports/inbound/grpc.ts
import type { CreateShipmentUseCaseExecuteParams } from "../../use-cases/create-shipment.js";
import type { ShipmentDTO } from "../../../domain/shipment.js";

export abstract class IGRPCPort {
  abstract createShipment(body: CreateShipmentUseCaseExecuteParams): Promise<ShipmentDTO>;
  abstract getShipment(param: { id: string }): Promise<ShipmentDTO>;
  abstract markInTransit(param: { id: string }): Promise<void>;
  abstract markDelivered(param: { id: string }): Promise<void>;
  abstract markFailed(param: { id: string }): Promise<void>;
}
