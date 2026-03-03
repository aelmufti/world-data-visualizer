/**
 * RelevanceScorer - Calculates relevance scores for articles based on keyword matching and recency
 * 
 * Scoring algorithm:
 * score = (titleScore * titleWeight) + 
 *         (snippetScore * snippetWeight) + 
 *         (recencyScore * recencyWeight) +
 *         (keywordBonus * additionalKeywords)
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { Article, ScoredArticle, ScoringConfig } from './types'

export class RelevanceScorer {
  constructor(private config: ScoringConfig) {}

  /**
   * Score multiple articles against a set of keywords
   * Requirements: 3.1, 3.2
   */
  scoreArticles(articles: Article[], keywords: string[]): ScoredArticle[] {
    return articles.map(article => {
      const score = this.calculateScore(article, keywords)
      const matchedKeywords = this.getMatchedKeywords(article, keywords)
      
      return {
        ...article,
        relevanceScore: score,
        matchedKeywords
      }
    })
  }

  /**
   * Calculate relevance score for a single article
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   */
  private calculateScore(article: Article, keywords: string[]): number {
    if (keywords.length === 0) {
      return 0
    }

    // Count keyword matches in title and snippet
    const titleMatches = this.countKeywordMatches(article.title, keywords)
    const snippetMatches = this.countKeywordMatches(article.snippet, keywords)
    
    // Calculate component scores
    const titleScore = titleMatches / keywords.length
    const snippetScore = snippetMatches / keywords.length
    const recencyScore = this.getRecencyScore(article.date)
    
    // Count total unique matched keywords for bonus
    const totalMatchedKeywords = this.getMatchedKeywords(article, keywords).length
    const additionalKeywords = Math.max(0, totalMatchedKeywords - 1)
    
    // Calculate weighted score
    const score = 
      (titleScore * this.config.titleWeight) +
      (snippetScore * this.config.snippetWeight) +
      (recencyScore * this.config.recencyWeight) +
      (this.config.keywordBonus * additionalKeywords)
    
    // Ensure score is between 0 and 1
    return Math.min(1.0, Math.max(0.0, score))
  }

  /**
   * Calculate recency score based on article age
   * Requirements: 3.5
   * 
   * Scoring:
   * - 1.0 if < 24 hours
   * - 0.8 if < 3 days
   * - 0.6 if < 7 days
   * - 0.4 otherwise
   */
  private getRecencyScore(date: Date): number {
    const now = new Date()
    const ageInMs = now.getTime() - date.getTime()
    const ageInHours = ageInMs / (1000 * 60 * 60)
    const ageInDays = ageInHours / 24

    if (ageInHours < 24) {
      return 1.0
    } else if (ageInDays < 3) {
      return 0.8
    } else if (ageInDays < 7) {
      return 0.6
    } else {
      return 0.4
    }
  }

  /**
   * Count how many keywords appear in the text
   * Requirements: 3.3, 3.4
   * 
   * Case-insensitive matching
   */
  private countKeywordMatches(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase()
    let count = 0
    
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase()
      if (lowerText.includes(lowerKeyword)) {
        count++
      }
    }
    
    return count
  }

  /**
   * Get list of keywords that matched in the article
   * Requirements: 3.6
   */
  private getMatchedKeywords(article: Article, keywords: string[]): string[] {
    const lowerTitle = article.title.toLowerCase()
    const lowerSnippet = article.snippet.toLowerCase()
    const matched: string[] = []
    
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase()
      if (lowerTitle.includes(lowerKeyword) || lowerSnippet.includes(lowerKeyword)) {
        matched.push(keyword)
      }
    }
    
    return matched
  }
}
