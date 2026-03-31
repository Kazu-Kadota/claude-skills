// src/application/use-cases/article/publish-article.ts
import { Article } from "../../../domain/article/article.js";
import type { IArticleCachePort } from "../../ports/outbound/cache/article-cache.js";
import type { IArticleRepositoryReadPort } from "../../ports/outbound/database/article/database-read.js";
import type { IArticleRepositoryWritePort } from "../../ports/outbound/database/article/database-write.js";
import type { IArticleEventBusPort } from "../../ports/outbound/messaging/article/messaging.js";
import type { IArticlesTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";

export class PublishArticleUseCase {
  constructor(
    private readonly readRepository: IArticleRepositoryReadPort,
    private readonly writeRepository: IArticleRepositoryWritePort,
    private readonly cache: IArticleCachePort,
    private readonly eventBus: IArticleEventBusPort,
    private readonly telemetry: IArticlesTelemetryPort,
  ) {}

  private async publishArticle(article: Article): Promise<void> {
    article.publish();
    const dto = article.toDTO();

    await this.writeRepository.updateOne(dto);
    await this.cache.set(dto);
    await this.eventBus.publish("article.published", {
      type: "article.published",
      payload: {
        articleId: dto.id,
        title: dto.title,
        status: dto.status,
      },
    });
  }

  async execute(id: string): Promise<void> {
    return this.telemetry.span("article.publish", async () => {
      const cached = await this.cache.get(id);
      if (cached) {
        const article = Article.reconstitute(cached);
        await this.publishArticle(article);
        return;
      }

      const projection = await this.readRepository.findById(id);
      if (!projection) throw new Error("Article not found");

      const article = Article.reconstitute(projection);
      await this.publishArticle(article);
    });
  }
}
