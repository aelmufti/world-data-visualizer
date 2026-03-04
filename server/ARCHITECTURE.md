# Architecture - DuckDB Edition

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Financial News API                       │
│                      (DuckDB Edition)                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   RSS Feeds  │────▶│  RSS Worker  │────▶│   DuckDB     │
│  (20+ sources)│     │              │     │   Database   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                                   │
┌──────────────┐     ┌──────────────┐            │
│   Client     │────▶│  API Server  │────────────┘
│ Application  │◀────│  (Express)   │
└──────────────┘     └──────────────┘
```

## Components

### 1. RSS Worker (`rss-worker-duckdb.ts`)

**Purpose**: Continuously fetch and process news articles

**Flow**:
```
RSS Sources → Fetch Articles → Parse XML → Extract Data
     ↓
NLP Processing → Company Detection → Sentiment Analysis
     ↓
Event Detection → Store in DuckDB
```

**Sources** (20+):
- Financial: Reuters, Yahoo Finance, MarketWatch, CNBC, Bloomberg
- Tech: TechCrunch, VentureBeat, The Verge, Ars Technica
- Healthcare: BioPharma Dive, FiercePharma
- Energy: Oil Price, Renewable Energy World
- General: WSJ, Financial Times, Barrons, Forbes, Business Insider

**Processing**:
1. Fetch RSS feed (XML)
2. Parse articles
3. Detect company mentions
4. Analyze sentiment
5. Detect events
6. Store in database

### 2. API Server (`index.ts`)

**Purpose**: Serve financial news data via REST API

**Endpoints**:
```
GET /articles                    → List articles with filters
GET /companies/:ticker/summary   → Company summary
GET /events                      → List detected events
GET /trending                    → Trending companies
GET /api/aggregated/sector/:s    → Sector-specific news
GET /api/aggregated/all          → All sectors
GET /api/aggregated/top          → Top articles globally
GET /api/market/overview         → Market overview
GET /api/market/sectors          → Sector performance
```

**Features**:
- API key authentication
- Rate limiting
- CORS support
- WebSocket for AIS data

### 3. News Aggregator (`aggregator-duckdb.ts`)

**Purpose**: Intelligent news scoring and aggregation

**Scoring Algorithm**:
```
Relevance Score (0-10)
  = Position-weighted keyword matching
  = Title matches × 2.0
  + Lead matches × 1.5
  + Body matches × 1.0
  → Logarithmic curve

Importance Score (0-10)
  = Based on detected events
  = earnings_beat: 8
  = merger_acquisition: 10
  = regulatory_action: 9
  = etc.

Final Score
  = (Relevance × 0.6) + (Importance × 0.3) + (Sentiment × 0.1)
  × Recency Decay Factor
```

**Sectors**:
- Technology
- Finance
- Healthcare
- Energy
- Consumer
- Industrial
- Materials
- Real Estate
- Utilities
- Telecom

### 4. DuckDB Database (`database.ts`)

**Purpose**: Local SQL database for all data

**Schema**:
```sql
companies
  ├── id (PK)
  ├── ticker (UNIQUE)
  ├── name
  ├── sector
  └── created_at

articles
  ├── id (PK)
  ├── title
  ├── url (UNIQUE)
  ├── body
  ├── published_at (INDEXED)
  ├── ingested_at
  ├── source_domain
  ├── raw_sentiment (INDEXED)
  └── created_at

article_mentions
  ├── id (PK)
  ├── article_id (FK, INDEXED)
  ├── company_id (FK, INDEXED)
  ├── ticker (INDEXED)
  ├── mention_count
  ├── entity_sentiment
  ├── is_primary_subject
  ├── event_tags
  └── created_at

events
  ├── id (PK)
  ├── company_id (FK, INDEXED)
  ├── ticker (INDEXED)
  ├── event_type
  ├── confidence
  ├── detected_at (INDEXED)
  ├── article_url
  ├── article_id (FK)
  └── created_at

api_keys
  ├── id (PK)
  ├── key (UNIQUE, INDEXED)
  ├── name
  ├── is_active
  ├── rate_limit
  └── created_at
```

### 5. NLP Processor (`nlp.ts`)

**Purpose**: Natural language processing for articles

**Capabilities**:
- Company name detection
- Ticker symbol extraction
- Sentiment analysis
- Event detection
- Entity recognition

**Event Types**:
- earnings_beat / earnings_miss
- merger_acquisition
- government_contract
- partnership
- executive_change
- layoffs
- product_launch
- regulatory_action
- share_buyback
- dividend_change
- analyst_upgrade / downgrade
- insider_trading
- sec_filing
- lawsuit

## Data Flow

### Article Ingestion

```
1. RSS Worker fetches article
   ↓
