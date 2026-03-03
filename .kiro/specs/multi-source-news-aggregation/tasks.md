# Implementation Plan: Multi-Source News Aggregation

## Overview

Ce plan d'implémentation transforme le système actuel d'agrégation d'actualités (cascade séquentielle) en un système parallèle multi-sources avec scoring de pertinence, déduplication intelligente et cache. L'implémentation suit une approche incrémentale où chaque tâche construit sur les précédentes, avec des checkpoints pour valider la progression.

## Tasks

- [x] 1. Setup project structure and core types
  - Create `server/aggregator/` directory structure
  - Define TypeScript interfaces in `server/aggregator/types.ts`
  - Setup configuration types and default values
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2. Implement KeywordManager with enriched sector keywords
  - [x] 2.1 Create KeywordManager class with sector keyword mappings
    - Implement 4 categories per sector (primary, secondary, geopolitical, contextual)
    - Add all 6 sectors: Énergie, Technologie, Santé, Télécoms, Industrie, Services Publics
    - Implement getKeywords() method to flatten all categories
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 2.2 Write property test for KeywordManager
    - **Property 5: Sector Keywords Completeness**
    - **Validates: Requirements 2.1, 2.8**

- [ ] 3. Implement news source adapters
  - [x] 3.1 Create NewsSourceAdapter interface
    - Define Article interface with id, title, snippet, date, source, url
    - Define SourceStatus interface for health tracking
    - Define fetchArticles() method signature
    - _Requirements: 1.2, 1.5_
  
  - [x] 3.2 Implement NewsApiAdapter
    - Fetch from NewsAPI v2/everything endpoint
    - Parse response and normalize to Article format
    - Handle API key validation and errors
    - _Requirements: 1.2, 1.5, 7.2_
  
  - [x] 3.3 Implement BingNewsAdapter
    - Fetch from Bing News RSS feed
    - Parse RSS XML with regex extraction
    - Normalize to Article format
    - _Requirements: 1.2, 1.5_
  
  - [x] 3.4 Implement GoogleNewsAdapter
    - Fetch from Google News RSS feed
    - Parse RSS XML with CDATA extraction
    - Normalize to Article format
    - _Requirements: 1.2, 1.5_
  
  - [x] 3.5 Write unit tests for adapters
    - Test each adapter with mock responses
    - Test error handling and malformed data
    - Test article normalization
    - _Requirements: 1.2, 1.5_

- [ ] 4. Implement RelevanceScorer
  - [x] 4.1 Create RelevanceScorer class with scoring algorithm
    - Implement calculateScore() with weighted components
    - Implement keyword matching in title and snippet
    - Implement recency scoring (1.0 < 24h, 0.8 < 3d, 0.6 < 7d, 0.4 else)
    - Implement keyword bonus for multiple matches
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 4.2 Write property test for relevance score bounds
    - **Property 6: Relevance Score Calculation**
    - **Validates: Requirements 3.1, 3.2**
  
  - [x] 4.3 Write property test for scoring monotonicity
    - **Property 7: Scoring Monotonicity with Keyword Frequency**
    - **Validates: Requirements 3.3, 3.6**
  
  - [x] 4.4 Write property test for title weight dominance
    - **Property 8: Title Weight Dominance**
    - **Validates: Requirements 3.4**
  
  - [x] 4.5 Write property test for recency monotonicity
    - **Property 9: Recency Score Monotonicity**
    - **Validates: Requirements 3.5**

- [ ] 5. Implement Deduplicator
  - [x] 5.1 Create Deduplicator class with Jaccard similarity
    - Implement deduplicate() method
    - Implement jaccardSimilarity() calculation
    - Implement tokenization (lowercase, remove punctuation, filter short words)
    - Keep highest scoring article when duplicates detected
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Write property test for deduplication execution
    - **Property 10: Deduplication Execution**
    - **Validates: Requirements 4.1, 4.2**
  
  - [x] 5.3 Write property test for duplicate resolution
    - **Property 11: Duplicate Resolution by Score**
    - **Validates: Requirements 4.3, 4.4**
  
  - [x] 5.4 Write property test for deduplication performance
    - **Property 12: Deduplication Performance**
    - **Validates: Requirements 4.5**

