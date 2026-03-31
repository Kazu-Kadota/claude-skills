// src/application/use-cases/tip/get-tip.ts
import type { ITipCachePort } from "../../ports/outbound/cache/tip-cache.js";
import type { ITipRepositoryReadPort } from "../../ports/outbound/database/tip/database-read.js";
import type { IArticlesTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";

export class GetTipUseCase {
  constructor(
    private readonly readRepository: ITipRepositoryReadPort,
    private readonly cache: ITipCachePort,
    private readonly telemetry: IArticlesTelemetryPort,
  ) {}

  async execute(id: string) {
    return this.telemetry.span("tip.get", async () => {
      const cached = await this.cache.get(id);
      if (cached) return cached;

      const tip = await this.readRepository.findById(id);
      if (!tip) throw new Error("Tip not found");

      await this.cache.set(tip);
      return tip;
    });
  }
}
