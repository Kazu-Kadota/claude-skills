import { Article } from '../article.entity'

describe('Article Entity', () => {
  describe('create', () => {
    it('should create an article in draft status', () => {
      const article = Article.create({ title: 'Test Title', content: 'Test content' })

      expect(article.id).toBeDefined()
      expect(article.title).toBe('Test Title')
      expect(article.content).toBe('Test content')
      expect(article.status).toBe('draft')
      expect(article.createdAt).toBeInstanceOf(Date)
      expect(article.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('publish', () => {
    it('should change status to published', () => {
      const article = Article.create({ title: 'Test', content: 'Content' })
      article.publish()
      expect(article.status).toBe('published')
    })

    it('should throw when publishing an already published article', () => {
      const article = Article.create({ title: 'Test', content: 'Content' })
      article.publish()
      expect(() => article.publish()).toThrow('already published')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute from persisted props', () => {
      const now = new Date()
      const props = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Persisted',
        content: 'Content',
        status: 'published' as const,
        createdAt: now,
        updatedAt: now,
      }
      const article = Article.reconstitute(props)
      expect(article.id).toBe(props.id)
      expect(article.status).toBe('published')
    })
  })
})
