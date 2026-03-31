import { randomUUID } from 'crypto'

export type ArticleStatus = 'draft' | 'published'

export interface ArticleProps {
  id: string
  title: string
  content: string
  status: ArticleStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreateArticleProps {
  title: string
  content: string
}

export class Article {
  private readonly _id: string
  private _title: string
  private _content: string
  private _status: ArticleStatus
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(props: ArticleProps) {
    this._id = props.id
    this._title = props.title
    this._content = props.content
    this._status = props.status
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  static create(props: CreateArticleProps): Article {
    const now = new Date()
    return new Article({
      id: randomUUID(),
      title: props.title,
      content: props.content,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: ArticleProps): Article {
    return new Article(props)
  }

  publish(): void {
    if (this._status === 'published') {
      throw new Error(`Article ${this._id} is already published`)
    }
    this._status = 'published'
    this._updatedAt = new Date()
  }

  get id(): string {
    return this._id
  }

  get title(): string {
    return this._title
  }

  get content(): string {
    return this._content
  }

  get status(): ArticleStatus {
    return this._status
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  toProps(): ArticleProps {
    return {
      id: this._id,
      title: this._title,
      content: this._content,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
