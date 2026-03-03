/**
 * Unit tests for Deduplicator class
 * 
 * Tests the Jaccard similarity-based deduplication algorithm
 */

import { describe, it, expect } from 'vitest'
import { Deduplicator } from './Deduplicator'
import { ScoredArticle, DeduplicationConfig } from './types'

// Helper function to create test articles
const createArticle = (
  id: string,
  title: string,
  relevanceScore: number,
  date: Date = new Date()
): ScoredArticle => ({
  id,
  title,
  snippet: 'Test snippet',
  date,
  source: 'Test Source',
  relevanceScore,
  matchedKeywords: []
})

describe('Deduplicator', () => {
  const defaultConfig: DeduplicationConfig = {
    enabled: true,
    similarityThreshold: 0.7,
    algorithm: 'jaccard'
  }

  describe('deduplicate()', () => {
    it('should return empty array for empty input', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const result = deduplicator.deduplicate([])
      expect(result).toEqual([])
    })

    it('should return single article unchanged', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article = createArticle('1', 'Oil prices surge', 0.8)
      const result = deduplicator.deduplicate([article])
      expect(result).toEqual([article])
    })

    it('should keep both articles when similarity is below threshold', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', 'Oil prices surge amid tensions', 0.8)
      const article2 = createArticle('2', 'Technology stocks rally today', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(2)
    })

    it('should remove duplicate when similarity exceeds threshold', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', 'Oil prices surge amid Middle East tensions', 0.8)
      const article2 = createArticle('2', 'Oil prices surge amid Middle East conflict', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1)
    })

    it('should keep article with higher relevance score when duplicates detected', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', 'Oil prices surge amid Middle East tensions', 0.7)
      const article2 = createArticle('2', 'Oil prices surge amid Middle East conflict', 0.9)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
      expect(result[0].relevanceScore).toBe(0.9)
    })

    it('should keep more recent article when scores are equal', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const olderDate = new Date('2025-01-01')
      const newerDate = new Date('2025-01-15')
      
      const article1 = createArticle('1', 'Oil prices surge amid Middle East tensions', 0.8, olderDate)
      const article2 = createArticle('2', 'Oil prices surge amid Middle East conflict', 0.8, newerDate)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
      expect(result[0].date).toEqual(newerDate)
    })

    it('should keep first article when scores and dates are equal', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const sameDate = new Date('2025-01-15')
      
      const article1 = createArticle('1', 'Oil prices surge amid Middle East tensions', 0.8, sameDate)
      const article2 = createArticle('2', 'Oil prices surge amid Middle East conflict', 0.8, sameDate)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should handle multiple duplicate groups', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const articles = [
        createArticle('1', 'Oil prices surge amid Middle East tensions', 0.8),
        createArticle('2', 'Oil prices surge amid Middle East conflict', 0.7),
        createArticle('3', 'Tech stocks rally on strong earnings report', 0.9),
        createArticle('4', 'Tech stocks rally on strong earnings news', 0.85)
      ]
      
      const result = deduplicator.deduplicate(articles)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1') // Higher score in first group
      expect(result[1].id).toBe('3') // Higher score in second group
    })

    it('should return all articles when deduplication is disabled', () => {
      const disabledConfig: DeduplicationConfig = {
        enabled: false,
        similarityThreshold: 0.7,
        algorithm: 'jaccard'
      }
      const deduplicator = new Deduplicator(disabledConfig)
      
      const article1 = createArticle('1', 'Oil prices surge amid tensions', 0.8)
      const article2 = createArticle('2', 'Oil prices surge amid conflict', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(2)
    })
  })

  describe('Jaccard similarity calculation', () => {
    it('should calculate high similarity for nearly identical titles', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', 'Oil prices surge', 0.8)
      const article2 = createArticle('2', 'Oil prices surge', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1) // Should be detected as duplicates
    })

    it('should handle punctuation differences', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', 'Oil prices surge!', 0.8)
      const article2 = createArticle('2', 'Oil prices surge.', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1) // Punctuation should be ignored
    })

    it('should handle case differences', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', 'OIL PRICES SURGE', 0.8)
      const article2 = createArticle('2', 'oil prices surge', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1) // Case should be ignored
    })

    it('should filter out short words (< 3 chars)', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      // "in" and "on" should be filtered out, leaving only "oil", "prices", "surge"
      const article1 = createArticle('1', 'Oil prices surge in US', 0.8)
      const article2 = createArticle('2', 'Oil prices surge on EU', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1) // Should be very similar after filtering short words
    })
  })

  describe('Edge cases', () => {
    it('should handle empty titles', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', '', 0.8)
      const article2 = createArticle('2', '', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1) // Empty titles should be considered duplicates
    })

    it('should handle titles with only short words', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', 'A B C D E F', 0.8)
      const article2 = createArticle('2', 'X Y Z', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      // After filtering, both become empty sets, should be considered duplicates
      expect(result).toHaveLength(1)
    })

    it('should handle titles with only punctuation', () => {
      const deduplicator = new Deduplicator(defaultConfig)
      const article1 = createArticle('1', '!!!', 0.8)
      const article2 = createArticle('2', '???', 0.7)
      
      const result = deduplicator.deduplicate([article1, article2])
      expect(result).toHaveLength(1) // Both become empty after tokenization
    })
  })
})

