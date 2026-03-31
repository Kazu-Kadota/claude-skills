// src/domain/article/article.ts

export const ArticleStatus = {
  draft: "draft",
  published: "published",
} as const;

export type ArticleStatusType = keyof typeof ArticleStatus;

export type ArticleDomain = {
  id: string;
  title: string;
  content: string;
  status: ArticleStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type ArticleDTO = ArticleDomain;

export type CreateArticleParams = {
  title: string;
  content: string;
};

export class Article {
  private constructor(
    public readonly id: string,
    private title: string,
    private content: string,
    private status: ArticleStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  static create(params: CreateArticleParams): Article {
    if (!params.title) throw new Error("Must inform title to create Article");
    if (!params.content) throw new Error("Must inform content to create Article");

    return new Article(
      crypto.randomUUID(),
      params.title,
      params.content,
      ArticleStatus.draft,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  static reconstitute(raw: ArticleDTO): Article {
    return new Article(
      raw.id,
      raw.title,
      raw.content,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  publish(): void {
    if (this.status === ArticleStatus.published) {
      throw new Error("Article is already published");
    }
    this.status = ArticleStatus.published;
    this.updatedAt = new Date().toISOString();
  }

  toDTO(): ArticleDTO {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
