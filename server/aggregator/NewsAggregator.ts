/**
 * NewsAggregator - Core orchestration for multi-source news aggregation
 * 
 * Coordinates parallel fetching from multiple news sources, scoring, deduplication,
 * filtering, and caching of news articles.
 * 
 * Requirements: 1.1, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 8.3, 8.4
 */

import type {
  Article,
  ScoredArticle,
  AggregationResult,
  ArticleResponse,
  NewsAggregatorConfiguration,
  NewsSourceAdapter,
  AggregationMetrics,
  SourceMetrics
} from './types.js'
import { KeywordManager } from './KeywordManager.js'
import { RelevanceScorer } from './RelevanceScorer.js'
import { Deduplicator } from './Deduplicator.js'
import { CacheManager } from './CacheManager.js'
import { NewsApiAdapter } from './adapters/NewsApiAdapter.js'
import { BingNewsAdapter } from './adapters/BingNewsAdapter.js'
import { GoogleNewsAdapter } from './adapters/GoogleNewsAdapter.js'

/**
 * Core news aggregator class
 * 
 * Orchestrates the entire news aggregation pipeline:
 * 1. Check cache for existing results
 * 2. Fetch articles from all sources in parallel (Promise.allSettled)
 * 3. Score articles for relevance
 * 4. Deduplicate similar articles
 * 5. Filter and sort by relevance
 * 6. Cache results
 * 7. Return formatted response
 */
export class NewsAggregator {
  private config: NewsAggregatorConfiguration
  private cache: CacheManager
  private keywordManager: KeywordManager
  private scorer: RelevanceScorer
  private deduplicator: Deduplicator
  private sourceMetrics: Map<string, SourceMetrics> = new Map()

  constructor(config: NewsAggregatorConfiguration) {
    this.config = config
    this.cache = new CacheManager(config.cache)
    this.keywordManager = new KeywordManager()
    this.scorer = new RelevanceScorer(config.scoring)
    this.deduplicator = new Deduplicator(config.deduplication)
  }

  /**
   * Main aggregation method
   * 
   * Orchestrates the complete news aggregation pipeline with caching
   * 
   * Requirements:
   * - 1.1: Fetch from all sources in parallel
   * - 1.3: Continue with remaining sources if some fail
   * - 1.4: Complete within 5 seconds maximum
   * - 8.3: Return cached result if valid
   * - 8.4: Fetch fresh data if cache expired
   * 
   * @param sector - Sector name (e.g., 'Énergie', 'Technologie')
   * @returns Aggregation result with articles and metadata
   */
  async aggregateNews(sector: string): Promise<AggregationResult> {
    const startTime = Date.now()

    // Check cache first (Requirement 8.3)
    if (this.config.cache.enabled) {
      const cacheKey = CacheManager.generateKey(sector)
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        // Cache hit - return immediately
        this.logCacheHit(sector)
        return cached
      }
      
      this.logCacheMiss(sector)
    }

    // Get keywords for sector
    const keywords = this.keywordManager.getKeywords(sector)

    // Reset source metrics for this request
    this.sourceMetrics.clear()

    // Fetch from all sources in parallel (Requirement 1.1)
    const articles = await this.fetchFromAllSources(sector, keywords)

    // Handle case where all sources failed (Requirement 6.3)
    if (articles.length === 0) {
      return this.handleAllSourcesFailure()
    }

    // Score articles for relevance
    const scoredArticles = this.scorer.scoreArticles(articles, keywords)

    // Deduplicate articles
    const uniqueArticles = this.config.deduplication.enabled
      ? this.deduplicator.deduplicate(scoredArticles)
      : scoredArticles

    // Filter and sort articles (Requirements 5.1, 5.2, 5.3)
    const filteredArticles = this.filterAndSort(uniqueArticles)

    // Build aggregation result
    const result: AggregationResult = {
      articles: filteredArticles.map(article => this.formatArticle(article)),
      metadata: {
        timestamp: new Date().toISOString(),
        totalArticles: filteredArticles.length,
        sourcesUsed: this.getSuccessfulSources(),
        cacheStatus: 'miss',
        aggregationTime: Date.now() - startTime,
        warnings: this.getWarnings()
      }
    }

    // Cache the result (Requirement 8.4)
    if (this.config.cache.enabled) {
      const cacheKey = CacheManager.generateKey(sector)
      this.cache.set(cacheKey, result)
    }

    // Log metrics (Requirement 6.5)
    this.logAggregationMetrics(sector, startTime, articles.length, uniqueArticles.length, filteredArticles)

