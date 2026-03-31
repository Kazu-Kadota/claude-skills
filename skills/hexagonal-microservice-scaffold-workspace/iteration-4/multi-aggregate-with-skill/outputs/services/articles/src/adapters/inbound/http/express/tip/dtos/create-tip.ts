// src/adapters/inbound/http/express/tip/dtos/create-tip.ts
import type { TipCategoryType, TipDTO } from "../../../../../../domain/tip/tip.js";

export type CreateTipBody = {
  content: string;
  category: TipCategoryType;
};

export type CreateTipOutput = TipDTO;
