/**
 * Unit tests for CacheManager
 * 
 * Tests cache functionality including TTL, LRU eviction, and key generation
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager } from './CacheManager'
import { AggregationResult, CacheConfig } from './types'

describe('CacheManager', () => {
  let cacheManager: CacheManager
  let config: CacheConfig

  const mockResult: AggregationResult = {
    articles: [
      {
        title: 'Test Article',
        snippet: 'Test snippet',
        date: 'Il y a 2h',
        source: 'NewsAPI',
        relevanceScore: 0.8
      }
    ],
    metadata: {
      timestamp: new Date().toISOString(),
      totalArticles: 1,
      sourcesUsed: ['NewsAPI'],
      cacheStatus: 'miss'
    }
  }

  beforeEach(() => {
    config = {
      enabled: true,
      ttl: 900000, // 15 minutes
      maxSize: 3
    }
    cacheManager = new CacheManager(config)
  })

  describe('generateKey', () => {
    it('should generate cache key with correct format', () => {
      const key = CacheManager.generateKey('Énergie')
      expect(key).toMatch(/^news:Énergie:\d+$/)
    })

    it('should round timestamp to nearest 15 minutes', () => {
      // Test with specific timestamp: 10:07:30
      const timestamp = new Date('2025-01-15T10:07:30Z')
      const key = CacheManager.generateKey('Technologie', timestamp)
      
      // Should round down to 10:00:00
      const expectedTime = new Date('2025-01-15T10:00:00Z').getTime()
      expect(key).toBe(`news:Technologie:${expectedTime}`)
    })

    it('should generate same key for timestamps within same 15-min window', () => {
      const time1 = new Date('2025-01-15T10:05:00Z')
      const time2 = new Date('2025-01-15T10:14:59Z')
      
      const key1 = CacheManager.generateKey('Santé', time1)
      const key2 = CacheManager.generateKey('Santé', time2)
      
      expect(key1).toBe(key2)
    })

    it('should generate different keys for different 15-min windows', () => {
      const time1 = new Date('2025-01-15T10:14:59Z')
      const time2 = new Date('2025-01-15T10:15:00Z')
      
      const key1 = CacheManager.generateKey('Santé', time1)
      const key2 = CacheManager.generateKey('Santé', time2)
      
      expect(key1).not.toBe(key2)
    })
  })

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      const key = 'news:Énergie:123456789'
      cacheManager.set(key, mockResult)
      
      const retrieved = cacheManager.get(key)
      expect(retrieved).toEqual(mockResult)
    })

    it('should return null for non-existent key', () => {
      const retrieved = cacheManager.get('non-existent-key')
      expect(retrieved).toBeNull()
    })

    it('should update existing key', () => {
      const key = 'news:Énergie:123456789'
      cacheManager.set(key, mockResult)
      
      const updatedResult = { ...mockResult, metadata: { ...mockResult.metadata, totalArticles: 5 } }
      cacheManager.set(key, updatedResult)
      
      const retrieved = cacheManager.get(key)
      expect(retrieved?.metadata.totalArticles).toBe(5)
    })
  })

  describe('has', () => {
    it('should return true for existing key', () => {
      const key = 'news:Énergie:123456789'
      cacheManager.set(key, mockResult)
      
      expect(cacheManager.has(key)).toBe(true)
    })

    it('should return false for non-existent key', () => {
      expect(cacheManager.has('non-existent-key')).toBe(false)
    })
  })

  describe('isExpired', () => {
    it('should return false for non-expired entry', () => {
      const key = 'news:Énergie:123456789'
      cacheManager.set(key, mockResult)
      
      expect(cacheManager.isExpired(key)).toBe(false)
    })

    it('should return true for expired entry', () => {
      // Create cache with very short TTL
      const shortTtlConfig: CacheConfig = { enabled: true, ttl: 10, maxSize: 10 }
      const shortTtlCache = new CacheManager(shortTtlConfig)
      
      const key = 'news:Énergie:123456789'
      shortTtlCache.set(key, mockResult)
      
      // Wait for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(shortTtlCache.isExpired(key)).toBe(true)
          resolve()
        }, 20)
      })
    })

    it('should return true for non-existent key', () => {
      expect(cacheManager.isExpired('non-existent-key')).toBe(true)
    })

    it('should return null when getting expired entry', () => {
      // Create cache with very short TTL
      const shortTtlConfig: CacheConfig = { enabled: true, ttl: 10, maxSize: 10 }
      const shortTtlCache = new CacheManager(shortTtlConfig)
      
      const key = 'news:Énergie:123456789'
      shortTtlCache.set(key, mockResult)
      
      // Wait for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const retrieved = shortTtlCache.get(key)
          expect(retrieved).toBeNull()
          resolve()
        }, 20)
      })
    })
  })

  describe('LRU eviction', () => {
    it('should evict oldest entry when maxSize is reached', () => {
      const key1 = 'news:Énergie:1'
      const key2 = 'news:Technologie:2'
      const key3 = 'news:Santé:3'
      const key4 = 'news:Télécoms:4'
      
      cacheManager.set(key1, mockResult)
      cacheManager.set(key2, mockResult)
      cacheManager.set(key3, mockResult)
      
      expect(cacheManager.size()).toBe(3)
      
      // Adding 4th entry should evict key1 (oldest)
      cacheManager.set(key4, mockResult)
      
      expect(cacheManager.size()).toBe(3)
      expect(cacheManager.has(key1)).toBe(false)
      expect(cacheManager.has(key2)).toBe(true)
      expect(cacheManager.has(key3)).toBe(true)
      expect(cacheManager.has(key4)).toBe(true)
    })

    it('should update LRU order on get', () => {
      const key1 = 'news:Énergie:1'
      const key2 = 'news:Technologie:2'
      const key3 = 'news:Santé:3'
      const key4 = 'news:Télécoms:4'
      
      cacheManager.set(key1, mockResult)
      cacheManager.set(key2, mockResult)
      cacheManager.set(key3, mockResult)
      
      // Access key1 to make it most recently used
      cacheManager.get(key1)
      
      // Adding 4th entry should now evict key2 (oldest after key1 was accessed)
      cacheManager.set(key4, mockResult)
      
      expect(cacheManager.has(key1)).toBe(true)
      expect(cacheManager.has(key2)).toBe(false)
      expect(cacheManager.has(key3)).toBe(true)
      expect(cacheManager.has(key4)).toBe(true)
    })

    it('should not evict when updating existing key', () => {
      const key1 = 'news:Énergie:1'
      const key2 = 'news:Technologie:2'
      const key3 = 'news:Santé:3'
      
      cacheManager.set(key1, mockResult)
      cacheManager.set(key2, mockResult)
      cacheManager.set(key3, mockResult)
      
      expect(cacheManager.size()).toBe(3)
      
      // Update existing key should not trigger eviction
      cacheManager.set(key2, { ...mockResult, metadata: { ...mockResult.metadata, totalArticles: 10 } })
      
      expect(cacheManager.size()).toBe(3)
      expect(cacheManager.has(key1)).toBe(true)
      expect(cacheManager.has(key2)).toBe(true)
      expect(cacheManager.has(key3)).toBe(true)
    })
  })

  describe('clear', () => {
    it('should remove all entries', () => {
      cacheManager.set('key1', mockResult)
      cacheManager.set('key2', mockResult)
      cacheManager.set('key3', mockResult)
      
      expect(cacheManager.size()).toBe(3)
      
      cacheManager.clear()
      
      expect(cacheManager.size()).toBe(0)
      expect(cacheManager.has('key1')).toBe(false)
      expect(cacheManager.has('key2')).toBe(false)
      expect(cacheManager.has('key3')).toBe(false)
    })
  })

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cacheManager.size()).toBe(0)
      
      cacheManager.set('key1', mockResult)
      expect(cacheManager.size()).toBe(1)
      
      cacheManager.set('key2', mockResult)
      expect(cacheManager.size()).toBe(2)
      
      cacheManager.clear()
      expect(cacheManager.size()).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle cache with maxSize of 1', () => {
      const smallConfig: CacheConfig = { enabled: true, ttl: 900000, maxSize: 1 }
      const smallCache = new CacheManager(smallConfig)
      
      smallCache.set('key1', mockResult)
      expect(smallCache.size()).toBe(1)
      
      smallCache.set('key2', mockResult)
      expect(smallCache.size()).toBe(1)
      expect(smallCache.has('key1')).toBe(false)
      expect(smallCache.has('key2')).toBe(true)
    })

    it('should handle empty cache eviction gracefully', () => {
      // This shouldn't throw an error
      expect(() => {
        const emptyCache = new CacheManager(config)
        // Force eviction on empty cache (internal method, but tested via set)
        emptyCache.set('key1', mockResult)
      }).not.toThrow()
    })

    it('should handle cache expiration at exact TTL boundary', () => {
      // Create cache with 100ms TTL
      const boundaryConfig: CacheConfig = { enabled: true, ttl: 100, maxSize: 10 }
      const boundaryCache = new CacheManager(boundaryConfig)
      
      const key = 'news:Énergie:123456789'
      boundaryCache.set(key, mockResult)
      
      // Should be valid immediately
      expect(boundaryCache.isExpired(key)).toBe(false)
      expect(boundaryCache.get(key)).not.toBeNull()
      
      // Wait for exact TTL boundary
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Should be expired after TTL
          expect(boundaryCache.isExpired(key)).toBe(true)
          expect(boundaryCache.get(key)).toBeNull()
          resolve()
        }, 110)
      })
    })

    it('should generate consistent cache keys for same sector and time window', () => {
      const sector = 'Technologie'
      const baseTime = new Date('2025-01-15T10:07:30Z')
      
      // Generate keys at different times within same 15-min window
      const key1 = CacheManager.generateKey(sector, new Date('2025-01-15T10:00:00Z'))
      const key2 = CacheManager.generateKey(sector, new Date('2025-01-15T10:07:30Z'))
      const key3 = CacheManager.generateKey(sector, new Date('2025-01-15T10:14:59Z'))
      
      // All should be identical
      expect(key1).toBe(key2)
      expect(key2).toBe(key3)
      
      // But different from next window
      const key4 = CacheManager.generateKey(sector, new Date('2025-01-15T10:15:00Z'))
      expect(key3).not.toBe(key4)
    })

    it('should handle LRU eviction correctly when maxSize is reached', () => {
      const lruConfig: CacheConfig = { enabled: true, ttl: 900000, maxSize: 3 }
      const lruCache = new CacheManager(lruConfig)
      
      // Add 3 entries
      lruCache.set('key1', mockResult)
      lruCache.set('key2', mockResult)
      lruCache.set('key3', mockResult)
      
      expect(lruCache.size()).toBe(3)
      
      // Access key1 to make it most recently used
      lruCache.get('key1')
      
      // Add key4, should evict key2 (oldest)
      lruCache.set('key4', mockResult)
      
      expect(lruCache.size()).toBe(3)
      expect(lruCache.has('key1')).toBe(true)
      expect(lruCache.has('key2')).toBe(false)
      expect(lruCache.has('key3')).toBe(true)
      expect(lruCache.has('key4')).toBe(true)
    })

    it('should handle multiple rapid cache operations', () => {
      const rapidCache = new CacheManager(config)
      
      // Rapidly set and get multiple keys
      for (let i = 0; i < 10; i++) {
        const key = `news:Sector${i}:${Date.now()}`
        rapidCache.set(key, mockResult)
        expect(rapidCache.get(key)).not.toBeNull()
      }
      
      // Should respect maxSize
      expect(rapidCache.size()).toBeLessThanOrEqual(config.maxSize)
    })

    it('should handle cache key generation with special characters in sector name', () => {
      const specialSectors = ['Énergie', 'Télécoms', 'Services Publics', 'Santé']
      const timestamp = new Date('2025-01-15T10:00:00Z')
      
      specialSectors.forEach(sector => {
        const key = CacheManager.generateKey(sector, timestamp)
        expect(key).toContain(sector)
        expect(key).toMatch(/^news:.+:\d+$/)
      })
    })
  })
})

/**
 * Property-Based Tests for CacheManager
 * Using fast-check for property testing
 */

