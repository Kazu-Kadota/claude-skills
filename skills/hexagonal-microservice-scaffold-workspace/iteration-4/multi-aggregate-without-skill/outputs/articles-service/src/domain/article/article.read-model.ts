export interface ArticleReadModel {
  id: string
  title: string
  content: string
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
}
