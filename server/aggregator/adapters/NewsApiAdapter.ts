/**
 * NewsAPI Adapter
 * 
 * Fetches articles from NewsAPI v2/everything endpoint
 * Requirements: 1.2, 1.5, 7.2
 */

import { createHash } from 'crypto'
import type { Article, NewsSourceAdapter, SourceStatus } from '../types'

/**
 * NewsAPI response types
 */
interface NewsApiArticle {
  title: string
  description: string | null
  publishedAt: string
  url: string
  source: {
    name: string
  }
}

interface NewsApiResponse {
  status: string
  totalResults: number
  articles: NewsApiArticle[]
  code?: string
  message?: string
}

/**
 * Adapter for NewsAPI v2/everything endpoint
 * 
 * Fetches articles using keyword search with OR logic
 * Normalizes responses to the common Article interface
 */
export class NewsApiAdapter implements NewsSourceAdapter {
  readonly name = 'NewsAPI'
  private apiKey: string
  private baseUrl = 'https://newsapi.org/v2/everything'
  private status: SourceStatus = {
    available: true,
    lastSuccess: null,
    lastError: null,
    consecutiveFailures: 0
  }

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Check if the adapter is properly configured
   * Validates that API key is present and non-empty
   * 
   * Requirement 7.2: Validate API keys before attempting to fetch articles
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0)
  }

  /**
   * Get current status of the news source
   */
  getStatus(): SourceStatus {
    return { ...this.status }
  }

  /**
   * Fetch articles from NewsAPI
   * 
   * @param keywords - Array of keywords to search for (combined with OR logic)
   * @param maxResults - Maximum number of articles to retrieve (default: 10)
   * @returns Array of normalized Article objects
   * 
   * Requirements:
   * - 1.2: Support NewsAPI as a news source
   * - 1.5: Retrieve at least 10 articles per source when available
   * - 7.2: Validate API key before fetching
   */
  async fetchArticles(keywords: string[], maxResults: number = 10): Promise<Article[]> {
    // Validate configuration before attempting fetch
    if (!this.isConfigured()) {
      const error = new Error('NewsAPI adapter not configured: missing or invalid API key')
      this.updateStatus(false, error)
      throw error
    }

    // Validate inputs
    if (!keywords || keywords.length === 0) {
      const error = new Error('Keywords array cannot be empty')
      // Don't update status for input validation errors
      throw error
    }

    try {
      // Build query string: keywords joined with OR
      const query = keywords.join(' OR ')
      
      // Build URL with query parameters
      const url = new URL(this.baseUrl)
      url.searchParams.append('q', query)
      url.searchParams.append('language', 'en')
      url.searchParams.append('sortBy', 'publishedAt')
      url.searchParams.append('pageSize', Math.min(maxResults, 100).toString()) // NewsAPI max is 100
      url.searchParams.append('apiKey', this.apiKey)

      // Fetch from NewsAPI
      const response = await fetch(url.toString())
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `NewsAPI HTTP error: ${response.status} ${response.statusText}`
        
        try {
          const errorJson = JSON.parse(errorText) as NewsApiResponse
          if (errorJson.message) {
            errorMessage = `NewsAPI error: ${errorJson.message}`
          }
        } catch {
          // If not JSON, use the text
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        }
        
        const error = new Error(errorMessage)
        this.updateStatus(false, error)
        throw error
      }

      // Parse response
      const data = await response.json() as NewsApiResponse

      // Check for API-level errors
      if (data.status !== 'ok') {
        const error = new Error(`NewsAPI returned error status: ${data.message || 'Unknown error'}`)
        this.updateStatus(false, error)
        throw error
      }

      // Normalize articles to our Article interface
      const articles = data.articles
        .filter(article => article.title && article.title !== '[Removed]') // Filter out removed articles
        .map(article => this.normalizeArticle(article))

      // Update status on success
      this.updateStatus(true)

      return articles

    } catch (error) {
      // Only update status if we haven't already (for unexpected errors)
      const err = error instanceof Error ? error : new Error(String(error))
      
      // Check if this is an error we already handled (has been logged)
      // If the error message starts with "NewsAPI", we already updated status
      if (!err.message.startsWith('NewsAPI')) {
        this.updateStatus(false, err)
      }
      
      throw err
    }
  }

  /**
   * Normalize a NewsAPI article to our Article interface
   * 
   * @param article - Raw article from NewsAPI
   * @returns Normalized Article object
   */
  private normalizeArticle(article: NewsApiArticle): Article {
    // Generate unique ID: newsapi-{hash of title}
    const id = this.generateArticleId(article.title)

    // Truncate title and snippet to max lengths
    const title = this.truncate(article.title, 200)
    const snippet = this.truncate(article.description || '', 300)

    // Parse date
    const date = new Date(article.publishedAt)

    return {
      id,
      title,
      snippet,
      date,
      source: this.name,
      url: article.url,
      rawData: article
    }
  }

  /**
   * Generate a unique article ID based on source and title hash
   * Format: newsapi-{hash}
   * 
   * @param title - Article title
   * @returns Unique article ID
   */
  private generateArticleId(title: string): string {
    const hash = createHash('md5')
      .update(title.toLowerCase().trim())
      .digest('hex')
      .substring(0, 12) // Use first 12 chars of hash
    
    return `newsapi-${hash}`
  }

  /**
   * Truncate text to maximum length
   * 
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * Update adapter status after fetch attempt
   * 
   * @param success - Whether the fetch was successful
   * @param error - Error object if fetch failed
   */
  private updateStatus(success: boolean, error?: Error): void {
    if (success) {
      this.status.available = true
      this.status.lastSuccess = new Date()
      this.status.consecutiveFailures = 0
      this.status.lastError = null
    } else {
      this.status.consecutiveFailures++
      this.status.lastError = error || null
      
      // Circuit breaker: mark as unavailable after 3 consecutive failures
      if (this.status.consecutiveFailures >= 3) {
        this.status.available = false
      }
    }
  }
}