import fc from 'fast-check'

describe('CacheManager Property Tests', () => {
  /**
   * Property 20: Cache Hit Behavior
   * For any sector request where a valid (non-expired) cached result exists,
   * the aggregator SHALL return the cached result without fetching from any news sources
   * 
   * Validates: Requirements 8.3
   */
  it('Property 20: should return cached result for non-expired entries', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // sector name
        fc.integer({ min: 1, max: 100 }), // number of articles
        fc.integer({ min: 1, max: 10 }), // cache size
        (sector, articleCount, maxSize) => {
          // Create cache with long TTL (won't expire during test)
          const config: CacheConfig = {
            enabled: true,
            ttl: 900000, // 15 minutes
            maxSize
          }
          const cache = new CacheManager(config)
          
          // Generate cache key
          const key = CacheManager.generateKey(sector)
          
          // Create mock result
          const mockResult: AggregationResult = {
            articles: Array(articleCount).fill(null).map((_, i) => ({
              title: `Article ${i}`,
              snippet: `Snippet ${i}`,
              date: 'Il y a 1h',
              source: 'NewsAPI',
              relevanceScore: 0.8
            })),
            metadata: {
              timestamp: new Date().toISOString(),
              totalArticles: articleCount,
              sourcesUsed: ['NewsAPI'],
              cacheStatus: 'miss'
            }
          }
          
          // Store in cache
          cache.set(key, mockResult)
          
          // Verify cache hit
          const retrieved = cache.get(key)
          
          // Property: cached result should be returned and not be null
          return retrieved !== null &&
                 retrieved.articles.length === articleCount &&
                 retrieved.metadata.totalArticles === articleCount
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 21: Cache Refresh on Expiration
   * For any sector request where the cached result is expired (older than 15 minutes),
   * the aggregator SHALL fetch fresh articles from all sources and update the cache
   * 
   * Validates: Requirements 8.4
   */
  it('Property 21: should return null for expired entries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // sector name
        fc.integer({ min: 1, max: 50 }), // number of articles
        async (sector, articleCount) => {
          // Create cache with very short TTL
          const config: CacheConfig = {
            enabled: true,
            ttl: 10, // 10ms - will expire quickly
            maxSize: 10
          }
          const cache = new CacheManager(config)
          
          // Generate cache key
          const key = CacheManager.generateKey(sector)
          
          // Create mock result
          const mockResult: AggregationResult = {
            articles: Array(articleCount).fill(null).map((_, i) => ({
              title: `Article ${i}`,
              snippet: `Snippet ${i}`,
              date: 'Il y a 1h',
              source: 'NewsAPI',
              relevanceScore: 0.8
            })),
            metadata: {
              timestamp: new Date().toISOString(),
              totalArticles: articleCount,
              sourcesUsed: ['NewsAPI'],
              cacheStatus: 'miss'
            }
          }
          
          // Store in cache
          cache.set(key, mockResult)
          
          // Wait for expiration
          await new Promise<void>((resolve) => setTimeout(resolve, 20))
          
          const retrieved = cache.get(key)
          // Property: expired entry should return null
          return retrieved === null && cache.isExpired(key)
        }
      ),
      { numRuns: 100 }
    )
  })
})
