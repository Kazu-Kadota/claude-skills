import { Schema, model, Document } from 'mongoose'

export interface ArticleDocument extends Document {
  _id: string
  title: string
  content: string
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
}

const ArticleSchema = new Schema<ArticleDocument>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    _id: false,
    versionKey: false,
  },
)

ArticleSchema.index({ status: 1 })
ArticleSchema.index({ createdAt: -1 })

export const ArticleModel = model<ArticleDocument>('Article', ArticleSchema, 'articles')
