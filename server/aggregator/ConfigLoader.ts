/**
 * ConfigLoader - Loads configuration from environment variables
 * 
 * This module reads all news aggregator configuration from environment variables
 * and provides sensible defaults for all settings.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { NewsAggregatorConfiguration, DEFAULT_CONFIG } from './types'

/**
 * Loads the complete news aggregator configuration from environment variables.
 * Falls back to default values when environment variables are not set.
 * 
 * Environment Variables:
 * - NEWS_API_KEY: API key for NewsAPI (required if NewsAPI is enabled)
 * - NEWSAPI_ENABLED: Enable/disable NewsAPI source (default: true)
 * - NEWSAPI_TIMEOUT: Timeout for NewsAPI requests in ms (default: 3000)
 * - NEWSAPI_MAX_ARTICLES: Max articles to fetch from NewsAPI (default: 10)
 * - BING_ENABLED: Enable/disable Bing News source (default: true)
 * - BING_TIMEOUT: Timeout for Bing News requests in ms (default: 3000)
 * - BING_MAX_ARTICLES: Max articles to fetch from Bing News (default: 10)
 * - GOOGLE_ENABLED: Enable/disable Google News source (default: true)
 * - GOOGLE_TIMEOUT: Timeout for Google News requests in ms (default: 3000)
 * - GOOGLE_MAX_ARTICLES: Max articles to fetch from Google News (default: 10)
 * - CACHE_ENABLED: Enable/disable caching (default: true)
 * - CACHE_TTL: Cache TTL in milliseconds (default: 900000 = 15 min)
 * - CACHE_MAX_SIZE: Maximum cache entries (default: 100)
 * - SCORING_TITLE_WEIGHT: Weight for title in scoring (default: 0.5)
 * - SCORING_SNIPPET_WEIGHT: Weight for snippet in scoring (default: 0.3)
 * - SCORING_RECENCY_WEIGHT: Weight for recency in scoring (default: 0.2)
 * - SCORING_KEYWORD_BONUS: Bonus per additional keyword (default: 0.1)
 * - DEDUP_ENABLED: Enable/disable deduplication (default: true)
 * - DEDUP_THRESHOLD: Similarity threshold for deduplication (default: 0.7)
 * - FILTER_MIN_SCORE: Minimum relevance score (default: 0.3)
 * - FILTER_FALLBACK_SCORE: Fallback minimum score (default: 0.2)
 * - FILTER_MIN_ARTICLES: Minimum articles threshold (default: 5)
 * - FILTER_MAX_ARTICLES: Maximum articles returned (default: 20)
 * 
 * @returns Complete NewsAggregatorConfiguration with all settings
 */
