export interface TipReadModel {
  id: string
  content: string
  category: string
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
}
