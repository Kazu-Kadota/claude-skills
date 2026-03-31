// src/application/use-cases/create-product.ts
import { Product, ProductDTO } from "../../domain/product.js";
import { IInventoryCachePort } from "../ports/outbound/cache/cache.js";
import { IInventoryRepositoryWritePort } from "../ports/outbound/database/database-write.js";
import { IInventoryEventBusPort } from "../ports/outbound/messaging/messaging.js";
import { IInventoryTelemetryPort } from "../ports/outbound/telemetry/telemetry.js";

export type CreateProductUseCaseExecuteParams = {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
};

export class CreateProductUseCase {
  constructor(
    private readonly writeRepository: IInventoryRepositoryWritePort,
    private readonly cache: IInventoryCachePort,
    private readonly eventBus: IInventoryEventBusPort,
    private readonly telemetry: IInventoryTelemetryPort,
  ) {}

  async execute(input: CreateProductUseCaseExecuteParams): Promise<ProductDTO> {
    return this.telemetry.span("inventory.create", async () => {
      const entity = Product.create({
        name: input.name,
        sku: input.sku,
        price: input.price,
        quantity: input.quantity,
        category: input.category,
      });
      const dto = entity.toDTO();

      await this.writeRepository.save(dto);
      await this.cache.set(dto);
      await this.eventBus.publish("product.created", {
        type: "product.created",
        payload: {
          productId: dto.id,
          name: dto.name,
          sku: dto.sku,
          price: dto.price,
          category: dto.category,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      return dto;
    });
  }
}