- [ ] 6. Implement CacheManager
  - [x] 6.1 Create CacheManager class with TTL support
    - Implement in-memory cache with Map
    - Implement get(), set(), has(), isExpired() methods
    - Implement LRU eviction when maxSize reached
    - Generate cache keys: `news:${sector}:${timestamp_rounded_to_15min}`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 6.2 Write property test for cache hit behavior
    - **Property 20: Cache Hit Behavior**
    - **Validates: Requirements 8.3**
  
  - [x] 6.3 Write property test for cache refresh
    - **Property 21: Cache Refresh on Expiration**
    - **Validates: Requirements 8.4**
  
  - [x] 6.4 Write unit tests for cache edge cases
    - Test cache expiration at exact TTL boundary
    - Test LRU eviction when maxSize exceeded
    - Test cache key generation consistency
    - _Requirements: 8.1, 8.2_

- [x] 7. Checkpoint - Core components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement NewsAggregator core orchestration
  - [x] 8.1 Create NewsAggregator class with parallel fetch
    - Implement aggregateNews() main method
    - Implement fetchFromAllSources() with Promise.allSettled
    - Implement fetchWithTimeout() for 3-second timeout per source
    - Integrate cache check at start of aggregateNews()
    - _Requirements: 1.1, 1.3, 1.4, 8.3, 8.4_
  
  - [x] 8.2 Implement error handling and resilience
    - Handle source failures gracefully (continue with remaining)
    - Track consecutive failures per source (circuit breaker at 3 failures)
    - Return empty result with error when all sources fail
    - Log source failures with details
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 8.3 Implement filtering and sorting logic
    - Filter articles by relevance score (> 0.3, fallback to > 0.2 if < 5 articles)
    - Sort by relevance score descending
    - Limit to maximum 20 articles
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 8.4 Write property test for parallel fetch execution
    - **Property 1: Parallel Fetch Execution**
    - **Validates: Requirements 1.1**
  
  - [x] 8.5 Write property test for resilience to failures
    - **Property 2: Resilience to Source Failures**
    - **Validates: Requirements 1.3, 6.1, 6.2**
  
  - [x] 8.6 Write property test for aggregation timeout
    - **Property 3: Aggregation Timeout Compliance**
    - **Validates: Requirements 1.4**
  
  - [x] 8.7 Write property test for result sorting
    - **Property 13: Result Sorting by Relevance**
    - **Validates: Requirements 5.1**
  
  - [x] 8.8 Write property test for relevance filtering
    - **Property 14: Relevance Score Filtering**
    - **Validates: Requirements 5.2**
  
  - [x] 8.9 Write property test for maximum articles limit
    - **Property 15: Maximum Articles Limit**
    - **Validates: Requirements 5.3**

- [x] 9. Implement response formatting and metadata
  - [x] 9.1 Implement formatArticle() with French date formatting
    - Format dates: "Il y a Xh", "Il y a X jours", "Hier", "DD/MM"
    - Round relevance scores to 2 decimals
    - _Requirements: 10.4_
  
  - [x] 9.2 Build AggregationResult with complete metadata
    - Include timestamp, totalArticles, sourcesUsed, cacheStatus
    - Include aggregationTime on cache miss
    - Include error field when applicable
    - _Requirements: 5.5, 10.2, 10.3, 10.5_
  
  - [x] 9.3 Write property test for response structure
    - **Property 16: Response Structure Completeness**
    - **Validates: Requirements 5.5, 10.2, 10.3**
  
  - [x] 9.4 Write property test for cache status in response
    - **Property 22: Cache Status in Response**
    - **Validates: Requirements 8.5**
  
  - [x] 9.5 Write property test for French date formatting
    - **Property 25: French Date Formatting**
    - **Validates: Requirements 10.4**
  
  - [x] 9.6 Write property test for error response structure
    - **Property 26: Error Response Structure**
    - **Validates: Requirements 10.5**