2. Parse XML → Extract metadata
   ↓
3. NLP Processing
   ├── Detect companies
   ├── Analyze sentiment
   └── Detect events
   ↓
4. Store in DuckDB
   ├── Insert article
   ├── Insert mentions
   └── Insert events
```

### API Request

```
1. Client sends request with API key
   ↓
2. Verify API key
   ↓
3. Check rate limit
   ↓
4. Query DuckDB
   ↓
5. Aggregate/score results
   ↓
6. Return JSON response
```

### News Aggregation

```
1. Fetch recent articles (24h)
   ↓
2. For each article:
   ├── Calculate relevance score
   ├── Calculate importance score
   └── Apply recency decay
   ↓
3. Sort by final score
   ↓
4. Return top N articles
```

## Performance Characteristics

### DuckDB
- **Read Speed**: Microseconds for indexed queries
- **Write Speed**: Thousands of inserts/second
- **Aggregations**: Optimized for analytics
- **Storage**: Compressed columnar format

### API Server
- **Latency**: <10ms for most queries
- **Throughput**: Thousands of requests/second
- **Caching**: Node-cache for rate limiting
- **Concurrency**: Node.js event loop

### RSS Worker
- **Fetch Rate**: 1 source per second (polite)
- **Processing**: Async/parallel
- **Error Handling**: Graceful degradation
- **Retry Logic**: Automatic on failure

## Scalability

### Current Capacity
- Articles: Millions
- Companies: Thousands
- Events: Millions
- API Keys: Unlimited

### Optimization Strategies
1. **Indexes**: On frequently queried columns
2. **Partitioning**: By date for time-series
3. **Caching**: In-memory for hot data
4. **Batch Processing**: Bulk inserts
5. **Query Optimization**: Efficient SQL

### Bottlenecks
- **RSS Fetching**: Network I/O (rate limited)
- **NLP Processing**: CPU-bound (parallelizable)
- **Database Writes**: Single writer (DuckDB limitation)

## Security

### API Authentication
- API key in `X-API-Key` header
- Keys stored in database
- Active/inactive status
- Rate limiting per key

### Data Protection
- Local storage only
- No external transmission
- File system permissions
- Backup encryption (optional)

### Input Validation
- URL validation
- SQL injection prevention
- XSS protection
- Rate limiting

## Monitoring

### Metrics to Track
- Articles ingested per hour
- API request rate
- Database size
- Query latency
- Error rate
- RSS source availability

### Logging
- Article processing
- API requests
- Database operations
- Errors and warnings

## Deployment

### Development
```bash
npm run dev          # API server
npm run rss-worker   # RSS ingestion
```

### Production
```bash
npm run build        # Compile TypeScript
npm start            # Start server
```

### Process Management
- Use PM2 or systemd
- Separate processes for API and worker
- Auto-restart on failure
- Log rotation

## Backup Strategy

### Database Backup
```bash
# Daily backup
cp data/financial_news.duckdb data/backup_$(date +%Y%m%d).duckdb

# Weekly archive
tar -czf backup_$(date +%Y%m%d).tar.gz data/
```

### Restore
```bash
cp data/backup_20240101.duckdb data/financial_news.duckdb
```

## Future Enhancements

### Potential Improvements
1. **Real-time Updates**: WebSocket for live news
2. **Machine Learning**: Better event detection
3. **Multi-language**: Support non-English news
4. **Historical Analysis**: Trend detection
5. **Alert System**: Notify on important events
6. **API Rate Plans**: Tiered access levels
7. **Data Export**: CSV, JSON, Parquet
8. **Advanced Search**: Full-text search
9. **Visualization**: Charts and graphs
10. **Mobile App**: Native clients

---

## Architecture Benefits

✅ **Simple**: Few components, clear responsibilities
✅ **Fast**: Local database, no network latency
✅ **Reliable**: No external dependencies
✅ **Scalable**: Handles millions of records
✅ **Maintainable**: Standard SQL, clear code
✅ **Cost-effective**: Zero cloud costs
✅ **Flexible**: Easy to extend and modify

---

This architecture provides a solid foundation for a production-ready financial news API with excellent performance and reliability.
