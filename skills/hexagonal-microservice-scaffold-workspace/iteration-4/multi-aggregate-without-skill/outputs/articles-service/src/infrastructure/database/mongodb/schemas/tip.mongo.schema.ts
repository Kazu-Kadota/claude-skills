import { Schema, model, Document } from 'mongoose'

export interface TipDocument extends Document {
  _id: string
  content: string
  category: string
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
}

const TipSchema = new Schema<TipDocument>(
  {
    _id: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    _id: false,
    versionKey: false,
  },
)

TipSchema.index({ category: 1 })
TipSchema.index({ status: 1 })

export const TipModel = model<TipDocument>('Tip', TipSchema, 'tips')
