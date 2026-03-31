// src/application/ports/inbound/grpc.ts
import { CreateShipmentUseCaseExecuteParams } from "../../use-cases/create-shipment.js";

export abstract class IGRPCPort {
  abstract createShipment(body: CreateShipmentUseCaseExecuteParams): Promise<unknown>;
  abstract getShipment(param: { id: string }): Promise<unknown>;
  abstract markAsInTransit(param: { id: string }): Promise<unknown>;
  abstract markAsDelivered(param: { id: string }): Promise<unknown>;
  abstract markAsFailed(param: { id: string }): Promise<unknown>;
}
