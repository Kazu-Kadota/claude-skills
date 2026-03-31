// src/adapters/inbound/http/express/article/dtos/create-article.ts
import type { ArticleDTO } from "../../../../../../domain/article/article.js";

export type CreateArticleBody = {
  title: string;
  content: string;
};

export type CreateArticleOutput = ArticleDTO;
