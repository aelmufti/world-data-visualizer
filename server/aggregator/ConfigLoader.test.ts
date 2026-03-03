/**
 * Unit tests for ConfigLoader
 * 
 * Tests configuration loading, validation, and source management.
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfiguration, validateConfiguration, logActiveSourcesAtStartup } from './ConfigLoader'
import { DEFAULT_CONFIG } from './types'

describe('ConfigLoader', () => {
  // Store original env vars
  const originalEnv = { ...process.env }
  
  beforeEach(() => {
    // Clear relevant env vars before each test
    delete process.env.NEWS_API_KEY
    delete process.env.NEWSAPI_ENABLED
    delete process.env.NEWSAPI_TIMEOUT
    delete process.env.NEWSAPI_MAX_ARTICLES
    delete process.env.BING_ENABLED
    delete process.env.BING_TIMEOUT
    delete process.env.BING_MAX_ARTICLES
    delete process.env.GOOGLE_ENABLED
    delete process.env.GOOGLE_TIMEOUT
    delete process.env.GOOGLE_MAX_ARTICLES
    delete process.env.CACHE_ENABLED
    delete process.env.CACHE_TTL
    delete process.env.CACHE_MAX_SIZE
    delete process.env.SCORING_TITLE_WEIGHT
    delete process.env.SCORING_SNIPPET_WEIGHT
    delete process.env.SCORING_RECENCY_WEIGHT
    delete process.env.SCORING_KEYWORD_BONUS
    delete process.env.DEDUP_ENABLED
    delete process.env.DEDUP_THRESHOLD
    delete process.env.FILTER_MIN_SCORE
    delete process.env.FILTER_FALLBACK_SCORE
    delete process.env.FILTER_MIN_ARTICLES
    delete process.env.FILTER_MAX_ARTICLES
  })
  
  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv }
  })
  
  describe('loadConfiguration', () => {
    it('should load default configuration when no env vars are set', () => {
      const config = loadConfiguration()
      
      expect(config.sources.newsapi.enabled).toBe(DEFAULT_CONFIG.sources.newsapi.enabled)
      expect(config.sources.newsapi.timeout).toBe(DEFAULT_CONFIG.sources.newsapi.timeout)
      expect(config.sources.newsapi.maxArticles).toBe(DEFAULT_CONFIG.sources.newsapi.maxArticles)
      expect(config.sources.newsapi.apiKey).toBe('')
      
      expect(config.sources.bing.enabled).toBe(DEFAULT_CONFIG.sources.bing.enabled)
      expect(config.sources.bing.timeout).toBe(DEFAULT_CONFIG.sources.bing.timeout)
      expect(config.sources.bing.maxArticles).toBe(DEFAULT_CONFIG.sources.bing.maxArticles)
      
      expect(config.sources.google.enabled).toBe(DEFAULT_CONFIG.sources.google.enabled)
      expect(config.sources.google.timeout).toBe(DEFAULT_CONFIG.sources.google.timeout)
      expect(config.sources.google.maxArticles).toBe(DEFAULT_CONFIG.sources.google.maxArticles)
      
      expect(config.cache.enabled).toBe(DEFAULT_CONFIG.cache.enabled)
      expect(config.cache.ttl).toBe(DEFAULT_CONFIG.cache.ttl)
      expect(config.cache.maxSize).toBe(DEFAULT_CONFIG.cache.maxSize)
      
      expect(config.scoring.titleWeight).toBe(DEFAULT_CONFIG.scoring.titleWeight)
      expect(config.scoring.snippetWeight).toBe(DEFAULT_CONFIG.scoring.snippetWeight)
      expect(config.scoring.recencyWeight).toBe(DEFAULT_CONFIG.scoring.recencyWeight)
      expect(config.scoring.keywordBonus).toBe(DEFAULT_CONFIG.scoring.keywordBonus)
      
      expect(config.deduplication.enabled).toBe(DEFAULT_CONFIG.deduplication.enabled)
      expect(config.deduplication.similarityThreshold).toBe(DEFAULT_CONFIG.deduplication.similarityThreshold)
      expect(config.deduplication.algorithm).toBe(DEFAULT_CONFIG.deduplication.algorithm)
      
      expect(config.filtering.minRelevanceScore).toBe(DEFAULT_CONFIG.filtering.minRelevanceScore)
      expect(config.filtering.fallbackMinScore).toBe(DEFAULT_CONFIG.filtering.fallbackMinScore)
      expect(config.filtering.minArticlesThreshold).toBe(DEFAULT_CONFIG.filtering.minArticlesThreshold)
      expect(config.filtering.maxArticlesReturned).toBe(DEFAULT_CONFIG.filtering.maxArticlesReturned)
    })
    
    it('should load NewsAPI configuration from environment variables', () => {
      process.env.NEWS_API_KEY = 'test-api-key-123'
      process.env.NEWSAPI_ENABLED = 'true'
      process.env.NEWSAPI_TIMEOUT = '5000'
      process.env.NEWSAPI_MAX_ARTICLES = '20'
      
      const config = loadConfiguration()
      
      expect(config.sources.newsapi.apiKey).toBe('test-api-key-123')
      expect(config.sources.newsapi.enabled).toBe(true)
      expect(config.sources.newsapi.timeout).toBe(5000)
      expect(config.sources.newsapi.maxArticles).toBe(20)
    })
    
    it('should load Bing News configuration from environment variables', () => {
      process.env.BING_ENABLED = 'false'
      process.env.BING_TIMEOUT = '4000'
      process.env.BING_MAX_ARTICLES = '15'
      
      const config = loadConfiguration()
      
      expect(config.sources.bing.enabled).toBe(false)
      expect(config.sources.bing.timeout).toBe(4000)
      expect(config.sources.bing.maxArticles).toBe(15)
    })
    
    it('should load Google News configuration from environment variables', () => {
      process.env.GOOGLE_ENABLED = 'false'
      process.env.GOOGLE_TIMEOUT = '2500'
      process.env.GOOGLE_MAX_ARTICLES = '12'
      
      const config = loadConfiguration()
      
      expect(config.sources.google.enabled).toBe(false)
      expect(config.sources.google.timeout).toBe(2500)
      expect(config.sources.google.maxArticles).toBe(12)
    })
    
    it('should load cache configuration from environment variables', () => {
      process.env.CACHE_ENABLED = 'false'
      process.env.CACHE_TTL = '600000'
      process.env.CACHE_MAX_SIZE = '50'
      
      const config = loadConfiguration()
      
      expect(config.cache.enabled).toBe(false)
      expect(config.cache.ttl).toBe(600000)
      expect(config.cache.maxSize).toBe(50)
    })
    
    it('should load scoring configuration from environment variables', () => {
      process.env.SCORING_TITLE_WEIGHT = '0.6'
      process.env.SCORING_SNIPPET_WEIGHT = '0.25'
      process.env.SCORING_RECENCY_WEIGHT = '0.15'
      process.env.SCORING_KEYWORD_BONUS = '0.05'
      
      const config = loadConfiguration()
      
      expect(config.scoring.titleWeight).toBe(0.6)
      expect(config.scoring.snippetWeight).toBe(0.25)
      expect(config.scoring.recencyWeight).toBe(0.15)
      expect(config.scoring.keywordBonus).toBe(0.05)
    })
    
    it('should load deduplication configuration from environment variables', () => {
      process.env.DEDUP_ENABLED = 'false'
      process.env.DEDUP_THRESHOLD = '0.8'
      
      const config = loadConfiguration()
      
      expect(config.deduplication.enabled).toBe(false)
      expect(config.deduplication.similarityThreshold).toBe(0.8)
    })
    
    it('should load filtering configuration from environment variables', () => {
      process.env.FILTER_MIN_SCORE = '0.4'
      process.env.FILTER_FALLBACK_SCORE = '0.25'
      process.env.FILTER_MIN_ARTICLES = '8'
      process.env.FILTER_MAX_ARTICLES = '15'
      
      const config = loadConfiguration()
      
      expect(config.filtering.minRelevanceScore).toBe(0.4)
      expect(config.filtering.fallbackMinScore).toBe(0.25)
      expect(config.filtering.minArticlesThreshold).toBe(8)
      expect(config.filtering.maxArticlesReturned).toBe(15)
    })
    
    it('should handle boolean env vars with various false values', () => {
      // Test 'false'
      process.env.NEWSAPI_ENABLED = 'false'
      let config = loadConfiguration()
      expect(config.sources.newsapi.enabled).toBe(false)
      
      // Test '0'
      process.env.NEWSAPI_ENABLED = '0'
      config = loadConfiguration()
      expect(config.sources.newsapi.enabled).toBe(false)
      
      // Test 'no'
      process.env.NEWSAPI_ENABLED = 'no'
      config = loadConfiguration()
      expect(config.sources.newsapi.enabled).toBe(false)
      
      // Test 'off'
      process.env.NEWSAPI_ENABLED = 'off'
      config = loadConfiguration()
      expect(config.sources.newsapi.enabled).toBe(false)
      
      // Test 'true' (should be true)
      process.env.NEWSAPI_ENABLED = 'true'
      config = loadConfiguration()
      expect(config.sources.newsapi.enabled).toBe(true)
      
      // Test '1' (should be true)
      process.env.NEWSAPI_ENABLED = '1'
      config = loadConfiguration()
      expect(config.sources.newsapi.enabled).toBe(true)
    })
    
    it('should handle invalid numeric env vars by using defaults', () => {
      process.env.NEWSAPI_TIMEOUT = 'invalid'
      process.env.CACHE_TTL = 'not-a-number'
      
      const config = loadConfiguration()
      
      expect(config.sources.newsapi.timeout).toBe(DEFAULT_CONFIG.sources.newsapi.timeout)
      expect(config.cache.ttl).toBe(DEFAULT_CONFIG.cache.ttl)
    })
  })
  
  describe('validateConfiguration', () => {
    it('should return no warnings when NewsAPI is disabled', () => {
      const config = loadConfiguration()
      config.sources.newsapi.enabled = false
      config.sources.newsapi.apiKey = ''
      
      const warnings = validateConfiguration(config)
      
      expect(warnings).toHaveLength(0)
    })
    
    it('should return warning when NewsAPI is enabled but API key is missing', () => {
      const config = loadConfiguration()
      config.sources.newsapi.enabled = true
      config.sources.newsapi.apiKey = ''
      
      const warnings = validateConfiguration(config)
      
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('NewsAPI')
      expect(warnings[0]).toContain('NEWS_API_KEY')
    })
    
    it('should return warning when NewsAPI is enabled but API key is whitespace', () => {
      const config = loadConfiguration()
      config.sources.newsapi.enabled = true
      config.sources.newsapi.apiKey = '   '
      
      const warnings = validateConfiguration(config)
      
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('NewsAPI')
    })
    
    it('should return no warnings when NewsAPI is enabled with valid API key', () => {
      const config = loadConfiguration()
      config.sources.newsapi.enabled = true
      config.sources.newsapi.apiKey = 'valid-api-key-123'
      
      const warnings = validateConfiguration(config)
      
      expect(warnings).toHaveLength(0)
    })
    
    it('should not validate API keys for Bing and Google (no API key required)', () => {
      const config = loadConfiguration()
      config.sources.bing.enabled = true
      config.sources.google.enabled = true
      config.sources.newsapi.enabled = false
      
      const warnings = validateConfiguration(config)
      
      expect(warnings).toHaveLength(0)
    })
  })
  
  describe('logActiveSourcesAtStartup', () => {
    it('should log all active sources', () => {
      const config = loadConfiguration()
      config.sources.newsapi.enabled = true
      config.sources.bing.enabled = true
      config.sources.google.enabled = true
      
      // Capture console output
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: any[]) => logs.push(args.join(' '))
      
      logActiveSourcesAtStartup(config)
      
      console.log = originalLog
      
      expect(logs.length).toBeGreaterThan(0)
      const logOutput = logs.join(' ')
      expect(logOutput).toContain('NewsAPI')
      expect(logOutput).toContain('Bing News')
      expect(logOutput).toContain('Google News')
    })
    
    it('should log only enabled sources', () => {
      const config = loadConfiguration()
      config.sources.newsapi.enabled = true
      config.sources.bing.enabled = false
      config.sources.google.enabled = true
      
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: any[]) => logs.push(args.join(' '))
      
      logActiveSourcesAtStartup(config)
      
      console.log = originalLog
      
      const logOutput = logs.join(' ')
      expect(logOutput).toContain('NewsAPI')
      expect(logOutput).not.toContain('Bing News')
      expect(logOutput).toContain('Google News')
    })
    
    it('should log warning when no sources are enabled', () => {
      const config = loadConfiguration()
      config.sources.newsapi.enabled = false
      config.sources.bing.enabled = false
      config.sources.google.enabled = false
      
      const warnings: string[] = []
      const originalWarn = console.warn
      console.warn = (...args: any[]) => warnings.push(args.join(' '))
      
      logActiveSourcesAtStartup(config)
      
      console.warn = originalWarn
      
      expect(warnings.length).toBeGreaterThan(0)
      const warningOutput = warnings.join(' ')
      expect(warningOutput).toContain('No news sources are enabled')
    })
  })
})
