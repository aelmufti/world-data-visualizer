/**
 * Property-Based Tests for RelevanceScorer
 * 
 * Tests universal properties of the relevance scoring algorithm using fast-check
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { RelevanceScorer } from './RelevanceScorer.js'
import { Article, ScoringConfig } from './types.js'

// Default scoring configuration
const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  titleWeight: 0.5,
  snippetWeight: 0.3,
  recencyWeight: 0.2,
  keywordBonus: 0.1
}

// ============================================================================
// Arbitraries (Generators for Property-Based Testing)
// ============================================================================

/**
 * Generate arbitrary articles for testing
 */
const articleArbitrary = (): fc.Arbitrary<Article> => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    title: fc.string({ minLength: 5, maxLength: 200 }),
    snippet: fc.string({ minLength: 10, maxLength: 300 }),
    date: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
    source: fc.constantFrom('NewsAPI', 'Bing News', 'Google News'),
    url: fc.option(fc.webUrl(), { nil: undefined })
  })
}

/**
 * Generate arbitrary keywords for testing
 */
const keywordsArbitrary = (): fc.Arbitrary<string[]> => {
  return fc.array(
    fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
    { minLength: 1, maxLength: 20 }
  )
}

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('RelevanceScorer Property Tests', () => {
  /**
   * Feature: multi-source-news-aggregation, Property 6: Relevance Score Calculation
   * 
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any retrieved article, the aggregator SHALL calculate a relevance score 
   * that is a numeric value between 0.0 and 1.0 inclusive.
   */
  it('Property 6: relevance scores should be between 0.0 and 1.0 for all articles', () => {
    fc.assert(
      fc.property(
        fc.array(articleArbitrary(), { minLength: 1, maxLength: 50 }),
        keywordsArbitrary(),
        (articles, keywords) => {
          const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
          const scored = scorer.scoreArticles(articles, keywords)
          
          // Property: All scores must be between 0.0 and 1.0 inclusive
          return scored.every(article => 
            article.relevanceScore >= 0.0 && 
            article.relevanceScore <= 1.0 &&
            !isNaN(article.relevanceScore)
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 7: Scoring Monotonicity with Keyword Frequency
   * 
   * **Validates: Requirements 3.3, 3.6**
   * 
   * For any article, if we increase the number of matching keywords in the title or snippet 
   * (without changing other factors), the relevance score SHALL increase or remain the same.
   */
  it('Property 7: adding matching keywords should increase or maintain score', () => {
    fc.assert(
      fc.property(
        keywordsArbitrary(),
        fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        fc.constantFrom('NewsAPI', 'Bing News', 'Google News'),
        (keywords, date, source) => {
          // Skip if we don't have enough keywords to test
          if (keywords.length < 2) return true
          
          const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
          
          // Create article with one keyword in title
          const keyword1 = keywords[0]
          const article1: Article = {
            id: 'test-1',
            title: `Article about ${keyword1}`,
            snippet: 'This is a test snippet without keywords',
            date,
            source
          }
          
          // Create article with two keywords in title (more matches)
          const keyword2 = keywords[1]
          const article2: Article = {
            id: 'test-2',
            title: `Article about ${keyword1} and ${keyword2}`,
            snippet: 'This is a test snippet without keywords',
            date,
            source
          }
          
          const scored1 = scorer.scoreArticles([article1], keywords)
          const scored2 = scorer.scoreArticles([article2], keywords)
          
          // Property: More keyword matches should result in score >= original score
          return scored2[0].relevanceScore >= scored1[0].relevanceScore
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 8: Title Weight Dominance
   * 
   * **Validates: Requirements 3.4**
   * 
   * For any article, if we move a matching keyword from the snippet to the title 
   * (keeping total keyword count constant), the relevance score SHALL increase.
   */
  it('Property 8: keywords in title should score higher than in snippet', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
        fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        fc.constantFrom('NewsAPI', 'Bing News', 'Google News'),
        (keyword, date, source) => {
          const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
          
          // Article with keyword only in snippet
          const articleSnippetOnly: Article = {
            id: 'test-snippet',
            title: 'Generic article title',
            snippet: `This snippet contains the keyword ${keyword}`,
            date,
            source
          }
          
          // Article with keyword only in title (same keyword, different position)
          const articleTitleOnly: Article = {
            id: 'test-title',
            title: `Article about ${keyword}`,
            snippet: 'This snippet does not contain the keyword',
            date,
            source
          }
          
          const scoredSnippet = scorer.scoreArticles([articleSnippetOnly], [keyword])
          const scoredTitle = scorer.scoreArticles([articleTitleOnly], [keyword])
          
          // Property: Title keyword should score higher than snippet keyword
          // (because titleWeight > snippetWeight in default config)
          return scoredTitle[0].relevanceScore > scoredSnippet[0].relevanceScore
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: multi-source-news-aggregation, Property 9: Recency Score Monotonicity
   * 
   * **Validates: Requirements 3.5**
   * 
   * For any two articles with identical content but different publication dates, 
   * the more recent article SHALL have a relevance score greater than or equal to the older article.
   */
  it('Property 9: more recent articles should have score >= older articles', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 200 }),
        fc.string({ minLength: 10, maxLength: 300 }),
        keywordsArbitrary(),
        fc.constantFrom('NewsAPI', 'Bing News', 'Google News'),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
        fc.integer({ min: 1, max: 365 }), // days difference
        (title, snippet, keywords, source, olderDate, daysDifference) => {
          const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
          
          // Create older article
          const olderArticle: Article = {
            id: 'test-older',
            title,
            snippet,
            date: olderDate,
            source
          }
          
          // Create newer article (same content, more recent date)
          const newerDate = new Date(olderDate.getTime() + daysDifference * 24 * 60 * 60 * 1000)
          const newerArticle: Article = {
            id: 'test-newer',
            title,
            snippet,
            date: newerDate,
            source
          }
          
          const scoredOlder = scorer.scoreArticles([olderArticle], keywords)
          const scoredNewer = scorer.scoreArticles([newerArticle], keywords)
          
          // Property: Newer article should have score >= older article
          // (because recency contributes positively to the score)
          return scoredNewer[0].relevanceScore >= scoredOlder[0].relevanceScore
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ============================================================================
// Additional Edge Case Tests
// ============================================================================

describe('RelevanceScorer Edge Cases', () => {
  it('should handle empty keywords array', () => {
    const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
    const article: Article = {
      id: 'test-1',
      title: 'Test article',
      snippet: 'Test snippet',
      date: new Date(),
      source: 'NewsAPI'
    }
    
    const scored = scorer.scoreArticles([article], [])
    expect(scored[0].relevanceScore).toBe(0)
  })

  it('should handle articles with no matching keywords', () => {
    const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
    const article: Article = {
      id: 'test-1',
      title: 'Article about cats',
      snippet: 'This is about felines',
      date: new Date(),
      source: 'NewsAPI'
    }
    
    const scored = scorer.scoreArticles([article], ['dogs', 'canines'])
    expect(scored[0].relevanceScore).toBeGreaterThanOrEqual(0)
    expect(scored[0].relevanceScore).toBeLessThanOrEqual(1)
  })

  it('should handle very old articles', () => {
    const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
    const veryOldDate = new Date('2000-01-01')
    const article: Article = {
      id: 'test-1',
      title: 'Old article about technology',
      snippet: 'This is about tech',
      date: veryOldDate,
      source: 'NewsAPI'
    }
    
    const scored = scorer.scoreArticles([article], ['technology', 'tech'])
    expect(scored[0].relevanceScore).toBeGreaterThanOrEqual(0)
    expect(scored[0].relevanceScore).toBeLessThanOrEqual(1)
  })

  it('should handle very recent articles (< 24 hours)', () => {
    const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
    const recentDate = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    const article: Article = {
      id: 'test-1',
      title: 'Recent article about technology',
      snippet: 'This is about tech',
      date: recentDate,
      source: 'NewsAPI'
    }
    
    const scored = scorer.scoreArticles([article], ['technology', 'tech'])
    expect(scored[0].relevanceScore).toBeGreaterThanOrEqual(0)
    expect(scored[0].relevanceScore).toBeLessThanOrEqual(1)
  })

  it('should handle case-insensitive keyword matching', () => {
    const scorer = new RelevanceScorer(DEFAULT_SCORING_CONFIG)
    const article: Article = {
      id: 'test-1',
      title: 'Article about TECHNOLOGY',
      snippet: 'This is about Tech',
      date: new Date(),
      source: 'NewsAPI'
    }
    
    const scored = scorer.scoreArticles([article], ['technology', 'tech'])
    expect(scored[0].matchedKeywords).toHaveLength(2)
  })
})
