// src/application/ports/outbound/database/article/database-write.ts
import type { ArticleDTO } from "../../../../../domain/article/article.js";
import type { ArticleFindByIdProjection } from "./database-read.js";

export abstract class IArticleRepositoryWritePort {
  abstract findById(id: string): Promise<ArticleFindByIdProjection | null>;
  abstract save(entity: ArticleDTO): Promise<void>;
  abstract updateOne(entity: ArticleDTO): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
