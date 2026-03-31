// src/application/use-cases/article/get-article.ts
import type { IArticleCachePort } from "../../ports/outbound/cache/article-cache.js";
import type { IArticleRepositoryReadPort } from "../../ports/outbound/database/article/database-read.js";
import type { IArticlesTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";

export class GetArticleUseCase {
  constructor(
    private readonly readRepository: IArticleRepositoryReadPort,
    private readonly cache: IArticleCachePort,
    private readonly telemetry: IArticlesTelemetryPort,
  ) {}

  async execute(id: string) {
    return this.telemetry.span("article.get", async () => {
      const cached = await this.cache.get(id);
      if (cached) return cached;

      const article = await this.readRepository.findById(id);
      if (!article) throw new Error("Article not found");

      await this.cache.set(article);
      return article;
    });
  }
}
