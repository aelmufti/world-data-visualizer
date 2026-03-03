/**
 * Unit tests for NewsApiAdapter
 * 
 * Tests API key validation, article fetching, normalization, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NewsApiAdapter } from './NewsApiAdapter'

describe('NewsApiAdapter', () => {
  describe('Configuration and Validation', () => {
    it('should be configured with valid API key', () => {
      const adapter = new NewsApiAdapter('test-api-key-123')
      expect(adapter.isConfigured()).toBe(true)
    })

    it('should not be configured with empty API key', () => {
      const adapter = new NewsApiAdapter('')
      expect(adapter.isConfigured()).toBe(false)
    })

    it('should not be configured with whitespace-only API key', () => {
      const adapter = new NewsApiAdapter('   ')
      expect(adapter.isConfigured()).toBe(false)
    })

    it('should have correct name', () => {
      const adapter = new NewsApiAdapter('test-key')
      expect(adapter.name).toBe('NewsAPI')
    })
  })

  describe('Status Tracking', () => {
    it('should initialize with available status', () => {
      const adapter = new NewsApiAdapter('test-key')
      const status = adapter.getStatus()
      
      expect(status.available).toBe(true)
      expect(status.consecutiveFailures).toBe(0)
      expect(status.lastSuccess).toBeNull()
      expect(status.lastError).toBeNull()
    })
  })

  describe('Fetch Articles - Validation', () => {
    it('should throw error when not configured', async () => {
      const adapter = new NewsApiAdapter('')
      
      await expect(
        adapter.fetchArticles(['energy', 'oil'], 10)
      ).rejects.toThrow('NewsAPI adapter not configured')
    })

    it('should throw error with empty keywords array', async () => {
      const adapter = new NewsApiAdapter('test-key')
      
      await expect(
        adapter.fetchArticles([], 10)
      ).rejects.toThrow('Keywords array cannot be empty')
    })
  })

  describe('Fetch Articles - Success Cases', () => {
    beforeEach(() => {
      // Mock successful fetch response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 2,
          articles: [
            {
              title: 'Oil prices surge amid Middle East tensions',
              description: 'Crude oil prices jumped 5% today as geopolitical tensions escalate in the region.',
              publishedAt: '2025-01-15T10:30:00Z',
              url: 'https://example.com/article1',
              source: { name: 'Example News' }
            },
            {
              title: 'OPEC announces production cuts',
              description: 'The oil cartel agreed to reduce output by 1 million barrels per day.',
              publishedAt: '2025-01-15T09:15:00Z',
              url: 'https://example.com/article2',
              source: { name: 'Energy Today' }
            }
          ]
        })
      })
    })

    it('should fetch and normalize articles successfully', async () => {
      const adapter = new NewsApiAdapter('test-key')
      const articles = await adapter.fetchArticles(['energy', 'oil'], 10)

      expect(articles).toHaveLength(2)
      
      // Check first article
      expect(articles[0].title).toBe('Oil prices surge amid Middle East tensions')
      expect(articles[0].snippet).toBe('Crude oil prices jumped 5% today as geopolitical tensions escalate in the region.')
      expect(articles[0].source).toBe('NewsAPI')
      expect(articles[0].url).toBe('https://example.com/article1')
      expect(articles[0].date).toBeInstanceOf(Date)
      expect(articles[0].id).toMatch(/^newsapi-[a-f0-9]{12}$/)
    })

    it('should update status on successful fetch', async () => {
      const adapter = new NewsApiAdapter('test-key')
      await adapter.fetchArticles(['energy'], 10)

      const status = adapter.getStatus()
      expect(status.available).toBe(true)
      expect(status.consecutiveFailures).toBe(0)
      expect(status.lastSuccess).toBeInstanceOf(Date)
      expect(status.lastError).toBeNull()
    })

    it('should filter out removed articles', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 3,
          articles: [
            {
              title: 'Valid article',
              description: 'This is a valid article',
              publishedAt: '2025-01-15T10:30:00Z',
              url: 'https://example.com/article1',
              source: { name: 'Example News' }
            },
            {
              title: '[Removed]',
              description: null,
              publishedAt: '2025-01-15T09:15:00Z',
              url: 'https://example.com/removed',
              source: { name: 'Removed Source' }
            }
          ]
        })
      })

      const adapter = new NewsApiAdapter('test-key')
      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles).toHaveLength(1)
      expect(articles[0].title).toBe('Valid article')
    })

    it('should handle articles with null descriptions', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 1,
          articles: [
            {
              title: 'Article without description',
              description: null,
              publishedAt: '2025-01-15T10:30:00Z',
              url: 'https://example.com/article',
              source: { name: 'Example News' }
            }
          ]
        })
      })

      const adapter = new NewsApiAdapter('test-key')
      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles).toHaveLength(1)
      expect(articles[0].snippet).toBe('')
    })

    it('should truncate long titles and snippets', async () => {
      const longTitle = 'A'.repeat(250)
      const longDescription = 'B'.repeat(350)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 1,
          articles: [
            {
              title: longTitle,
              description: longDescription,
              publishedAt: '2025-01-15T10:30:00Z',
              url: 'https://example.com/article',
              source: { name: 'Example News' }
            }
          ]
        })
      })

      const adapter = new NewsApiAdapter('test-key')
      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles[0].title.length).toBe(200)
      expect(articles[0].title).toMatch(/\.\.\.$/)
      expect(articles[0].snippet.length).toBe(300)
      expect(articles[0].snippet).toMatch(/\.\.\.$/)
    })
  })

  describe('Fetch Articles - Error Cases', () => {
    beforeEach(() => {
      // Reset fetch mock before each test
      vi.clearAllMocks()
    })

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({ message: 'Invalid API key' })
      })

      const adapter = new NewsApiAdapter('invalid-key')
      
      await expect(
        adapter.fetchArticles(['test'], 10)
      ).rejects.toThrow('Invalid API key')

      const status = adapter.getStatus()
      expect(status.consecutiveFailures).toBe(1)
      expect(status.lastError).toBeTruthy()
    })

    it('should handle API error status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'error',
          code: 'rateLimited',
          message: 'Rate limit exceeded'
        })
      })

      const adapter = new NewsApiAdapter('test-key')
      
      await expect(
        adapter.fetchArticles(['test'], 10)
      ).rejects.toThrow('Rate limit exceeded')
    })

    it('should track consecutive failures', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error'
      })

      const adapter = new NewsApiAdapter('test-key')

      // First failure
      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow()
      expect(adapter.getStatus().consecutiveFailures).toBe(1)
      expect(adapter.getStatus().available).toBe(true)

      // Second failure
      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow()
      expect(adapter.getStatus().consecutiveFailures).toBe(2)
      expect(adapter.getStatus().available).toBe(true)

      // Third failure - should mark as unavailable
      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow()
      expect(adapter.getStatus().consecutiveFailures).toBe(3)
      expect(adapter.getStatus().available).toBe(false)
    })

    it('should reset consecutive failures on success', async () => {
      const adapter = new NewsApiAdapter('test-key')

      // Simulate a failure
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
        text: async () => 'Error'
      })
      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow()
      expect(adapter.getStatus().consecutiveFailures).toBe(1)

      // Now simulate success
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 1,
          articles: [
            {
              title: 'Test article',
              description: 'Test description',
              publishedAt: '2025-01-15T10:30:00Z',
              url: 'https://example.com/article',
              source: { name: 'Test' }
            }
          ]
        })
      })

      await adapter.fetchArticles(['test'], 10)
      const status = adapter.getStatus()
      expect(status.consecutiveFailures).toBe(0)
      expect(status.available).toBe(true)
      expect(status.lastError).toBeNull()
    })
  })

  describe('Article ID Generation', () => {
    it('should generate consistent IDs for same title', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 2,
          articles: [
            {
              title: 'Same Title',
              description: 'Description 1',
              publishedAt: '2025-01-15T10:30:00Z',
              url: 'https://example.com/article1',
              source: { name: 'Source 1' }
            },
            {
              title: 'Same Title',
              description: 'Description 2',
              publishedAt: '2025-01-15T09:00:00Z',
              url: 'https://example.com/article2',
              source: { name: 'Source 2' }
            }
          ]
        })
      })

      const adapter = new NewsApiAdapter('test-key')
      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles[0].id).toBe(articles[1].id)
    })

    it('should generate different IDs for different titles', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 2,
          articles: [
            {
              title: 'Title One',
              description: 'Description',
              publishedAt: '2025-01-15T10:30:00Z',
              url: 'https://example.com/article1',
              source: { name: 'Source' }
            },
            {
              title: 'Title Two',
              description: 'Description',
              publishedAt: '2025-01-15T09:00:00Z',
              url: 'https://example.com/article2',
              source: { name: 'Source' }
            }
          ]
        })
      })

      const adapter = new NewsApiAdapter('test-key')
      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles[0].id).not.toBe(articles[1].id)
    })
  })

  describe('Query Building', () => {
    it('should join keywords with OR', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 0,
          articles: []
        })
      })
      global.fetch = mockFetch

      const adapter = new NewsApiAdapter('test-key')
      await adapter.fetchArticles(['energy', 'oil', 'gas'], 10)

      const callUrl = mockFetch.mock.calls[0][0] as string
      expect(callUrl).toContain('q=energy+OR+oil+OR+gas')
    })

    it('should include correct query parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 0,
          articles: []
        })
      })
      global.fetch = mockFetch

      const adapter = new NewsApiAdapter('test-key')
      await adapter.fetchArticles(['test'], 15)

      const callUrl = mockFetch.mock.calls[0][0] as string
      expect(callUrl).toContain('language=en')
      expect(callUrl).toContain('sortBy=publishedAt')
      expect(callUrl).toContain('pageSize=15')
      expect(callUrl).toContain('apiKey=test-key')
    })

    it('should cap pageSize at 100', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          totalResults: 0,
          articles: []
        })
      })
      global.fetch = mockFetch

      const adapter = new NewsApiAdapter('test-key')
      await adapter.fetchArticles(['test'], 200)

      const callUrl = mockFetch.mock.calls[0][0] as string
      expect(callUrl).toContain('pageSize=100')
    })
  })
})
