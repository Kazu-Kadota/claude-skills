import { Tip } from '../tip.entity'

describe('Tip Entity', () => {
  describe('create', () => {
    it('should create a tip in draft status', () => {
      const tip = Tip.create({ content: 'A useful tip', category: 'productivity' })

      expect(tip.id).toBeDefined()
      expect(tip.content).toBe('A useful tip')
      expect(tip.category).toBe('productivity')
      expect(tip.status).toBe('draft')
      expect(tip.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute from persisted props', () => {
      const now = new Date()
      const props = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        content: 'Reconstituted tip',
        category: 'health',
        status: 'published' as const,
        createdAt: now,
        updatedAt: now,
      }
      const tip = Tip.reconstitute(props)
      expect(tip.id).toBe(props.id)
      expect(tip.category).toBe('health')
    })
  })
})
