// src/adapters/inbound/http/express/article/dtos/get-article.ts
import type { ArticleDTO } from "../../../../../../domain/article/article.js";

export type GetArticleParams = {
  id: string;
};

export type GetArticleOutput = ArticleDTO;
