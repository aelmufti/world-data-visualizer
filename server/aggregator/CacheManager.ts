/**
 * CacheManager - In-memory cache with TTL and LRU eviction
 * 
 * Manages caching of aggregation results with time-to-live (TTL) expiration
 * and Least Recently Used (LRU) eviction when maxSize is reached.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { AggregationResult, CacheConfig, CacheEntry } from './types'

export class CacheManager {
  private cache: Map<string, CacheEntry>
  private config: CacheConfig
  private accessOrder: string[] // Track access order for LRU

  constructor(config: CacheConfig) {
    this.cache = new Map()
    this.config = config
    this.accessOrder = []
  }

  /**
   * Generate cache key for a sector and timestamp
   * Format: news:${sector}:${timestamp_rounded_to_15min}
   * 
   * @param sector - The sector name
   * @param timestamp - Optional timestamp (defaults to now)
   * @returns Cache key string
   */
  static generateKey(sector: string, timestamp: Date = new Date()): string {
    // Round timestamp to nearest 15 minutes
    const roundedTime = Math.floor(timestamp.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000)
    return `news:${sector}:${roundedTime}`
  }

  /**
   * Get cached result for a key
   * Returns null if key doesn't exist or is expired
   * 
   * @param key - Cache key
   * @returns Cached aggregation result or null
   */
  get(key: string): AggregationResult | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (this.isExpired(key)) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      return null
    }

    // Update access order for LRU
    this.updateAccessOrder(key)
    
    return entry.data
  }

  /**
   * Store a value in the cache
   * Evicts oldest entry if maxSize is reached
   * 
   * @param key - Cache key
   * @param value - Aggregation result to cache
   */
  set(key: string, value: AggregationResult): void {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.config.ttl)

    const entry: CacheEntry = {
      data: value,
      timestamp: now,
      expiresAt
    }

    // Check if we need to evict before adding
    if (!this.cache.has(key) && this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)
  }

  /**
   * Check if a key exists in the cache (regardless of expiration)
   * 
   * @param key - Cache key
   * @returns True if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Check if a cached entry is expired
   * 
   * @param key - Cache key
   * @returns True if expired or doesn't exist
   */
  isExpired(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return true
    }

    return new Date() >= entry.expiresAt
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Get the current size of the cache
   * 
   * @returns Number of entries in cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Evict the least recently used entry
   * Private method called when maxSize is reached
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) {
      return
    }

    // Remove the oldest (first) entry
    const oldestKey = this.accessOrder[0]
    this.cache.delete(oldestKey)
    this.accessOrder.shift()
  }

  /**
   * Update access order for LRU tracking
   * Moves key to end of access order (most recently used)
   * 
   * @param key - Cache key
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position if it exists
    this.removeFromAccessOrder(key)
    
    // Add to end (most recently used)
    this.accessOrder.push(key)
  }

  /**
   * Remove key from access order tracking
   * 
   * @param key - Cache key
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
  }
}
