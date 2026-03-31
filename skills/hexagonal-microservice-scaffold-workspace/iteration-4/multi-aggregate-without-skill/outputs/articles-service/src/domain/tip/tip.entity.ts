import { randomUUID } from 'crypto'

export type TipStatus = 'draft' | 'published'

export interface TipProps {
  id: string
  content: string
  category: string
  status: TipStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreateTipProps {
  content: string
  category: string
}

export class Tip {
  private readonly _id: string
  private _content: string
  private _category: string
  private _status: TipStatus
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(props: TipProps) {
    this._id = props.id
    this._content = props.content
    this._category = props.category
    this._status = props.status
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  static create(props: CreateTipProps): Tip {
    const now = new Date()
    return new Tip({
      id: randomUUID(),
      content: props.content,
      category: props.category,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: TipProps): Tip {
    return new Tip(props)
  }

  get id(): string {
    return this._id
  }

  get content(): string {
    return this._content
  }

  get category(): string {
    return this._category
  }

  get status(): TipStatus {
    return this._status
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  toProps(): TipProps {
    return {
      id: this._id,
      content: this._content,
      category: this._category,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
