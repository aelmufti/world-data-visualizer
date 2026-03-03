/**
 * Core TypeScript types for the Multi-Source News Aggregation system
 * 
 * This file defines all interfaces and types used throughout the news aggregator.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

// ============================================================================
// Article Types
// ============================================================================

/**
 * Raw article from a news source
 */
export interface Article {
  id: string              // Format: `${source}-${hash(title)}`
  title: string           // Max 200 chars
  snippet: string         // Max 300 chars
  date: Date              // Publication date
  source: string          // 'NewsAPI' | 'Bing News' | 'Google News'
  url?: string            // Optional article URL
  rawData?: any           // Original response from source
}

/**
 * Article with relevance score and matched keywords
 */
export interface ScoredArticle extends Article {
  relevanceScore: number      // 0.0 to 1.0
  matchedKeywords: string[]   // Keywords found in title/snippet
}

/**
 * Article formatted for API response
 */
export interface ArticleResponse {
  title: string
  snippet: string
  date: string              // Human-readable: "Il y a 2h", "Hier", "Il y a 3 jours"
  source: string
  url?: string
  relevanceScore: number
}

// ============================================================================
// News Source Adapter Types
// ============================================================================

/**
 * Status information for a news source
 */
export interface SourceStatus {
  available: boolean
  lastSuccess: Date | null
  lastError: Error | null
  consecutiveFailures: number
}

/**
 * Interface that all news source adapters must implement
 */
export interface NewsSourceAdapter {
  name: string
  
  fetchArticles(keywords: string[], maxResults: number): Promise<Article[]>
  isConfigured(): boolean
  getStatus(): SourceStatus
}

/**
 * Configuration for a single news source
 */
export interface SourceConfig {
  name: string
  enabled: boolean
  adapter: NewsSourceAdapter
  timeout: number       // milliseconds
  maxArticles: number
}

// ============================================================================
// Aggregation Result Types
// ============================================================================

/**
 * Metadata included in aggregation response
 */
export interface AggregationMetadata {
  timestamp: string         // ISO 8601
  totalArticles: number
  sourcesUsed: string[]
  cacheStatus: 'hit' | 'miss'
  aggregationTime?: number  // milliseconds (only on cache miss)
  warnings?: string[]       // Optional warnings about source failures
}

/**
 * Complete aggregation result returned by the API
 */
export interface AggregationResult {
  articles: ArticleResponse[]
  metadata: AggregationMetadata
  error?: string
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Scoring algorithm configuration
 */
export interface ScoringConfig {
  titleWeight: number      // Default: 0.5
  snippetWeight: number    // Default: 0.3
  recencyWeight: number    // Default: 0.2
  keywordBonus: number     // Default: 0.1 per additional keyword
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean
  ttl: number              // milliseconds, default: 900000 (15 min)
  maxSize: number          // default: 100 entries
}

/**
 * Deduplication algorithm configuration
 */
export interface DeduplicationConfig {
  enabled: boolean
  similarityThreshold: number // Default: 0.7 (70%)
  algorithm: 'jaccard' | 'levenshtein'
}

/**
 * Filtering configuration
 */
export interface FilteringConfig {
  minRelevanceScore: number       // Default: 0.3
  fallbackMinScore: number        // Default: 0.2
  minArticlesThreshold: number    // Default: 5
  maxArticlesReturned: number     // Default: 20
}

/**
 * NewsAPI source configuration
 */
export interface NewsApiSourceConfig {
  enabled: boolean
  apiKey: string
  timeout: number
  maxArticles: number
}

/**
 * Bing News source configuration
 */
export interface BingSourceConfig {
  enabled: boolean
  timeout: number
  maxArticles: number
}

/**
 * Google News source configuration
 */
export interface GoogleSourceConfig {
  enabled: boolean
  timeout: number
  maxArticles: number
}

/**
 * Complete news aggregator configuration
 */
export interface NewsAggregatorConfiguration {
  sources: {
    newsapi: NewsApiSourceConfig
    bing: BingSourceConfig
    google: GoogleSourceConfig
  }
  cache: CacheConfig
  scoring: ScoringConfig
  deduplication: DeduplicationConfig
  filtering: FilteringConfig
}

// ============================================================================
// Sector Keywords Types
// ============================================================================

/**
 * Keywords organized by category for a sector
 */
export interface SectorKeywords {
  primary: string[]      // Direct sector keywords
  secondary: string[]    // Related terms
  geopolitical: string[] // Geopolitical events impacting the sector
  contextual: string[]   // Economic/regulatory context
}

// ============================================================================
// Metrics and Logging Types
// ============================================================================

/**
 * Metrics for a single source during aggregation
 */
export interface SourceMetrics {
  success: boolean
  duration: number        // milliseconds
  articlesCount: number
  error?: string
}

/**
 * Complete metrics for an aggregation operation
 */
export interface AggregationMetrics {
  sector: string
  timestamp: Date
  totalDuration: number   // milliseconds
  