export function loadConfiguration(): NewsAggregatorConfiguration {
  return {
    sources: {
      newsapi: {
        enabled: getEnvBoolean('NEWSAPI_ENABLED', DEFAULT_CONFIG.sources.newsapi.enabled),
        apiKey: process.env.NEWS_API_KEY || '',
        timeout: getEnvNumber('NEWSAPI_TIMEOUT', DEFAULT_CONFIG.sources.newsapi.timeout),
        maxArticles: getEnvNumber('NEWSAPI_MAX_ARTICLES', DEFAULT_CONFIG.sources.newsapi.maxArticles)
      },
      bing: {
        enabled: getEnvBoolean('BING_ENABLED', DEFAULT_CONFIG.sources.bing.enabled),
        timeout: getEnvNumber('BING_TIMEOUT', DEFAULT_CONFIG.sources.bing.timeout),
        maxArticles: getEnvNumber('BING_MAX_ARTICLES', DEFAULT_CONFIG.sources.bing.maxArticles)
      },
      google: {
        enabled: getEnvBoolean('GOOGLE_ENABLED', DEFAULT_CONFIG.sources.google.enabled),
        timeout: getEnvNumber('GOOGLE_TIMEOUT', DEFAULT_CONFIG.sources.google.timeout),
        maxArticles: getEnvNumber('GOOGLE_MAX_ARTICLES', DEFAULT_CONFIG.sources.google.maxArticles)
      }
    },
    cache: {
      enabled: getEnvBoolean('CACHE_ENABLED', DEFAULT_CONFIG.cache.enabled),
      ttl: getEnvNumber('CACHE_TTL', DEFAULT_CONFIG.cache.ttl),
      maxSize: getEnvNumber('CACHE_MAX_SIZE', DEFAULT_CONFIG.cache.maxSize)
    },
    scoring: {
      titleWeight: getEnvNumber('SCORING_TITLE_WEIGHT', DEFAULT_CONFIG.scoring.titleWeight),
      snippetWeight: getEnvNumber('SCORING_SNIPPET_WEIGHT', DEFAULT_CONFIG.scoring.snippetWeight),
      recencyWeight: getEnvNumber('SCORING_RECENCY_WEIGHT', DEFAULT_CONFIG.scoring.recencyWeight),
      keywordBonus: getEnvNumber('SCORING_KEYWORD_BONUS', DEFAULT_CONFIG.scoring.keywordBonus)
    },
    deduplication: {
      enabled: getEnvBoolean('DEDUP_ENABLED', DEFAULT_CONFIG.deduplication.enabled),
      similarityThreshold: getEnvNumber('DEDUP_THRESHOLD', DEFAULT_CONFIG.deduplication.similarityThreshold),
      algorithm: DEFAULT_CONFIG.deduplication.algorithm
    },
    filtering: {
      minRelevanceScore: getEnvNumber('FILTER_MIN_SCORE', DEFAULT_CONFIG.filtering.minRelevanceScore),
      fallbackMinScore: getEnvNumber('FILTER_FALLBACK_SCORE', DEFAULT_CONFIG.filtering.fallbackMinScore),
      minArticlesThreshold: getEnvNumber('FILTER_MIN_ARTICLES', DEFAULT_CONFIG.filtering.minArticlesThreshold),
      maxArticlesReturned: getEnvNumber('FILTER_MAX_ARTICLES', DEFAULT_CONFIG.filtering.maxArticlesReturned)
    }
  }
}

/**
 * Validates that required API keys are present for enabled sources.
 * Logs warnings for sources that are enabled but missing required configuration.
 * 
 * Requirements: 7.2
 * 
 * @param config The configuration to validate
 * @returns Array of validation warnings (empty if all valid)
 */
export function validateConfiguration(config: NewsAggregatorConfiguration): string[] {
  const warnings: string[] = []
  
  // Validate NewsAPI key if enabled
  if (config.sources.newsapi.enabled) {
    if (!config.sources.newsapi.apiKey || config.sources.newsapi.apiKey.trim() === '') {
      warnings.push('NewsAPI is enabled but NEWS_API_KEY is not set or empty')
    }
  }
  
  return warnings
}

/**
 * Logs the active sources at startup.
 * 
 * Requirements: 7.5
 * 
 * @param config The configuration to log
 */
export function logActiveSourcesAtStartup(config: NewsAggregatorConfiguration): void {
  const activeSources: string[] = []
  
  if (config.sources.newsapi.enabled) {
    activeSources.push('NewsAPI')
  }
  if (config.sources.bing.enabled) {
    activeSources.push('Bing News')
  }
  if (config.sources.google.enabled) {
    activeSources.push('Google News')
  }
  
  console.log('[ConfigLoader] Active news sources:', activeSources.join(', '))
  
  if (activeSources.length === 0) {
    console.warn('[ConfigLoader] WARNING: No news sources are enabled!')
  }
}

/**
 * Helper function to parse boolean environment variables.
 * Treats 'false', '0', 'no', 'off' as false, everything else as true.
 * 
 * @param key Environment variable key
 * @param defaultValue Default value if not set
 * @returns Parsed boolean value
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  if (value === undefined) {
    return defaultValue
  }
  const lower = value.toLowerCase()
  return lower !== 'false' && lower !== '0' && lower !== 'no' && lower !== 'off'
}

/**
 * Helper function to parse numeric environment variables.
 * 
 * @param key Environment variable key
 * @param defaultValue Default value if not set or invalid
 * @returns Parsed numeric value
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (value === undefined) {
    return defaultValue
  }
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}