- [x] 10. Implement logging and metrics
  - [x] 10.1 Create MetricsLogger class
    - Implement logAggregation() with all required metrics
    - Implement logSourceFailure() with error details
    - Implement logCacheHit() and logCacheMiss()
    - Log: articles per source, aggregation time, deduplication count, average score
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 10.2 Write property test for metrics logging
    - **Property 23: Metrics Logging Completeness**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 11. Implement configuration management
  - [x] 11.1 Create ConfigLoader to read from environment variables
    - Load all source configurations (enabled, apiKey, timeout, maxArticles)
    - Load cache, scoring, deduplication, filtering configs
    - Provide default values for all settings
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 11.2 Implement source configuration validation
    - Validate API keys for sources requiring them
    - Log active sources at startup
    - Skip disabled sources during aggregation
    - _Requirements: 7.2, 7.4, 7.5_
  
  - [x] 11.3 Write property test for disabled source exclusion
    - **Property 18: Disabled Source Exclusion**
    - **Validates: Requirements 7.4**
  
  - [x] 11.4 Write property test for API key validation
    - **Property 19: API Key Validation**
    - **Validates: Requirements 7.2**

- [x] 12. Checkpoint - NewsAggregator complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integrate with Express router
  - [x] 13.1 Create new endpoint GET /api/news/:sector
    - Instantiate NewsAggregator with loaded configuration
    - Call aggregateNews(sector) and return JSON response
    - Handle errors with 500 status and error response
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 13.2 Add sector parameter validation
    - Whitelist valid sectors (Énergie, Technologie, Santé, Télécoms, Industrie, Services Publics)
    - Return 400 error for invalid sectors
    - _Requirements: 5.1_
  
  - [x] 13.3 Write property test for JSON response format
    - **Property 24: JSON Response Format**
    - **Validates: Requirements 10.1**
  
  - [x] 13.4 Write integration tests for Express endpoint
    - Test successful aggregation flow
    - Test cache hit scenario
    - Test partial source failure
    - Test all sources failure
    - Test invalid sector parameter
    - _Requirements: 1.1, 6.1, 6.3, 8.3_

- [x] 14. Add remaining property tests
  - [x] 14.1 Write property test for minimum articles per source
    - **Property 4: Minimum Articles Per Source**
    - **Validates: Requirements 1.5**
  
  - [x] 14.2 Write property test for source availability metadata
    - **Property 17: Source Availability in Metadata**
    - **Validates: Requirements 6.4**

- [x] 15. Update environment configuration
  - [x] 15.1 Add new environment variables to .env.example
    - Add NEWSAPI_ENABLED, NEWSAPI_TIMEOUT, NEWSAPI_MAX_ARTICLES
    - Add BING_ENABLED, BING_TIMEOUT, BING_MAX_ARTICLES
    - Add GOOGLE_ENABLED, GOOGLE_TIMEOUT, GOOGLE_MAX_ARTICLES
    - Add CACHE_ENABLED, CACHE_TTL, CACHE_MAX_SIZE
    - Add scoring, deduplication, filtering configuration variables
    - _Requirements: 7.1, 7.3_
  
  - [x] 15.2 Document configuration options in README
    - Document all environment variables with descriptions
    - Provide example values and defaults
    - Explain configuration impact on behavior
    - _Requirements: 7.1, 7.3_

- [x] 16. Final checkpoint and integration validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (26 total properties)
- Unit tests validate specific examples and edge cases
- Implementation uses TypeScript for type safety
- All 6 sectors supported: Énergie, Technologie, Santé, Télécoms, Industrie, Services Publics
- Parallel fetch with Promise.allSettled ensures resilience
- Cache TTL: 15 minutes, timeout per source: 3 seconds
- Deduplication uses Jaccard similarity with 70% threshold
- Minimum relevance score: 0.3 (fallback to 0.2 if < 5 articles)
- Maximum 20 articles returned per sector