  sources: {
    [sourceName: string]: SourceMetrics
  }
  
  totalArticlesFetched: number
  articlesAfterDeduplication: number
  articlesReturned: number
  averageRelevanceScore: number
  
  cacheStatus: 'hit' | 'miss'
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Entry stored in the cache
 */
export interface CacheEntry {
  data: AggregationResult
  timestamp: Date
  expiresAt: Date
}

// ============================================================================
// Default Configuration Values
// ============================================================================

/**
 * Default configuration values for the news aggregator
 * Note: API keys and environment-specific values should be loaded via configuration loader
 */
export const DEFAULT_CONFIG: Omit<NewsAggregatorConfiguration, 'sources'> & {
  sources: {
    newsapi: Omit<NewsApiSourceConfig, 'apiKey'>
    bing: BingSourceConfig
    google: GoogleSourceConfig
  }
} = {
  sources: {
    newsapi: {
      enabled: true,
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
    enabled: true,
    ttl: 900000,  // 15 minutes
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
  }
}

// ============================================================================
// Sector Keywords Data
// ============================================================================

/**
 * Enriched keywords for each sector
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */
export const SECTOR_KEYWORDS: Record<string, SectorKeywords> = {
  'Énergie': {
    primary: ['oil', 'gas', 'energy', 'petroleum', 'crude'],
    secondary: ['renewable', 'solar', 'wind', 'nuclear', 'coal'],
    geopolitical: ['OPEC', 'Strait of Hormuz', 'pipeline', 'sanctions', 'embargo'],
    contextual: ['carbon tax', 'climate policy', 'energy transition', 'drilling']
  },
  'Technologie': {
    primary: ['technology', 'software', 'AI', 'tech', 'digital'],
    secondary: ['semiconductor', 'chip', 'cloud', 'SaaS', 'hardware'],
    geopolitical: ['tech regulation', 'antitrust', 'data privacy', 'export controls'],
    contextual: ['innovation', 'R&D', 'patent', 'cybersecurity', 'quantum']
  },
  'Santé': {
    primary: ['healthcare', 'pharma', 'medical', 'biotech', 'drug'],
    secondary: ['hospital', 'clinical trial', 'FDA', 'vaccine', 'therapy'],
    geopolitical: ['pandemic', 'health crisis', 'drug pricing', 'patent'],
    contextual: ['aging population', 'insurance', 'Medicare', 'regulation']
  },
  'Télécoms': {
    primary: ['telecom', '5G', 'telecommunications', 'wireless', 'network'],
    secondary: ['fiber', 'broadband', 'mobile', 'spectrum', 'infrastructure'],
    geopolitical: ['spectrum auction', 'telecom regulation', 'net neutrality'],
    contextual: ['connectivity', 'bandwidth', 'tower', 'satellite']
  },
  'Industrie': {
    primary: ['manufacturing', 'industry', 'aerospace', 'defense', 'industrial'],
    secondary: ['factory', 'production', 'automation', 'robotics', 'machinery'],
    geopolitical: ['trade war', 'tariff', 'supply chain', 'export', 'sanctions'],
    contextual: ['capacity', 'orders', 'backlog', 'inventory', 'logistics']
  },
  'Services Publics': {
    primary: ['utilities', 'electricity', 'power', 'water', 'infrastructure'],
    secondary: ['grid', 'transmission', 'distribution', 'generation', 'utility'],
    geopolitical: ['regulation', 'rate case', 'subsidy', 'public service'],
    contextual: ['renewable mandate', 'capacity', 'demand', 'weather']
  }
}
