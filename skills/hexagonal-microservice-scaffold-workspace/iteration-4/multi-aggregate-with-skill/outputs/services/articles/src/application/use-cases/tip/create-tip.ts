// src/application/use-cases/tip/create-tip.ts
import { Tip } from "../../../domain/tip/tip.js";
import type { TipCategoryType, TipDTO } from "../../../domain/tip/tip.js";
import type { ITipCachePort } from "../../ports/outbound/cache/tip-cache.js";
import type { ITipRepositoryWritePort } from "../../ports/outbound/database/tip/database-write.js";
import type { IArticlesTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";

export type CreateTipUseCaseExecuteParams = {
  content: string;
  category: TipCategoryType;
};

export class CreateTipUseCase {
  constructor(
    private readonly writeRepository: ITipRepositoryWritePort,
    private readonly cache: ITipCachePort,
    private readonly telemetry: IArticlesTelemetryPort,
  ) {}

  async execute(input: CreateTipUseCaseExecuteParams): Promise<TipDTO> {
    return this.telemetry.span("tip.create", async () => {
      const tip = Tip.create({
        content: input.content,
        category: input.category,
      });
      const dto = tip.toDTO();

      await this.writeRepository.save(dto);
      await this.cache.set(dto);

      return dto;
    });
  }
}