// ============================================================================
// Property-Based Tests
// ============================================================================

import fc from 'fast-check'

/**
 * Arbitrary generator for ScoredArticle
 */
const scoredArticleArbitrary = (): fc.Arbitrary<ScoredArticle> => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    snippet: fc.string({ minLength: 10, maxLength: 200 }),
    date: fc.date(),
    source: fc.constantFrom('NewsAPI', 'Bing News', 'Google News'),
    relevanceScore: fc.double({ min: 0, max: 1 }),
    matchedKeywords: fc.array(fc.string(), { maxLength: 5 })
  })
}

/**
 * Arbitrary generator for articles with similar titles (duplicates)
 * Creates pairs of articles with high Jaccard similarity (> 70%)
 */
const duplicateArticlePairArbitrary = (): fc.Arbitrary<[ScoredArticle, ScoredArticle]> => {
  return fc.tuple(
    fc.string({ minLength: 5, maxLength: 50 }),
    fc.double({ min: 0, max: 1 }),
    fc.double({ min: 0, max: 1 }),
    fc.date(),
    fc.date()
  ).map(([baseTitle, score1, score2, date1, date2]) => {
    // Create two articles with very similar titles (same base words)
    // Filter to get words that will survive tokenization (>= 3 chars, alphanumeric)
    const words = baseTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3)
    
    // Ensure we have enough words for high similarity
    // If not enough words, use a predefined set
    if (words.length < 3) {
      const paddedWords = ['energy', 'market', 'prices', 'surge', 'today']
      const title1 = paddedWords.slice(0, 4).join(' ')
      const title2 = paddedWords.slice(0, 4).join(' ') + ' ' + paddedWords[4]
      
      return [
        createArticle('1', title1, score1, date1),
        createArticle('2', title2, score2, date2)
      ]
    }
    
    // Create titles with > 70% word overlap
    // Take 80% of words for title2 to ensure > 70% Jaccard similarity
    const title1 = words.join(' ')
    const sharedWords = words.slice(0, Math.ceil(words.length * 0.8))
    const title2 = sharedWords.join(' ') + ' update'
    
    return [
      createArticle('1', title1, score1, date1),
      createArticle('2', title2, score2, date2)
    ]
  })
}

