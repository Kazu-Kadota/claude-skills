// src/application/ports/outbound/cache/tip-cache.ts
import type { TipDTO } from "../../../../domain/tip/tip.js";

export abstract class ITipCachePort {
  abstract get(id: string): Promise<TipDTO | null>;
  abstract set(entity: TipDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
