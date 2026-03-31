// src/domain/tip/tip.ts

export const TipStatus = {
  draft: "draft",
  published: "published",
} as const;

export type TipStatusType = keyof typeof TipStatus;

export const TipCategory = {
  general: "general",
  tutorial: "tutorial",
  howto: "howto",
  news: "news",
} as const;

export type TipCategoryType = keyof typeof TipCategory;

export type TipDomain = {
  id: string;
  content: string;
  category: TipCategoryType;
  status: TipStatusType;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type TipDTO = TipDomain;

export type CreateTipParams = {
  content: string;
  category: TipCategoryType;
};

export class Tip {
  private constructor(
    public readonly id: string,
    private content: string,
    private category: TipCategoryType,
    private status: TipStatusType,
    private readonly createdAt: Date | string,
    private updatedAt: Date | string,
  ) {}

  static create(params: CreateTipParams): Tip {
    if (!params.content) throw new Error("Must inform content to create Tip");
    if (!params.category) throw new Error("Must inform category to create Tip");

    return new Tip(
      crypto.randomUUID(),
      params.content,
      params.category,
      TipStatus.draft,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  static reconstitute(raw: TipDTO): Tip {
    return new Tip(
      raw.id,
      raw.content,
      raw.category,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  toDTO(): TipDTO {
    return {
      id: this.id,
      content: this.content,
      category: this.category,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
