// src/application/ports/inbound/http.ts
import type { CreateArticleUseCaseExecuteParams } from "../../use-cases/article/create-article.js";
import type { CreateTipUseCaseExecuteParams } from "../../use-cases/tip/create-tip.js";

export abstract class IHTTPSPort {
  // Article use cases
  abstract createArticle(body: CreateArticleUseCaseExecuteParams): Promise<unknown>;
  abstract getArticle(param: { id: string }): Promise<unknown>;
  abstract publishArticle(param: { id: string }): Promise<unknown>;

  // Tip use cases
  abstract createTip(body: CreateTipUseCaseExecuteParams): Promise<unknown>;
  abstract getTip(param: { id: string }): Promise<unknown>;
}
