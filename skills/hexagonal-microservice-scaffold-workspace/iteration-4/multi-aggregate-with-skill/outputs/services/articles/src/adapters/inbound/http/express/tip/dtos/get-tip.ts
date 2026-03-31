// src/adapters/inbound/http/express/tip/dtos/get-tip.ts
import type { TipDTO } from "../../../../../../domain/tip/tip.js";

export type GetTipParams = {
  id: string;
};

export type GetTipOutput = TipDTO;
