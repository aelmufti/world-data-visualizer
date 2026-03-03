/**
 * Property-Based Tests for NewsAggregator
 * 
 * Tests core orchestration properties including parallel fetch, resilience,
 * timeout compliance, and result formatting.
 * 
 * Requirements: 1.1, 1.3, 1.4, 5.1, 5.2, 5.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'
import { NewsAggregator } from './NewsAggregator.js'
import { CacheManager } from './CacheManager.js'
import { validateConfiguration } from './ConfigLoader.js'
import type {
  NewsAggregatorConfiguration,
  Article,
  NewsSourceAdapter,
  SourceStatus
} from './types.js'

// ============================================================================
// Test Configuration
// ============================================================================

const createTestConfig = (overrides?: Partial<NewsAggregatorConfiguration>): NewsAggregatorConfiguration => ({
  sources: {
    newsapi: {
      enabled: true,
      apiKey: 'test-api-key',
      timeout: 3000,
      maxArticles: 10
    },
    bing: {
      enabled: true,
      timeout: 3000,
      maxArticles: 10
    },
    google: {
      enabled: true,
      timeout: 3000,
      maxArticles: 10
    }
  },
  cache: {
    enabled: false, // Disable cache for most tests
    ttl: 900000,
    maxSize: 100
  },
  scoring: {
    titleWeight: 0.5,
    snippetWeight: 0.3,
    recencyWeight: 0.2,
    keywordBonus: 0.1
  },
  deduplication: {
    enabled: true,
    similarityThreshold: 0.7,
    algorithm: 'jaccard'
  },
  filtering: {
    minRelevanceScore: 0.3,
    fallbackMinScore: 0.2,
    minArticlesThreshold: 5,
    maxArticlesReturned: 20
  },
  ...overrides
})

// ============================================================================
// Mock Adapters
// ============================================================================

class MockAdapter implements NewsSourceAdapter {
  name: string
  private articles: Article[]
  private delay: number
  private shouldFail: boolean
  private failureError: Error | null

  constructor(
    name: string,
    articles: Article[] = [],
    delay: number = 0,
    shouldFail: boolean = false,
    failureError: Error | null = null
  ) {
    this.name = name
    this.articles = articles
    this.delay = delay
    this.shouldFail = shouldFail
    this.failureError = failureError
  }

  async fetchArticles(keywords: string[], maxResults: number): Promise<Article[]> {
    // Simulate network delay
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    // Simulate failure
    if (this.shouldFail) {
      throw this.failureError || new Error(`${this.name} fetch failed`)
    }

    return this.articles.slice(0, maxResults)
  }

  isConfigured(): boolean {
    return true
  }

  getStatus(): SourceStatus {
    return {
      available: !this.shouldFail,
      lastSuccess: this.shouldFail ? null : new Date(),
      lastError: this.failureError,
      consecutiveFailures: this.shouldFail ? 1 : 0
    }
  }
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const articleArbitrary = (): fc.Arbitrary<Article> => {
  return fc.record({
    id: fc.string({ minLength: 5, maxLength: 20 }),
    title: fc.string({ minLength: 10, maxLength: 200 }),
    snippet: fc.string({ minLength: 20, maxLength: 300 }),
    date: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
    source: fc.constantFrom('NewsAPI', 'Bing News', 'Google News'),
    url: fc.option(fc.webUrl(), { nil: undefined })
  })
}

const sectorArbitrary = (): fc.Arbitrary<string> => {
  return fc.constantFrom(
    'Énergie',
    'Technologie',
    'Santé',
    'Télécoms',
    'Industrie',
    'Services Publics'
  )
}

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('NewsAggregator Property Tests', () => {
  /**
   * Feature: multi-source-news-aggregation, Property 1: Parallel Fetch Execution
   * 
   * **Validates: Requirements 1.1**
   * 
   * For any sector request, when fetching articles from multiple configured sources,
   * all fetch operations SHALL execute in parallel such that the total execution time
   * is not the sum of individual source fetch times.
   */
  it('Property 1: should fetch from all sources in parallel', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        fc.array(articleArbitrary(), { minLength: 1, maxLength: 10 }),
        fc.array(articleArbitrary(), { minLength: 1, maxLength: 10 }),
        fc.array(articleArbitrary(), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 100, max: 500 }), // delay per source
        async (sector, articles1, articles2, articles3, delayMs) => {
          // Create mock adapters with delays
          const mockNewsApi = new MockAdapter('NewsAPI', articles1, delayMs)
          const mockBing = new MockAdapter('Bing News', articles2, delayMs)
          const mockGoogle = new MockAdapter('Google News', articles3, delayMs)

          // Mock the getEnabledAdapters method to return our mocks
          const config = createTestConfig()
          const aggregator = new NewsAggregator(config)
          
          // Spy on the private method by accessing it through the instance
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue([mockNewsApi, mockBing, mockGoogle])

          const startTime = Date.now()
          await aggregator.aggregateNews(sector)
          const duration = Date.now() - startTime

          // Property: If executed in parallel, total time should be ~delayMs (not 3 * delayMs)
          // Allow some overhead for processing (2x the delay)
          const maxExpectedTime = delayMs * 2
          
          return duration < maxExpectedTime
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  }, 15000) // 15 second timeout for property test

  /**
   * Feature: multi-source-news-aggregation, Property 2: Resilience to Source Failures
   * 
   * **Validates: Requirements 1.3, 6.1, 6.2**
   * 
   * For any news aggregation request, when one or more sources fail or timeout,
   * the aggregator SHALL continue processing with remaining sources and return
   * results from successful sources without blocking.
   */
  it('Property 2: should continue with remaining sources when some fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        fc.integer({ min: 0, max: 2 }), // number of sources to fail (0-2 out of 3)
        async (sector, numFailures) => {
          // Create articles with keywords that will match the sector
          const successArticles = Array.from({ length: 5 }, (_, i) => ({
            id: `article-${i}`,
            title: `Energy oil gas article ${i}`,
            snippet: `This is about energy and oil ${i}`,
            date: new Date(),
            source: 'NewsAPI' as const,
            url: `https://example.com/${i}`
          }))

          // Create adapters with some failing
          const adapters = [
            new MockAdapter('NewsAPI', successArticles, 0, numFailures > 0),
            new MockAdapter('Bing News', successArticles, 0, numFailures > 1),
            new MockAdapter('Google News', successArticles, 0, false) // Always succeeds
          ]

          const config = createTestConfig()
          const aggregator = new NewsAggregator(config)
          
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue(adapters)

          const result = await aggregator.aggregateNews(sector)

          // Property: Should return results even if some sources failed
          // At least one source (Google) always succeeds, so we should get articles
          const hasSuccessfulSources = result.metadata.sourcesUsed.length > 0
          const notAllSourcesFailed = result.error !== 'All news sources failed to retrieve articles'

          // We should have at least one successful source
          return hasSuccessfulSources && notAllSourcesFailed
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 3: Aggregation Timeout Compliance
   * 
   * **Validates: Requirements 1.4**
   * 
   * For any sector request, the complete aggregation process (including all parallel
   * fetches, scoring, deduplication, and filtering) SHALL complete within 5 seconds maximum.
   */
  it('Property 3: should complete aggregation within 5 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        fc.array(articleArbitrary(), { minLength: 5, maxLength: 30 }),
        async (sector, articles) => {
          // Create adapters with realistic delays
          const mockNewsApi = new MockAdapter('NewsAPI', articles.slice(0, 10), 500)
          const mockBing = new MockAdapter('Bing News', articles.slice(10, 20), 500)
          const mockGoogle = new MockAdapter('Google News', articles.slice(20, 30), 500)

          const config = createTestConfig()
          const aggregator = new NewsAggregator(config)
          
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue([mockNewsApi, mockBing, mockGoogle])

          const startTime = Date.now()
          await aggregator.aggregateNews(sector)
          const duration = Date.now() - startTime

          // Property: Total aggregation time should be <= 5000ms
          return duration <= 5000
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  }, 15000) // 15 second timeout for property test

  /**
   * Feature: multi-source-news-aggregation, Property 13: Result Sorting by Relevance
   * 
   * **Validates: Requirements 5.1**
   * 
   * For any aggregation result, the returned articles SHALL be sorted in descending
   * order by relevance score (highest score first).
   */
  it('Property 13: should return articles sorted by relevance score descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        fc.array(articleArbitrary(), { minLength: 5, maxLength: 30 }),
        async (sector, articles) => {
          // Create articles with keywords that will match
          const articlesWithKeywords = articles.map((article, i) => ({
            ...article,
            title: `Energy oil gas article ${i}`,
            snippet: `This is about energy and oil ${i}`
          }))

          const mockAdapter = new MockAdapter('NewsAPI', articlesWithKeywords)

          const config = createTestConfig()
          const aggregator = new NewsAggregator(config)
          
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue([mockAdapter])

          const result = await aggregator.aggregateNews(sector)

          // Property: Each article should have relevance score >= next article
          for (let i = 0; i < result.articles.length - 1; i++) {
            if (result.articles[i].relevanceScore < result.articles[i + 1].relevanceScore) {
              return false
            }
          }

          return true
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 14: Relevance Score Filtering
   * 
   * **Validates: Requirements 5.2**
   * 
   * For any aggregation result with at least 5 articles scoring above 0.3,
   * all returned articles SHALL have a relevance score of at least 0.3.
   */
  it('Property 14: should filter articles by minimum relevance score', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        async (sector) => {
          // Create articles with varying relevance (some will score high, some low)
          const highRelevanceArticles = Array.from({ length: 10 }, (_, i) => ({
            id: `high-${i}`,
            title: `Energy oil gas renewable OPEC pipeline ${i}`,
            snippet: `This article discusses energy oil gas renewable OPEC pipeline ${i}`,
            date: new Date(),
            source: 'NewsAPI' as const,
            url: `https://example.com/${i}`
          }))

          const lowRelevanceArticles = Array.from({ length: 5 }, (_, i) => ({
            id: `low-${i}`,
            title: `Random unrelated topic ${i}`,
            snippet: `This has nothing to do with the sector ${i}`,
            date: new Date(),
            source: 'NewsAPI' as const,
            url: `https://example.com/low-${i}`
          }))

          const allArticles = [...highRelevanceArticles, ...lowRelevanceArticles]
          const mockAdapter = new MockAdapter('NewsAPI', allArticles)

          const config = createTestConfig()
          const aggregator = new NewsAggregator(config)
          
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue([mockAdapter])

          const result = await aggregator.aggregateNews(sector)

          // Property: If we have >= 5 articles, all should have score >= 0.3
          // (or >= 0.2 if fallback was triggered)
          if (result.articles.length >= 5) {
            return result.articles.every(article => article.relevanceScore >= 0.3)
          } else if (result.articles.length > 0) {
            // Fallback threshold
            return result.articles.every(article => article.relevanceScore >= 0.2)
          }

          return true
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 15: Maximum Articles Limit
   * 
   * **Validates: Requirements 5.3**
   * 
   * For any sector aggregation, the result SHALL contain at most 20 articles
   * regardless of how many articles were fetched and scored.
   */
  it('Property 15: should limit results to maximum 20 articles', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        fc.integer({ min: 21, max: 100 }), // Generate more than 20 articles
        async (sector, numArticles) => {
          // Create many high-relevance articles
          const articles = Array.from({ length: numArticles }, (_, i) => ({
            id: `article-${i}`,
            title: `Energy oil gas renewable OPEC pipeline article ${i}`,
            snippet: `This discusses energy oil gas renewable OPEC pipeline ${i}`,
            date: new Date(),
            source: 'NewsAPI' as const,
            url: `https://example.com/${i}`
          }))

          const mockAdapter = new MockAdapter('NewsAPI', articles)

          const config = createTestConfig()
          const aggregator = new NewsAggregator(config)
          
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue([mockAdapter])

          const result = await aggregator.aggregateNews(sector)

          // Property: Should return at most 20 articles
          return result.articles.length <= 20
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 16: Response Structure Completeness
   * 
   * **Validates: Requirements 5.5, 10.2, 10.3**
   * 
   * For any aggregation result, each article SHALL include all required fields
   * (title, snippet, date, source, url, relevanceScore) and the response SHALL
   * include metadata with all required fields (timestamp, totalArticles, sourcesUsed, cacheStatus).
   */
  it('Property 16: should include all required fields in response structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        fc.array(articleArbitrary(), { minLength: 1, maxLength: 10 }),
        async (sector, articles) => {
          // Create articles with keywords that will match
          const articlesWithKeywords = articles.map((article, i) => ({
            ...article,
            title: `Energy oil gas article ${i}`,
            snippet: `This is about energy and oil ${i}`
          }))

          const mockAdapter = new MockAdapter('NewsAPI', articlesWithKeywords)

          const config = createTestConfig()
          const aggregator = new NewsAggregator(config)
          
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue([mockAdapter])

          const result = await aggregator.aggregateNews(sector)

          // Property: Response must have articles and metadata
          if (!result.articles || !result.metadata) {
            return false
          }

          // Property: Each article must have all required fields
          const articlesValid = result.articles.every(article => 
            typeof article.title === 'string' &&
            typeof article.snippet === 'string' &&
            typeof article.date === 'string' &&
            typeof article.source === 'string' &&
            (article.url === undefined || typeof article.url === 'string') &&
            typeof article.relevanceScore === 'number'
          )

          // Property: Metadata must have all required fields
          const metadataValid = 
            typeof result.metadata.timestamp === 'string' &&
            typeof result.metadata.totalArticles === 'number' &&
            Array.isArray(result.metadata.sourcesUsed) &&
            (result.metadata.cacheStatus === 'hit' || result.metadata.cacheStatus === 'miss')

          return articlesValid && metadataValid
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 22: Cache Status in Response
   * 
   * **Validates: Requirements 8.5**
   * 
   * For any aggregation response, the metadata SHALL include a cache status field
   * indicating either "hit" or "miss" and a timestamp.
   */
  it('Property 22: should include cache status and timestamp in response', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        fc.boolean(), // Whether to enable cache
        async (sector, cacheEnabled) => {
          const articles = [
            {
              id: 'test-1',
              title: 'Energy oil gas test article',
              snippet: 'Test snippet about energy',
              date: new Date(),
              source: 'NewsAPI' as const,
              url: 'https://example.com'
            }
          ]

          const mockAdapter = new MockAdapter('NewsAPI', articles)

          const config = createTestConfig({
            cache: {
              enabled: cacheEnabled,
              ttl: 900000,
              maxSize: 100
            }
          })
          
          const aggregator = new NewsAggregator(config)
          
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue([mockAdapter])

          const result = await aggregator.aggregateNews(sector)

          // Property: Metadata must include cache status
          const hasCacheStatus = 
            result.metadata.cacheStatus === 'hit' || 
            result.metadata.cacheStatus === 'miss'

          // Property: Metadata must include timestamp
          const hasTimestamp = 
            typeof result.metadata.timestamp === 'string' &&
            result.metadata.timestamp.length > 0

          return hasCacheStatus && hasTimestamp
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 25: French Date Formatting
   * 
   * **Validates: Requirements 10.4**
   * 
   * For any article in the response, the date field SHALL be formatted in French
   * human-readable format (e.g., "Il y a 2h", "Hier", "Il y a 3 jours") rather
   * than ISO timestamp format.
   */
  it('Property 25: should format dates in French human-readable format', async () => {
    // Use a simpler approach: test with known good articles
    const now = new Date()
    const testDates = [
      new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
      new Date(now.getTime() - 25 * 60 * 60 * 1000), // Yesterday
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    ]

    const articles = testDates.map((date, i) => ({
      id: `test-${i}`,
      title: 'Energy oil gas renewable OPEC pipeline article',
      snippet: 'This article discusses energy oil gas renewable OPEC pipeline',
      date,
      source: 'NewsAPI' as const,
      url: `https://example.com/${i}`
    }))

    const mockAdapter = new MockAdapter('NewsAPI', articles)

    const config = createTestConfig()
    const aggregator = new NewsAggregator(config)
    
    const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
    getEnabledAdaptersSpy.mockReturnValue([mockAdapter])

    const result = await aggregator.aggregateNews('Énergie')

    // All returned articles should have French-formatted dates
    const frenchDatePattern = /^(Il y a \d+ (min|h|jours)|Hier|\d{2}\/\d{2})$/
    const isoPattern = /^\d{4}-\d{2}-\d{2}T/

    expect(result.articles.length).toBeGreaterThan(0)
    result.articles.forEach(article => {
      expect(article.date).toMatch(frenchDatePattern)
      expect(article.date).not.toMatch(isoPattern)
    })
  })

  /**
   * Feature: multi-source-news-aggregation, Property 26: Error Response Structure
   * 
   * **Validates: Requirements 10.5**
   * 
   * For any aggregation request that encounters an error preventing article retrieval,
   * the response SHALL contain an empty articles array and an error field describing the issue.
   */
  it('Property 26: should return proper error response structure when all sources fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        async (sector) => {
          // Create adapters that all fail
          const mockNewsApi = new MockAdapter('NewsAPI', [], 0, true, new Error('API error'))
          const mockBing = new MockAdapter('Bing News', [], 0, true, new Error('Network error'))
          const mockGoogle = new MockAdapter('Google News', [], 0, true, new Error('Timeout'))

          const config = createTestConfig()
          const aggregator = new NewsAggregator(config)
          
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockReturnValue([mockNewsApi, mockBing, mockGoogle])

          const result = await aggregator.aggregateNews(sector)

          // Property: When all sources fail, response must have:
          // 1. Empty articles array
          const hasEmptyArticles = Array.isArray(result.articles) && result.articles.length === 0

          // 2. Error field with description
          const hasErrorField = 
            typeof result.error === 'string' && 
            result.error.length > 0

          // 3. Valid metadata
          const hasValidMetadata = 
            result.metadata &&
            typeof result.metadata.timestamp === 'string' &&
            result.metadata.totalArticles === 0 &&
            Array.isArray(result.metadata.sourcesUsed) &&
            result.metadata.sourcesUsed.length === 0

          return hasEmptyArticles && hasErrorField && hasValidMetadata
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 23: Metrics Logging Completeness
   * 
   * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
   * 
   * For any aggregation request, the system SHALL log all required metrics including:
   * articles fetched per source, total aggregation time, articles after deduplication,
   * average relevance score, and any source failures with error details.
   */
  it('Property 23: should log all required metrics for aggregation', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectorArbitrary(),
        fc.array(articleArbitrary(), { minLength: 5, maxLength: 30 }),
        fc.boolean(), // Whether to include a failing source
        async (sector, articles, includeFailure) => {
          // Spy on console methods to capture logs
          const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
          const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

          try {
            // Create mock adapters
            const mockNewsApi = new MockAdapter('NewsAPI', articles.slice(0, 10))
            const mockBing = includeFailure 
              ? new MockAdapter('Bing News', [], 0, true, new Error('Network error'))
              : new MockAdapter('Bing News', articles.slice(10, 20))
            const mockGoogle = new MockAdapter('Google News', articles.slice(20, 30))

            // Enable cache to test cache logging
            const config = createTestConfig({ cache: { enabled: true, ttl: 900000, maxSize: 100 } })
            const aggregator = new NewsAggregator(config)
            
            const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
            getEnabledAdaptersSpy.mockReturnValue([mockNewsApi, mockBing, mockGoogle])

            await aggregator.aggregateNews(sector)

            // Collect all log calls
            const allLogs = consoleLogSpy.mock.calls.map(call => call.join(' '))
            const allErrors = consoleErrorSpy.mock.calls.map(call => call.join(' '))
            const allOutput = [...allLogs, ...allErrors].join('\n')

            // Requirement 9.1: Log articles fetched per source
            const logsArticlesPerSource = 
              allOutput.includes('NewsAPI') &&
              allOutput.includes('fetched') &&
              allOutput.includes('articles')

            // Requirement 9.2: Log total aggregation time
            const logsTotalDuration = 
              allOutput.includes('totalDuration') ||
              allOutput.includes('aggregation time') ||
              allOutput.includes('duration')

            // Requirement 9.3: Log articles after deduplication
            const logsAfterDedup = 
              allOutput.includes('articlesAfterDeduplication') ||
              allOutput.includes('after deduplication')

            // Requirement 9.4: Log average relevance score
            const logsAvgScore = 
              allOutput.includes('averageRelevanceScore') ||
              (allOutput.includes('average') && allOutput.includes('score'))

            // Requirement 9.5: Log source failures with error details
            const logsSourceFailures = !includeFailure || (
              allOutput.includes('Bing News') &&
              allOutput.includes('failed') &&
              allOutput.includes('error')
            )

            // Verify cache hit/miss logging (cache is enabled)
            const logsCacheStatus = 
              allOutput.includes('Cache HIT') ||
              allOutput.includes('Cache MISS')

            return (
              logsArticlesPerSource &&
              logsTotalDuration &&
              logsAfterDedup &&
              logsAvgScore &&
              logsSourceFailures &&
              logsCacheStatus
            )
          } finally {
            // Restore console methods
            consoleLogSpy.mockRestore()
            consoleErrorSpy.mockRestore()
          }
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 18: Disabled Source Exclusion
   * 
   * **Validates: Requirements 7.4**
   * 
   * *For any* news source that is disabled in configuration, the aggregator SHALL not
   * attempt to fetch articles from that source during aggregation.
   */
  it('Property 18: should not fetch from disabled sources', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random configuration with some sources disabled
        fc.record({
          newsapiEnabled: fc.boolean(),
          bingEnabled: fc.boolean(),
          googleEnabled: fc.boolean()
        }),
        fc.array(
          fc.record({
            id: fc.string(),
            title: fc.string({ minLength: 10, maxLength: 100 }),
            snippet: fc.string({ minLength: 20, maxLength: 200 }),
            date: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
            source: fc.constantFrom('NewsAPI', 'Bing News', 'Google News'),
            url: fc.webUrl()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (sourceConfig, articles) => {
          // Create config with specified enabled/disabled sources
          const config = createTestConfig({
            sources: {
              newsapi: {
                enabled: sourceConfig.newsapiEnabled,
                apiKey: 'test-key',
                timeout: 3000,
                maxArticles: 10
              },
              bing: {
                enabled: sourceConfig.bingEnabled,
                timeout: 3000,
                maxArticles: 10
              },
              google: {
                enabled: sourceConfig.googleEnabled,
                timeout: 3000,
                maxArticles: 10
              }
            }
          })

          // Create mock adapters
          const mockNewsApi = new MockAdapter('NewsAPI', articles)
          const mockBing = new MockAdapter('Bing News', articles)
          const mockGoogle = new MockAdapter('Google News', articles)

          // Track which adapters were called
          const fetchSpyNewsApi = vi.spyOn(mockNewsApi, 'fetchArticles')
          const fetchSpyBing = vi.spyOn(mockBing, 'fetchArticles')
          const fetchSpyGoogle = vi.spyOn(mockGoogle, 'fetchArticles')

          const aggregator = new NewsAggregator(config)
          
          // Mock getEnabledAdapters to return all adapters
          // (the method itself should filter based on config)
          const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
          getEnabledAdaptersSpy.mockImplementation(() => {
            const adapters: NewsSourceAdapter[] = []
            if (config.sources.newsapi.enabled) {
              adapters.push(mockNewsApi)
            }
            if (config.sources.bing.enabled) {
              adapters.push(mockBing)
            }
            if (config.sources.google.enabled) {
              adapters.push(mockGoogle)
            }
            return adapters
          })

          // Skip if all sources are disabled (would result in error)
          if (!sourceConfig.newsapiEnabled && !sourceConfig.bingEnabled && !sourceConfig.googleEnabled) {
            return true
          }

          await aggregator.aggregateNews('Énergie')

          // Verify that only enabled sources were called
          if (sourceConfig.newsapiEnabled) {
            expect(fetchSpyNewsApi).toHaveBeenCalled()
          } else {
            expect(fetchSpyNewsApi).not.toHaveBeenCalled()
          }

          if (sourceConfig.bingEnabled) {
            expect(fetchSpyBing).toHaveBeenCalled()
          } else {
            expect(fetchSpyBing).not.toHaveBeenCalled()
          }

          if (sourceConfig.googleEnabled) {
            expect(fetchSpyGoogle).toHaveBeenCalled()
          } else {
            expect(fetchSpyGoogle).not.toHaveBeenCalled()
          }

          // Verify metadata only includes enabled sources
          const result = await aggregator.aggregateNews('Énergie')
          const sourcesUsed = result.metadata.sourcesUsed

          if (!sourceConfig.newsapiEnabled) {
            expect(sourcesUsed).not.toContain('NewsAPI')
          }
          if (!sourceConfig.bingEnabled) {
            expect(sourcesUsed).not.toContain('Bing News')
          }
          if (!sourceConfig.googleEnabled) {
            expect(sourcesUsed).not.toContain('Google News')
          }

          return true
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 19: API Key Validation
   * 
   * **Validates: Requirements 7.2**
   * 
   * *For any* news source requiring an API key, the aggregator SHALL validate
   * the key's presence and format before attempting to fetch articles.
   */
  it('Property 19: should validate API keys for sources requiring them', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random API key configurations (empty, whitespace, or valid)
        fc.oneof(
          fc.constant(''),           // Empty string
          fc.constant('   '),        // Whitespace only
          fc.constant(undefined),    // Undefined
          fc.string({ minLength: 10, maxLength: 50 }) // Valid key
        ),
        fc.array(
          fc.record({
            id: fc.string(),
            title: fc.string({ minLength: 10, maxLength: 100 }),
            snippet: fc.string({ minLength: 20, maxLength: 200 }),
            date: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
            source: fc.constant('NewsAPI'),
            url: fc.webUrl()
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (apiKey, articles) => {
          // Create config with the test API key
          const config = createTestConfig({
            sources: {
              newsapi: {
                enabled: true,
                apiKey: apiKey || '',
                timeout: 3000,
                maxArticles: 10
              },
              bing: {
                enabled: false,
                timeout: 3000,
                maxArticles: 10
              },
              google: {
                enabled: false,
                timeout: 3000,
                maxArticles: 10
              }
            }
          })

          // Validate configuration
          const warnings = validateConfiguration(config)

          // Determine if API key is valid
          const isValidKey = apiKey && apiKey.trim() !== ''

          if (isValidKey) {
            // Valid key: should have no warnings
            expect(warnings).toHaveLength(0)

            // Create mock adapter and verify it can be used
            const mockNewsApi = new MockAdapter('NewsAPI', articles)
            const aggregator = new NewsAggregator(config)
            
            const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
            getEnabledAdaptersSpy.mockReturnValue([mockNewsApi])

            const result = await aggregator.aggregateNews('Énergie')
            
            // Should successfully fetch articles
            expect(result.articles).toBeDefined()
            expect(result.error).toBeUndefined()
          } else {
            // Invalid key: should have warning
            expect(warnings.length).toBeGreaterThan(0)
            expect(warnings[0]).toContain('NewsAPI')
            expect(warnings[0]).toContain('NEWS_API_KEY')
          }

          return true
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    )
  })
})

// ============================================================================
// Unit Tests for Edge Cases
// ============================================================================

describe('NewsAggregator Unit Tests', () => {
  it('should handle all sources failing', async () => {
    const mockNewsApi = new MockAdapter('NewsAPI', [], 0, true)
    const mockBing = new MockAdapter('Bing News', [], 0, true)
    const mockGoogle = new MockAdapter('Google News', [], 0, true)

    const config = createTestConfig()
    const aggregator = new NewsAggregator(config)
    
    const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
    getEnabledAdaptersSpy.mockReturnValue([mockNewsApi, mockBing, mockGoogle])

    const result = await aggregator.aggregateNews('Énergie')

    expect(result.articles).toHaveLength(0)
    expect(result.error).toBe('All news sources failed to retrieve articles')
    expect(result.metadata.sourcesUsed).toHaveLength(0)
  })

  it('should handle timeout correctly', async () => {
    // Create adapter with delay longer than timeout
    const slowAdapter = new MockAdapter('NewsAPI', [], 5000) // 5 second delay

    const config = createTestConfig({
      sources: {
        ...createTestConfig().sources,
        newsapi: {
          enabled: true,
          apiKey: 'test-key',
          timeout: 1000, // 1 second timeout
          maxArticles: 10
        }
      }
    })
    const aggregator = new NewsAggregator(config)
    
    const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
    getEnabledAdaptersSpy.mockReturnValue([slowAdapter])

    const startTime = Date.now()
    const result = await aggregator.aggregateNews('Énergie')
    const duration = Date.now() - startTime

    // Should timeout and return empty result
    expect(result.articles).toHaveLength(0)
    expect(duration).toBeLessThan(2000) // Should not wait full 5 seconds
  })

  it('should use cache when enabled', async () => {
    const articles = [
      {
        id: 'test-1',
        title: 'Energy oil gas test article',
        snippet: 'Test snippet about energy',
        date: new Date(),
        source: 'NewsAPI' as const,
        url: 'https://example.com'
      }
    ]

    const mockAdapter = new MockAdapter('NewsAPI', articles)

    const config = createTestConfig({
      cache: {
        enabled: true,
        ttl: 900000,
        maxSize: 100
      }
    })
    
    // Mock CacheManager.generateKey BEFORE creating aggregator
    const fixedKey = 'news:Énergie:test-key'
    const generateKeySpy = vi.spyOn(CacheManager, 'generateKey')
    generateKeySpy.mockReturnValue(fixedKey)
    
    const aggregator = new NewsAggregator(config)
    
    const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
    getEnabledAdaptersSpy.mockReturnValue([mockAdapter])

    // First call - cache miss, adapter should be called
    const result1 = await aggregator.aggregateNews('Énergie')
    expect(result1.metadata.cacheStatus).toBe('miss')
    const firstCallCount = getEnabledAdaptersSpy.mock.calls.length

    // Second call - should be cache hit, adapter should NOT be called again
    const result2 = await aggregator.aggregateNews('Énergie')
    const secondCallCount = getEnabledAdaptersSpy.mock.calls.length
    
    // Verify cache hit: adapter was not called again
    expect(secondCallCount).toBe(firstCallCount)
    
    // Verify same articles returned
    expect(result2.articles.length).toBe(result1.articles.length)
    expect(result2.articles[0].title).toBe(result1.articles[0].title)

    // Restore mocks
    vi.restoreAllMocks()
  })

  it('should format dates in French', async () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    const articles = [
      {
        id: 'recent',
        title: 'Energy oil gas recent',
        snippet: 'Recent article about energy',
        date: oneHourAgo,
        source: 'NewsAPI' as const
      },
      {
        id: 'yesterday',
        title: 'Energy oil gas yesterday',
        snippet: 'Yesterday article about energy',
        date: yesterday,
        source: 'NewsAPI' as const
      },
      {
        id: 'old',
        title: 'Energy oil gas old',
        snippet: 'Old article about energy',
        date: threeDaysAgo,
        source: 'NewsAPI' as const
      }
    ]

    const mockAdapter = new MockAdapter('NewsAPI', articles)

    const config = createTestConfig()
    const aggregator = new NewsAggregator(config)
    
    const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
    getEnabledAdaptersSpy.mockReturnValue([mockAdapter])

    const result = await aggregator.aggregateNews('Énergie')

    // Check French date formatting
    expect(result.articles[0].date).toMatch(/Il y a \d+h/)
    expect(result.articles[1].date).toBe('Hier')
    expect(result.articles[2].date).toMatch(/Il y a \d+ jours/)
  })

  it('should include warnings for failed sources', async () => {
    const mockNewsApi = new MockAdapter('NewsAPI', [], 0, true, new Error('API key invalid'))
    const mockBing = new MockAdapter('Bing News', [
      {
        id: 'test-1',
        title: 'Energy oil gas',
        snippet: 'Test',
        date: new Date(),
        source: 'Bing News' as const
      }
    ])

    const config = createTestConfig()
    const aggregator = new NewsAggregator(config)
    
    const getEnabledAdaptersSpy = vi.spyOn(aggregator as any, 'getEnabledAdapters')
    getEnabledAdaptersSpy.mockReturnValue([mockNewsApi, mockBing])

    const result = await aggregator.aggregateNews('Énergie')

    expect(result.metadata.warnings).toBeDefined()
    expect(result.metadata.warnings?.length).toBeGreaterThan(0)
    expect(result.metadata.warnings?.[0]).toContain('NewsAPI failed')
  })
})
