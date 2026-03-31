// src/application/use-cases/article/create-article.ts
import { Article } from "../../../domain/article/article.js";
import type { ArticleDTO } from "../../../domain/article/article.js";
import type { IArticleCachePort } from "../../ports/outbound/cache/article-cache.js";
import type { IArticleRepositoryWritePort } from "../../ports/outbound/database/article/database-write.js";
import type { IArticleEventBusPort } from "../../ports/outbound/messaging/article/messaging.js";
import type { IArticlesTelemetryPort } from "../../ports/outbound/telemetry/telemetry.js";

export type CreateArticleUseCaseExecuteParams = {
  title: string;
  content: string;
};

export class CreateArticleUseCase {
  constructor(
    private readonly writeRepository: IArticleRepositoryWritePort,
    private readonly cache: IArticleCachePort,
    private readonly eventBus: IArticleEventBusPort,
    private readonly telemetry: IArticlesTelemetryPort,
  ) {}

  async execute(input: CreateArticleUseCaseExecuteParams): Promise<ArticleDTO> {
    return this.telemetry.span("article.create", async () => {
      const article = Article.create({
        title: input.title,
        content: input.content,
      });
      const dto = article.toDTO();

      await this.writeRepository.save(dto);
      await this.cache.set(dto);
      await this.eventBus.publish("article.created", {
        type: "article.created",
        payload: {
          articleId: dto.id,
          title: dto.title,
          status: dto.status,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      return dto;
    });
  }
}
