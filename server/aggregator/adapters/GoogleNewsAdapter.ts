/**
 * Google News RSS Adapter
 * 
 * Fetches articles from Google News RSS feed
 * Requirements: 1.2, 1.5
 */

import { createHash } from 'crypto'
import type { Article, NewsSourceAdapter, SourceStatus } from '../types'

/**
 * Adapter for Google News RSS feed
 * 
 * Fetches articles from public RSS feed (no API key required)
 * Parses RSS XML with regex extraction
 * Normalizes responses to the common Article interface
 */
export class GoogleNewsAdapter implements NewsSourceAdapter {
  readonly name = 'Google News'
  private baseUrl = 'https://news.google.com/rss/search'
  private status: SourceStatus = {
    available: true,
    lastSuccess: null,
    lastError: null,
    consecutiveFailures: 0
  }

  /**
   * Check if the adapter is properly configured
   * Google News RSS is public, so always configured
   */
  isConfigured(): boolean {
    return true
  }

  /**
   * Get current status of the news source
   */
  getStatus(): SourceStatus {
    return { ...this.status }
  }

  /**
   * Fetch articles from Google News RSS
   * 
   * @param keywords - Array of keywords to search for
   * @param maxResults - Maximum number of articles to retrieve (default: 10)
   * @returns Array of normalized Article objects
   * 
   * Requirements:
   * - 1.2: Support Google News RSS as a news source
   * - 1.5: Retrieve at least 10 articles per source when available
   */
  async fetchArticles(keywords: string[], maxResults: number = 10): Promise<Article[]> {
    // Validate inputs
    if (!keywords || keywords.length === 0) {
      throw new Error('Keywords array cannot be empty')
    }

    try {
      // Build query string: keywords joined with spaces
      const query = keywords.join(' ')
      
      // Build URL with query parameters
      const url = new URL(this.baseUrl)
      url.searchParams.append('q', query)
      url.searchParams.append('hl', 'fr')
      url.searchParams.append('gl', 'FR')

      // Fetch from Google News RSS
      const response = await fetch(url.toString())
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text()
        const errorMessage = `Google News HTTP error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
        const error = new Error(errorMessage)
        this.updateStatus(false, error)
        throw error
      }

      // Get RSS XML content
      const xmlText = await response.text()

      // Parse RSS XML with regex
      const articles = this.parseRssXml(xmlText, maxResults)

      // Update status on success
      this.updateStatus(true)

      return articles

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      // Only update status if we haven't already
      if (!err.message.startsWith('Google News')) {
        this.updateStatus(false, err)
      }
      
      throw err
    }
  }

  /**
   * Parse RSS XML and extract articles
   * Uses regex to extract <item> elements and their fields
   * 
   * @param xmlText - RSS XML content
   * @param maxResults - Maximum number of articles to extract
   * @returns Array of normalized Article objects
   */
  private parseRssXml(xmlText: string, maxResults: number): Article[] {
    const articles: Article[] = []

    // Extract all <item>...</item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let itemMatch: RegExpExecArray | null

    while ((itemMatch = itemRegex.exec(xmlText)) !== null && articles.length < maxResults) {
      const itemContent = itemMatch[1]

      try {
        // Extract title (with CDATA support)
        const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(itemContent) ||
                          /<title>(.*?)<\/title>/.exec(itemContent)
        const title = titleMatch ? this.decodeHtml(titleMatch[1].trim()) : ''

        // Extract description (with CDATA support)
        const descMatch = /<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(itemContent) ||
                         /<description>(.*?)<\/description>/.exec(itemContent)
        const description = descMatch ? this.decodeHtml(descMatch[1].trim()) : ''

        // Extract pubDate
        const dateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(itemContent)
        const pubDate = dateMatch ? dateMatch[1].trim() : ''

        // Extract link
        const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent)
        const link = linkMatch ? linkMatch[1].trim() : undefined

        // Skip if missing required fields
        if (!title || !pubDate) {
          continue
        }

        // Normalize to Article interface
        const article = this.normalizeArticle(title, description, pubDate, link)
        articles.push(article)

      } catch (error) {
        // Skip malformed items
        continue
      }
    }

    return articles
  }

  /**
   * Normalize extracted RSS data to our Article interface
   * 
   * @param title - Article title
   * @param description - Article description
   * @param pubDate - Publication date string
   * @param link - Article URL
   * @returns Normalized Article object
   */
  private normalizeArticle(
    title: string,
    description: string,
    pubDate: string,
    link?: string
  ): Article {
    // Generate unique ID: google-{hash of title}
    const id = this.generateArticleId(title)

    // Truncate title and snippet to max lengths
    const normalizedTitle = this.truncate(title, 200)
    const snippet = this.truncate(this.stripHtml(description), 300)

    // Parse date (RSS uses RFC 822 format)
    const date = new Date(pubDate)

    return {
      id,
      title: normalizedTitle,
      snippet,
      date,
      source: this.name,
      url: link,
      rawData: { title, description, pubDate, link }
    }
  }

  /**
   * Generate a unique article ID based on source and title hash
   * Format: google-{hash}
   * 
   * @param title - Article title
   * @returns Unique article ID
   */
  private generateArticleId(title: string): string {
    const hash = createHash('md5')
      .update(title.toLowerCase().trim())
      .digest('hex')
      .substring(0, 12) // Use first 12 chars of hash
    
    return `google-${hash}`
  }

  /**
   * Strip HTML tags from text
   * 
   * @param text - Text with HTML tags
   * @returns Text without HTML tags
   */
  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '')
  }

  /**
   * Decode HTML entities
   * 
   * @param text - Text with HTML entities
   * @returns Decoded text
   */
  private decodeHtml(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&#x27;': "'",
      '&#x2F;': '/',
      '&nbsp;': ' '
    }

    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity)
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
