/**
 * Deduplicator - Identifies and removes duplicate articles using Jaccard similarity
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { ScoredArticle, DeduplicationConfig } from './types'

/**
 * Deduplicator class that removes duplicate articles based on title similarity
 * 
 * Uses Jaccard similarity algorithm to compare article titles:
 * - Jaccard(A, B) = |A ∩ B| / |A ∪ B|
 * - Where A and B are sets of tokens (words) from the titles
 * 
 * Tokenization process:
 * - Convert to lowercase
 * - Remove punctuation
 * - Filter out words with less than 3 characters
 * 
 * Duplicate resolution strategy:
 * - Keep article with highest relevance score
 * - If scores are equal, keep the most recent article
 * - If dates are equal, keep the first article in the list
 */
export class Deduplicator {
  private config: DeduplicationConfig

  constructor(config: DeduplicationConfig) {
    this.config = config
  }

  /**
   * Remove duplicate articles from the list
   * 
   * @param articles - Array of scored articles to deduplicate
   * @returns Array of unique articles with duplicates removed
   * 
   * Requirements:
   * - 4.1: Perform deduplication when multiple sources return similar articles
   * - 4.2: Consider two articles as duplicates when titles have > 70% similarity
   * - 4.3: Keep article with highest relevance score when duplicates detected
   * - 4.4: Keep most recent article when duplicate articles have equal relevance score
   */
  deduplicate(articles: ScoredArticle[]): ScoredArticle[] {
    if (!this.config.enabled || articles.length === 0) {
      return articles
    }

    const uniqueArticles: ScoredArticle[] = []
    const processedIndices = new Set<number>()

    for (let i = 0; i < articles.length; i++) {
      if (processedIndices.has(i)) {
        continue
      }

      let bestArticle = articles[i]
      processedIndices.add(i)

      // Compare with remaining articles
      for (let j = i + 1; j < articles.length; j++) {
        if (processedIndices.has(j)) {
          continue
        }

        const similarity = this.calculateSimilarity(
          articles[i].title,
          articles[j].title
        )

        // If similarity exceeds threshold, articles are duplicates
        if (similarity > this.config.similarityThreshold) {
          processedIndices.add(j)

          // Keep the article with higher relevance score
          if (articles[j].relevanceScore > bestArticle.relevanceScore) {
            bestArticle = articles[j]
          } else if (articles[j].relevanceScore === bestArticle.relevanceScore) {
            // If scores are equal, keep the more recent article
            if (articles[j].date > bestArticle.date) {
              bestArticle = articles[j]
            }
          }
        }
      }

      uniqueArticles.push(bestArticle)
    }

    return uniqueArticles
  }

  /**
   * Calculate similarity between two titles using the configured algorithm
   * 
   * @param title1 - First article title
   * @param title2 - Second article title
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(title1: string, title2: string): number {
    if (this.config.algorithm === 'jaccard') {
      const tokens1 = this.tokenize(title1)
      const tokens2 = this.tokenize(title2)
      return this.jaccardSimilarity(tokens1, tokens2)
    }
    
    // Fallback to jaccard if algorithm not recognized
    const tokens1 = this.tokenize(title1)
    const tokens2 = this.tokenize(title2)
    return this.jaccardSimilarity(tokens1, tokens2)
  }

  /**
   * Calculate Jaccard similarity between two sets of tokens
   * 
   * Jaccard similarity = |A ∩ B| / |A ∪ B|
   * 
   * @param set1 - First set of tokens
   * @param set2 - Second set of tokens
   * @returns Jaccard similarity coefficient (0 to 1)
   */
  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    // Handle edge cases
    if (set1.size === 0 && set2.size === 0) {
      return 1.0 // Both empty sets are considered identical
    }
    if (set1.size === 0 || set2.size === 0) {
      return 0.0 // One empty set means no similarity
    }

    // Calculate intersection
    const intersection = new Set<string>()
    for (const token of set1) {
      if (set2.has(token)) {
        intersection.add(token)
      }
    }

    // Calculate union
    const union = new Set<string>([...set1, ...set2])

    // Jaccard coefficient
    return intersection.size / union.size
  }

  /**
   * Tokenize a title into a set of normalized words
   * 
   * Process:
   * 1. Convert to lowercase
   * 2. Remove punctuation
   * 3. Split into words
   * 4. Filter out words with less than 3 characters
   * 
   * @param title - Article title to tokenize
   * @returns Set of normalized tokens
   */
  private tokenize(title: string): Set<string> {
    // Convert to lowercase
    const lowercased = title.toLowerCase()

    // Remove punctuation (keep only letters, numbers, and spaces)
    const noPunctuation = lowercased.replace(/[^a-z0-9\s]/g, ' ')

    // Split into words and filter short words
    const words = noPunctuation
      .split(/\s+/)
      .filter(word => word.length >= 3)

    // Return as set (automatically removes duplicates)
    return new Set(words)
  }
}
