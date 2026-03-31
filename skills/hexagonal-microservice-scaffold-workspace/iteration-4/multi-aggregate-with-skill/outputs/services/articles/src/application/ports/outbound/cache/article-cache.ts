// src/application/ports/outbound/cache/article-cache.ts
import type { ArticleDTO } from "../../../../domain/article/article.js";

export abstract class IArticleCachePort {
  abstract get(id: string): Promise<ArticleDTO | null>;
  abstract set(entity: ArticleDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
