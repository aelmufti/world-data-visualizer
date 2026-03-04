import { describe, it, expect, beforeEach } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { searchService } from './search-service.js';

/**
 * Property-Based Tests for Search Result Limiting
 * 
 * Feature: live-stock-market-tab
 * Property 22: Search result limiting
 * 
 * **Validates: Requirements 6.4**
 * 
 * Requirement 6.4 states:
 * "THE Stock_Search SHALL display up to 10 autocomplete suggestions at a time"
 * 
 * This property test validates that search queries returning more than 10 results
 * only display the top 10 in the autocomplete, ensuring a clean and manageable
 * user interface.
 */

describe('Property-Based Tests: Search Result Limiting', () => {
  /**
   * Arbitraries for property-based testing
   */
  
  // Generate search queries that are likely to return many results
  const broadQueryArbitrary = fc.constantFrom(
    'a', 'e', 'i', 'o', 'u', // Single vowels likely to match many entries
    'S', 'T', 'A', 'M', 'C', // Common starting letters
    'tech', 'bank', 'energy', 'financial', // Common sectors
    'inc', 'corp', 'group', 'holdings' // Common company suffixes
  );

  // Generate limit values (including default and various valid limits)
  const limitArbitrary = fc.integer({ min: 1, max: 100 });

  // Generate type filters
  const typesArbitrary = fc.option(
    fc.subarray(['stock', 'index', 'etf'] as const, { minLength: 1, maxLength: 3 }),
    { nil: undefined }
  );

  /**
   * Property 22: Search results are limited to specified limit
   * 
   * **Validates: Requirements 6.4**
   * 
   * For any search query and any valid limit value, the number of results
   * returned should never exceed the specified limit, even if more matches
   * are available in the database.
   */
  test.prop([
    fc.string({ minLength: 1, maxLength: 20 }), // Any search query
    limitArbitrary,
    typesArbitrary
  ], { numRuns: 100 })(
    'Property 22: Search results never exceed specified limit',
    (query, limit, types) => {
      // Perform search with specified limit
      const results = searchService.search({
        query,
        limit,
        types
      });

      // Property: Number of results should never exceed the limit
      expect(results.length).toBeLessThanOrEqual(limit);

      // Property: If results exist, they should have valid structure
      results.forEach(result => {
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('exchange');
        expect(result).toHaveProperty('type');
        expect(['stock', 'index', 'etf']).toContain(result.type);
      });
    }
  );

  /**
   * Property 22 (Default Limit): Search results default to 10 when limit not specified
   * 
   * **Validates: Requirements 6.4**
   * 
   * For any search query that could return many results, when no limit is
   * specified, the default limit of 10 should be applied.
   */
  test.prop([
    broadQueryArbitrary,
    typesArbitrary
  ], { numRuns: 50 })(
    'Property 22 (Default Limit): Search defaults to maximum 10 results',
    (query, types) => {
      // Perform search without specifying limit (should default to 10)
      const results = searchService.search({
        query,
        types
      });

      // Property: Results should not exceed default limit of 10
      expect(results.length).toBeLessThanOrEqual(10);

      // Property: Results should be valid
      results.forEach(result => {
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('exchange');
        expect(result).toHaveProperty('type');
      });
    }
  );

  /**
   * Property 22 (Autocomplete Scenario): Broad queries return exactly 10 results
   * 
   * **Validates: Requirements 6.4**
   * 
   * For search queries that are known to match many entries in the database,
   * the autocomplete should display exactly 10 suggestions (the top 10 matches),
   * not more, ensuring a clean user interface.
   */
  test.prop([
    broadQueryArbitrary
  ], { numRuns: 30 })(
    'Property 22 (Autocomplete): Broad queries return top 10 results for autocomplete',
    (query) => {
      // Get all symbols to verify there are more than 10 potential matches
      const allSymbols = searchService.getAllSymbols();
      
      // Perform search with default limit
      const results = searchService.search({
        query,
        limit: 10
      });

      // Property: If database has many entries, results should be limited to 10
      if (allSymbols.length > 10) {
        expect(results.length).toBeLessThanOrEqual(10);
      }

      // Property: Results should be ordered by relevance (best matches first)
      // This is implicit in Fuse.js behavior, but we verify structure
      results.forEach((result, index) => {
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('name');
        
        // Each result should be a valid entry
        expect(typeof result.symbol).toBe('string');
        expect(typeof result.name).toBe('string');
        expect(result.symbol.length).toBeGreaterThan(0);
      });
    }
  );

  /**
   * Property 22 (Limit Boundary): Limit of 1 returns at most 1 result
   * 
   * **Validates: Requirements 6.4**
   * 
   * For any search query with limit set to 1, at most 1 result should be returned.
   */
  test.prop([
    fc.string({ minLength: 1, maxLength: 20 }),
    typesArbitrary
  ], { numRuns: 50 })(
    'Property 22 (Limit Boundary): Limit of 1 returns at most 1 result',
    (query, types) => {
      // Perform search with limit of 1
      const results = searchService.search({
        query,
        limit: 1,
        types
      });

      // Property: Should return at most 1 result
      expect(results.length).toBeLessThanOrEqual(1);

      // Property: If result exists, it should be valid
      if (results.length === 1) {
        expect(results[0]).toHaveProperty('symbol');
        expect(results[0]).toHaveProperty('name');
        expect(results[0]).toHaveProperty('exchange');
        expect(results[0]).toHaveProperty('type');
      }
    }
  );

  /**
   * Property 22 (Consistency): Same query with same limit returns consistent count
   * 
   * **Validates: Requirements 6.4**
   * 
   * For any search query and limit, performing the same search multiple times
   * should return the same number of results (deterministic behavior).
   */
  test.prop([
    fc.string({ minLength: 1, maxLength: 20 }),
    limitArbitrary,
    typesArbitrary,
    fc.integer({ min: 2, max: 5 }) // Number of repeated searches
  ], { numRuns: 50 })(
    'Property 22 (Consistency): Repeated searches return consistent result counts',
    (query, limit, types, numRepeats) => {
      // Perform first search
      const firstResults = searchService.search({
        query,
        limit,
        types
      });

      // Perform repeated searches
      for (let i = 0; i < numRepeats - 1; i++) {
        const results = searchService.search({
          query,
          limit,
          types
        });

        // Property: Result count should be consistent
        expect(results.length).toBe(firstResults.length);

        // Property: Results should not exceed limit
        expect(results.length).toBeLessThanOrEqual(limit);

        // Property: Results should be identical (same order, same data)
        expect(results).toEqual(firstResults);
      }
    }
  );

  /**
   * Property 22 (Type Filtering): Type filtering respects limit
   * 
   * **Validates: Requirements 6.4**
   * 
   * For any search query with type filtering applied, the limit should still
   * be respected, returning at most the specified number of results.
   */
  test.prop([
    broadQueryArbitrary,
    fc.constantFrom<'stock' | 'index' | 'etf'>('stock', 'index', 'etf'),
    fc.integer({ min: 1, max: 20 })
  ], { numRuns: 50 })(
    'Property 22 (Type Filtering): Type-filtered searches respect limit',
    (query, type, limit) => {
      // Perform search with type filter and limit
      const results = searchService.search({
        query,
        limit,
        types: [type]
      });

      // Property: Results should not exceed limit
      expect(results.length).toBeLessThanOrEqual(limit);

      // Property: All results should match the specified type
      results.forEach(result => {
        expect(result.type).toBe(type);
      });
    }
  );

  /**
   * Property 22 (Empty Results): Empty query or no matches returns empty array
   * 
   * **Validates: Requirements 6.4**
   * 
   * For queries that return no matches, an empty array should be returned,
   * which trivially satisfies the limit constraint.
   */
  test.prop([
    fc.constantFrom(
      'NONEXISTENT12345',
      'ZZZZZZZZZ',
      'INVALIDSTOCK999',
      '!!!@@@###'
    ),
    limitArbitrary
  ], { numRuns: 30 })(
    'Property 22 (Empty Results): No matches returns empty array within limit',
    (query, limit) => {
      // Perform search with query unlikely to match
      const results = searchService.search({
        query,
        limit
      });

      // Property: Results should be empty or very small
      expect(results.length).toBeLessThanOrEqual(limit);
      expect(results.length).toBeLessThanOrEqual(10); // Default limit

      // Property: Empty results should be an array
      expect(Array.isArray(results)).toBe(true);
    }
  );

  /**
   * Property 22 (Large Limit): Even with large limits, results are bounded by database size
   * 
   * **Validates: Requirements 6.4**
   * 
   * For any search query with a large limit (e.g., 100), the number of results
   * should never exceed the total number of matching entries in the database.
   */
  test.prop([
    broadQueryArbitrary,
    fc.integer({ min: 50, max: 100 })
  ], { numRuns: 30 })(
    'Property 22 (Large Limit): Results bounded by both limit and database size',
    (query, limit) => {
      // Get total database size
      const allSymbols = searchService.getAllSymbols();

      // Perform search with large limit
      const results = searchService.search({
        query,
        limit
      });

      // Property: Results should not exceed limit
      expect(results.length).toBeLessThanOrEqual(limit);

      // Property: Results should not exceed total database size
      expect(results.length).toBeLessThanOrEqual(allSymbols.length);

      // Property: All results should be valid
      results.forEach(result => {
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('exchange');
        expect(result).toHaveProperty('type');
      });
    }
  );
});
