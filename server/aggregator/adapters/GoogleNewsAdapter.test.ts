/**
 * Unit tests for GoogleNewsAdapter
 * 
 * Tests RSS parsing, article normalization, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoogleNewsAdapter } from './GoogleNewsAdapter'

describe('GoogleNewsAdapter', () => {
  let adapter: GoogleNewsAdapter

  beforeEach(() => {
    adapter = new GoogleNewsAdapter()
    // Clear any previous fetch mocks
    vi.restoreAllMocks()
  })

  describe('Configuration', () => {
    it('should always be configured (no API key required)', () => {
      expect(adapter.isConfigured()).toBe(true)
    })

    it('should have correct name', () => {
      expect(adapter.name).toBe('Google News')
    })
  })

  describe('Status Management', () => {
    it('should initialize with available status', () => {
      const status = adapter.getStatus()
      expect(status.available).toBe(true)
      expect(status.consecutiveFailures).toBe(0)
      expect(status.lastSuccess).toBeNull()
      expect(status.lastError).toBeNull()
    })
  })

  describe('fetchArticles', () => {
    it('should throw error when keywords array is empty', async () => {
      await expect(adapter.fetchArticles([], 10)).rejects.toThrow('Keywords array cannot be empty')
    })

    it('should parse RSS XML and return normalized articles', async () => {
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Google News</title>
    <item>
      <title><![CDATA[Oil prices surge amid Middle East tensions]]></title>
      <description><![CDATA[Oil prices jumped 5% today as tensions escalate in the region.]]></description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
      <link>https://example.com/article1</link>
    </item>
    <item>
      <title>OPEC announces production cuts</title>
      <description>The organization decided to reduce output by 1 million barrels per day.</description>
      <pubDate>Wed, 15 Jan 2025 09:00:00 GMT</pubDate>
      <link>https://example.com/article2</link>
    </item>
  </channel>
</rss>`

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles = await adapter.fetchArticles(['oil', 'energy'], 10)

      expect(articles).toHaveLength(2)
      
      // Check first article
      expect(articles[0].title).toBe('Oil prices surge amid Middle East tensions')
      expect(articles[0].snippet).toBe('Oil prices jumped 5% today as tensions escalate in the region.')
      expect(articles[0].source).toBe('Google News')
      expect(articles[0].url).toBe('https://example.com/article1')
      expect(articles[0].id).toMatch(/^google-[a-f0-9]{12}$/)
      expect(articles[0].date).toBeInstanceOf(Date)

      // Check second article
      expect(articles[1].title).toBe('OPEC announces production cuts')
      expect(articles[1].snippet).toBe('The organization decided to reduce output by 1 million barrels per day.')
      expect(articles[1].source).toBe('Google News')
    })

    it('should handle RSS without CDATA tags', async () => {
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Simple Title</title>
      <description>Simple description without CDATA</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
      <link>https://example.com/article</link>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles).toHaveLength(1)
      expect(articles[0].title).toBe('Simple Title')
      expect(articles[0].snippet).toBe('Simple description without CDATA')
    })

    it('should strip HTML tags from description', async () => {
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Test Article</title>
      <description><![CDATA[<p>This is <strong>bold</strong> text with <a href="#">link</a></p>]]></description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles[0].snippet).toBe('This is bold text with link')
    })

    it('should decode HTML entities', async () => {
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Test &amp; Article with &quot;quotes&quot;</title>
      <description>Description with &amp; symbols &nbsp; and &#39;apostrophe&#39;</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles[0].title).toBe('Test & Article with "quotes"')
      expect(articles[0].snippet).toBe("Description with & symbols   and 'apostrophe'")
    })

    it('should truncate long titles and snippets', async () => {
      const longTitle = 'A'.repeat(250)
      const longDescription = 'B'.repeat(350)

      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>${longTitle}</title>
      <description>${longDescription}</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles[0].title.length).toBe(200)
      expect(articles[0].title).toMatch(/\.\.\.$/)
      expect(articles[0].snippet.length).toBe(300)
      expect(articles[0].snippet).toMatch(/\.\.\.$/)
    })

    it('should respect maxResults parameter', async () => {
      const items = Array.from({ length: 20 }, (_, i) => `
        <item>
          <title>Article ${i + 1}</title>
          <description>Description ${i + 1}</description>
          <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
        </item>
      `).join('')

      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>${items}</channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles = await adapter.fetchArticles(['test'], 5)

      expect(articles).toHaveLength(5)
    })

    it('should skip items with missing required fields', async () => {
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Valid Article</title>
      <description>Valid description</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
    <item>
      <description>Missing title</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
    <item>
      <title>Missing date</title>
      <description>Description without date</description>
    </item>
    <item>
      <title>Another Valid Article</title>
      <description>Another valid description</description>
      <pubDate>Wed, 15 Jan 2025 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles).toHaveLength(2)
      expect(articles[0].title).toBe('Valid Article')
      expect(articles[1].title).toBe('Another Valid Article')
    })

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error'
      } as Response)

      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow('Google News HTTP error: 500')

      const status = adapter.getStatus()
      expect(status.consecutiveFailures).toBe(1)
      expect(status.lastError).toBeTruthy()
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow('Network error')

      const status = adapter.getStatus()
      expect(status.consecutiveFailures).toBe(1)
    })

    it('should update status on successful fetch', async () => {
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Test Article</title>
      <description>Test description</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      await adapter.fetchArticles(['test'], 10)

      const status = adapter.getStatus()
      expect(status.available).toBe(true)
      expect(status.consecutiveFailures).toBe(0)
      expect(status.lastSuccess).toBeInstanceOf(Date)
      expect(status.lastError).toBeNull()
    })

    it('should mark as unavailable after 3 consecutive failures', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      // First failure
      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow()
      expect(adapter.getStatus().available).toBe(true)
      expect(adapter.getStatus().consecutiveFailures).toBe(1)

      // Second failure
      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow()
      expect(adapter.getStatus().available).toBe(true)
      expect(adapter.getStatus().consecutiveFailures).toBe(2)

      // Third failure - should mark as unavailable
      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow()
      expect(adapter.getStatus().available).toBe(false)
      expect(adapter.getStatus().consecutiveFailures).toBe(3)
    })

    it('should reset consecutive failures on success', async () => {
      // Cause a failure first
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      await expect(adapter.fetchArticles(['test'], 10)).rejects.toThrow()
      expect(adapter.getStatus().consecutiveFailures).toBe(1)

      // Now succeed
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Test Article</title>
      <description>Test description</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      await adapter.fetchArticles(['test'], 10)

      const status = adapter.getStatus()
      expect(status.consecutiveFailures).toBe(0)
      expect(status.available).toBe(true)
    })
  })

  describe('Article ID Generation', () => {
    it('should generate consistent IDs for same title', async () => {
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Same Title</title>
      <description>Description 1</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles1 = await adapter.fetchArticles(['test'], 10)
      const articles2 = await adapter.fetchArticles(['test'], 10)

      expect(articles1[0].id).toBe(articles2[0].id)
    })

    it('should generate different IDs for different titles', async () => {
      const mockRssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Title One</title>
      <description>Description 1</description>
      <pubDate>Wed, 15 Jan 2025 10:30:00 GMT</pubDate>
    </item>
    <item>
      <title>Title Two</title>
      <description>Description 2</description>
      <pubDate>Wed, 15 Jan 2025 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockRssXml
      } as Response)

      const articles = await adapter.fetchArticles(['test'], 10)

      expect(articles[0].id).not.toBe(articles[1].id)
      expect(articles[0].id).toMatch(/^google-/)
      expect(articles[1].id).toMatch(/^google-/)
    })
  })
})
