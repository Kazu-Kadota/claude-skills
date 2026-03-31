export interface ArticleCreatedEvent {
  eventType: 'article.created'
  payload: {
    articleId: string
    title: string
    content: string
    status: 'draft' | 'published'
    createdAt: string
  }
}

export interface ArticlePublishedEvent {
  eventType: 'article.published'
  payload: {
    articleId: string
    title: string
    publishedAt: string
  }
}

export type ArticleDomainEvent = ArticleCreatedEvent | ArticlePublishedEvent