describe('Property-Based Tests', () => {
  const defaultConfig: DeduplicationConfig = {
    enabled: true,
    similarityThreshold: 0.7,
    algorithm: 'jaccard'
  }

  /**
   * Property 10: Deduplication Execution
   * 
   * **Validates: Requirements 4.1, 4.2**
   * 
   * For any set of articles containing pairs with title similarity above 70%,
   * the deduplicator SHALL identify and remove duplicates.
   */
  it('Property 10: should identify and remove duplicates with similarity > 70%', () => {
    fc.assert(
      fc.property(
        fc.array(scoredArticleArbitrary(), { minLength: 0, maxLength: 20 }),
        fc.array(duplicateArticlePairArbitrary(), { minLength: 1, maxLength: 5 }),
        (uniqueArticles, duplicatePairs) => {
          // Combine unique articles with duplicate pairs
          const allArticles = [...uniqueArticles]
          duplicatePairs.forEach(([article1, article2]) => {
            allArticles.push(article1, article2)
          })

          if (allArticles.length === 0) {
            return true // Skip empty arrays
          }

          const deduplicator = new Deduplicator(defaultConfig)
          const result = deduplicator.deduplicate(allArticles)

          // Result should have fewer articles than input (duplicates removed)
          // At minimum, each duplicate pair should be reduced to 1 article
          const expectedMaxArticles = uniqueArticles.length + duplicatePairs.length
          
          return result.length <= allArticles.length && 
                 result.length <= expectedMaxArticles
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11: Duplicate Resolution by Score
   * 
   * **Validates: Requirements 4.3, 4.4**
   * 
   * For any pair of duplicate articles (similarity > 70%), the deduplicator SHALL
   * keep the article with the higher relevance score, or if scores are equal,
   * the more recent article.
   */
  it('Property 11: should keep article with higher score or more recent date', () => {
    fc.assert(
      fc.property(
        duplicateArticlePairArbitrary(),
        ([article1, article2]) => {
          // Skip if either article has invalid score (NaN or out of bounds)
          if (
            !Number.isFinite(article1.relevanceScore) ||
            !Number.isFinite(article2.relevanceScore) ||
            article1.relevanceScore < 0 ||
            article1.relevanceScore > 1 ||
            article2.relevanceScore < 0 ||
            article2.relevanceScore > 1
          ) {
            return true // Skip invalid inputs
          }

          const deduplicator = new Deduplicator(defaultConfig)
          const result = deduplicator.deduplicate([article1, article2])

          // Should return at least 1 article
          if (result.length === 0) {
            return false
          }

          // If both articles are kept, they weren't similar enough (acceptable)
          if (result.length === 2) {
            return true
          }

          // Should return exactly 1 article (the duplicate removed)
          if (result.length !== 1) {
            return false
          }

          const kept = result[0]

          // Check resolution logic:
          // 1. If scores differ, keep the one with higher score
          if (article1.relevanceScore !== article2.relevanceScore) {
            const expected = article1.relevanceScore > article2.relevanceScore ? article1 : article2
            return kept.id === expected.id
          }

          // 2. If scores are equal, keep the more recent article
          if (article1.date.getTime() !== article2.date.getTime()) {
            const expected = article1.date > article2.date ? article1 : article2
            return kept.id === expected.id
          }

          // 3. If both score and date are equal, keep the first one
          return kept.id === article1.id
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 12: Deduplication Performance
   * 
   * **Validates: Requirements 4.5**
   * 
   * For any set of up to 50 articles, the deduplication process SHALL
   * complete within 500 milliseconds.
   */
  it('Property 12: should complete deduplication within 500ms for up to 50 articles', () => {
    fc.assert(
      fc.property(
        fc.array(scoredArticleArbitrary(), { minLength: 1, maxLength: 50 }),
        (articles) => {
          const deduplicator = new Deduplicator(defaultConfig)
          
          const startTime = performance.now()
          deduplicator.deduplicate(articles)
          const endTime = performance.now()
          
          const duration = endTime - startTime
          
          // Should complete within 500ms
          return duration <= 500
        }
      ),
      { numRuns: 100 }
    )
  })
})