    return result
  }

  /**
   * Fetch articles from all enabled sources in parallel
   * 
   * Uses Promise.allSettled to ensure all sources are attempted even if some fail
   * Implements timeout per source (3 seconds default)
   * 
   * Requirements:
   * - 1.1: Parallel fetch from all sources
   * - 1.3: Continue with remaining sources on failure
   * - 6.1: Log errors and continue
   * - 6.2: Handle timeouts gracefully
   * 
   * @param sector - Sector name
   * @param keywords - Keywords to search for
   * @returns Combined array of articles from all successful sources
   */
  async fetchFromAllSources(sector: string, keywords: string[]): Promise<Article[]> {
    const adapters = this.getEnabledAdapters()
    
    // Fetch from all sources in parallel with Promise.allSettled
    // This ensures all sources are attempted even if some fail
    const results = await Promise.allSettled(
      adapters.map(adapter => {
        const sourceConfig = this.getSourceConfig(adapter.name)
        return this.fetchWithTimeout(
          adapter,
          keywords,
          sourceConfig.timeout,
          sourceConfig.maxArticles
        )
      })
    )

    // Collect articles from successful fetches
    const articles: Article[] = []
    
    results.forEach((result, index) => {
      const adapter = adapters[index]
      const startTime = Date.now()

      if (result.status === 'fulfilled' && result.value) {
        // Success - collect articles
        articles.push(...result.value)
        
        // Record success metrics
        this.sourceMetrics.set(adapter.name, {
          success: true,
          duration: Date.now() - startTime,
          articlesCount: result.value.length,
        })
        
        this.logSourceSuccess(adapter.name, result.value.length)
      } else if (result.status === 'rejected') {
        // Failure - log error and continue (Requirement 6.1)
        const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason))
        
        // Record failure metrics
        this.sourceMetrics.set(adapter.name, {
          success: false,
          duration: Date.now() - startTime,
          articlesCount: 0,
          error: error.message
        })
        
        this.logSourceFailure(adapter.name, error)
      }
    })

    return articles
  }

  /**
   * Fetch articles from a single source with timeout
   * 
   * Implements timeout mechanism to prevent slow sources from blocking aggregation
   * 
   * Requirement 6.2: Cancel request after timeout and continue with other sources
   * 
   * @param adapter - News source adapter
   * @param keywords - Keywords to search for
   * @param timeoutMs - Timeout in milliseconds (default: 3000)
   * @param maxArticles - Maximum articles to fetch
   * @returns Articles from source, or null if timeout/error
   */
  private async fetchWithTimeout(
    adapter: NewsSourceAdapter,
    keywords: string[],
    timeoutMs: number,
    maxArticles: number
  ): Promise<Article[] | null> {
    // Create timeout promise
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        resolve(null)
      }, timeoutMs)
    })

    // Create fetch promise
    const fetchPromise = adapter.fetchArticles(keywords, maxArticles)

    // Race between fetch and timeout
    const result = await Promise.race([fetchPromise, timeoutPromise])

    // If timeout occurred, throw error
    if (result === null) {
      throw new Error(`Timeout after ${timeoutMs}ms`)
    }

    return result
  }

  /**
   * Filter and sort articles by relevance
   * 
   * Requirements:
   * - 5.1: Sort by relevance score descending
   * - 5.2: Filter by minimum relevance score (0.3)
   * - 5.3: Limit to maximum 20 articles
   * - 5.4: Fallback to lower threshold (0.2) if < 5 articles
   * 
   * @param articles - Scored articles to filter and sort
   * @returns Filtered and sorted articles
   */
  private filterAndSort(articles: ScoredArticle[]): ScoredArticle[] {
    const {
      minRelevanceScore,
      fallbackMinScore,
      minArticlesThreshold,
      maxArticlesReturned
    } = this.config.filtering

    // Try with primary threshold (0.3)
    let filtered = articles.filter(a => a.relevanceScore >= minRelevanceScore)

    // Fallback to lower threshold if too few articles (Requirement 5.4)
    if (filtered.length < minArticlesThreshold) {
      filtered = articles.filter(a => a.relevanceScore >= fallbackMinScore)
    }

    // Sort by relevance score descending (Requirement 5.1)
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Limit to max articles (Requirement 5.3)
    return filtered.slice(0, maxArticlesReturned)
  }

  /**
   * Format article for API response
   * 
   * Converts internal ScoredArticle to ArticleResponse with French date formatting
   * 
   * @param article - Scored article to format
   * @returns Formatted article response
   */
  private formatArticle(article: ScoredArticle): ArticleResponse {
    return {
      title: article.title,
      snippet: article.snippet,
      date: this.formatDateFrench(article.date),
      source: article.source,
      url: article.url,
      relevanceScore: Math.round(article.relevanceScore * 100) / 100
    }
  }

  /**
   * Format date in French human-readable format
   * 
   * Examples: "Il y a 2h", "Hier", "Il y a 3 jours"
   * 
   * @param date - Date to format
   * @returns French formatted date string
   */
  private formatDateFrench(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Handle future dates or very recent dates (< 1 minute)
    if (diffMins < 1) {
      return `Il y a 0 min`
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    }
  }

  /**
   * Get list of enabled and configured adapters
   * 
   * @returns Array of enabled news source adapters
   */
  private getEnabledAdapters(): NewsSourceAdapter[] {
    const adapters: NewsSourceAdapter[] = []

    if (this.config.sources.newsapi.enabled) {
      const adapter = new NewsApiAdapter(this.config.sources.newsapi.apiKey)
      if (adapter.isConfigured()) {
        adapters.push(adapter)
      }
    }

    if (this.config.sources.bing.enabled) {
      adapters.push(new BingNewsAdapter())
    }

    if (this.config.sources.google.enabled) {
      adapters.push(new GoogleNewsAdapter())
    }

    return adapters
  }

  /**
   * Get source configuration by adapter name
   * 
   * @param adapterName - Name of the adapter
   * @returns Source configuration
   */
  private getSourceConfig(adapterName: string): { timeout: number; maxArticles: number } {
    const name = adapterName.toLowerCase().replace(/\s+/g, '')
    
    if (name === 'newsapi') {
      return {
        timeout: this.config.sources.newsapi.timeout,
        maxArticles: this.config.sources.newsapi.maxArticles
      }
    } else if (name === 'bingnews') {
      return {
        timeout: this.config.sources.bing.timeout,
        maxArticles: this.config.sources.bing.maxArticles
      }
    } else if (name === 'googlenews') {
      return {
        timeout: this.config.sources.google.timeout,
        maxArticles: this.config.sources.google.maxArticles
      }
    }

    // Default fallback
    return { timeout: 3000, maxArticles: 10 }
  }

  /**
   * Get list of sources that successfully fetched articles
   * 
   * @returns Array of successful source names
   */
  private getSuccessfulSources(): string[] {
    const successful: string[] = []
    
    this.sourceMetrics.forEach((metrics, sourceName) => {
      if (metrics.success) {
        successful.push(sourceName)
      }
    })

    return successful
  }

  /**
   * Get warnings about source failures
   * 
   * @returns Array of warning messages, or undefined if no warnings
   */
  private getWarnings(): string[] | undefined {
    const warnings: string[] = []

    this.sourceMetrics.forEach((metrics, sourceName) => {
      if (!metrics.success && metrics.error) {
        warnings.push(`${sourceName} failed: ${metrics.error}`)
      }
    })

    return warnings.length > 0 ? warnings : undefined
  }

  /**
   * Handle case where all sources failed
   * 
   * Requirement 6.3: Return empty result with error message
   * 
   * @returns Empty aggregation result with error
   */
  private handleAllSourcesFailure(): AggregationResult {
    return {
      articles: [],
      metadata: {
        timestamp: new Date().toISOString(),
        totalArticles: 0,
        sourcesUsed: [],
        cacheStatus: 'miss'
      },
      error: 'All news sources failed to retrieve articles'
    }
  }

  /**
   * Calculate average relevance score
   * 
   * @param articles - Scored articles
   * @returns Average score
   */
  private calculateAverageScore(articles: ScoredArticle[]): number {
    if (articles.length === 0) return 0
    const sum = articles.reduce((acc, a) => acc + a.relevanceScore, 0)
    return sum / articles.length
  }

  // ============================================================================
  // Logging Methods (Requirement 6.5)
  // ============================================================================

  private logCacheHit(sector: string): void {
    console.log(`[NewsAggregator] Cache HIT for sector: ${sector}`)
  }

  private logCacheMiss(sector: string): void {
    console.log(`[NewsAggregator] Cache MISS for sector: ${sector}`)
  }

  private logSourceSuccess(sourceName: string, articleCount: number): void {
    console.log(`[NewsAggregator] ${sourceName} fetched ${articleCount} articles`)
  }

  private logSourceFailure(sourceName: string, error: Error): void {
    console.error(`[NewsAggregator] ${sourceName} failed:`, error.message)
  }

  private logAggregationMetrics(
    sector: string,
    startTime: number,
    totalFetched: number,
    afterDedup: number,
    filtered: ScoredArticle[]
  ): void {
    const duration = Date.now() - startTime
    const avgScore = this.calculateAverageScore(filtered)

    const metrics: AggregationMetrics = {
      sector,
      timestamp: new Date(),
      totalDuration: duration,
      sources: Object.fromEntries(this.sourceMetrics),
      totalArticlesFetched: totalFetched,
      articlesAfterDeduplication: afterDedup,
      articlesReturned: filtered.length,
      averageRelevanceScore: avgScore,
      cacheStatus: 'miss'
    }

    console.log('[NewsAggregator] Aggregation metrics:', JSON.stringify(metrics, null, 2))
  }
}
