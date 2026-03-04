# Financial News API - DuckDB Edition

A local-first financial news aggregation API powered by DuckDB.

## Features

- 📰 Multi-source RSS news aggregation (20+ financial news sources)
- 🏢 Company mention detection and tracking
- 📊 Sentiment analysis on articles and companies
- 🎯 Event detection (earnings, M&A, partnerships, etc.)
- 🔍 Sector-based news aggregation with intelligent scoring
- 🚢 AIS vessel tracking integration
- 💾 Local DuckDB storage (no cloud dependencies)

## Quick Start

### Option 1: Automated Setup

```bash
cd server
./setup-duckdb.sh
```

### Option 2: Manual Setup

```bash
cd server

# Install dependencies
npm install

# Create data directory
mkdir -p data

# Copy environment file
cp .env.example .env

# Seed database
npm run seed

# Start server
npm run dev
```

## Running the Application

### Start the API Server

```bash
npm run dev
```

The API will be available at `http://localhost:8000`

### Start the RSS Worker (Optional)

To continuously ingest news from RSS feeds:

```bash
npm run rss-worker
```

This will:
- Fetch articles from 20+ financial news sources
- Process and analyze each article
- Detect company mentions and events
- Store everything in DuckDB

## API Endpoints

### Articles

```bash
# Get all articles
GET /articles?limit=20

# Filter by ticker
GET /articles?ticker=AAPL,MSFT

# Filter by date range
GET /articles?from_date=2024-01-01&to_date=2024-12-31

# Filter by sentiment
GET /articles?sentiment_min=0.5&sentiment_max=1.0
```

### Company Summary

```bash
# Get company summary
GET /companies/AAPL/summary?hours=24
```

### Events

```bash
# Get all events
GET /events?limit=50

# Filter by ticker
GET /events?ticker=AAPL

# Filter by event type
GET /events?event_type=earnings_beat

# Filter by confidence
GET /events?confidence_min=0.7
```

### Trending

```bash
# Get trending companies
GET /trending?hours=24&limit=20
```

### Aggregated News

```bash
# Get sector-specific news
GET /api/aggregated/sector/technology?limit=20

# Get all sectors
GET /api/aggregated/all?topPerSector=10

# Get top articles globally
GET /api/aggregated/top?limit=50
```

### Market Data

```bash
# Get market overview
GET /api/market/overview

# Get sector performance
GET /api/market/sectors
```

## Authentication

All endpoints require an API key in the header:

```bash
curl -H "X-API-Key: your_api_key_here" http://localhost:8000/articles
```

The seed script creates a development API key. Check the console output after running `npm run seed`.

## Database

### Location

By default, the database is stored at:
```
server/data/financial_news.duckdb
```

### Schema

- **companies**: Company information (ticker, name, sector)
- **articles**: News articles with sentiment scores
- **article_mentions**: Company mentions in articles
- **events**: Detected events (earnings, M&A, etc.)
- **api_keys**: API authentication keys

### Backup

```bash
# Backup database
cp data/financial_news.duckdb data/backup_$(date +%Y%m%d).duckdb

# Restore from backup
cp data/backup_20240101.duckdb data/financial_news.duckdb
```

## Supported Sectors

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

## RSS News Sources

The RSS worker monitors 20+ sources including:
- Reuters, Yahoo Finance, MarketWatch
- CNBC, Bloomberg, Financial Times
- Wall Street Journal, Barrons
- TechCrunch, VentureBeat
- And more...

## Development

### Project Structure

```
server/
├── src/
│   ├── database.ts              # DuckDB connection and schema
│   ├── index.ts                 # Main API server
│   ├── aggregator-duckdb.ts     # News aggregation logic
│   ├── aggregation-endpoint.ts  # Aggregation API routes
│   ├── market-data-endpoint.ts  # Market data API routes
│   ├── rss-worker-duckdb.ts     # RSS feed ingestion
│   ├── nlp.ts                   # NLP processing
│   ├── ais-proxy.ts             # AIS vessel tracking
│   └── seed-duckdb.ts           # Database seeding
├── data/                        # Database files
└── package.json
```

### Adding Companies

Edit `src/seed-duckdb.ts` and add companies to the array:

```typescript
const companies = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'technology' },
  // Add more...
];
```

Then run:
```bash
npm run seed
```

### Adding RSS Sources

Edit `src/rss-worker-duckdb.ts` and add to the `RSS_SOURCES` array:

```typescript
const RSS_SOURCES = [
  { name: 'Source Name', url: 'https://...', domain: 'example.com' },
  // Add more...
];
```

## Environment Variables

```env
# Server
PORT=8000
NODE_ENV=development

# Database
DB_PATH=./data/financial_news.duckdb

# AIS Stream (for vessel tracking)
AIS_STREAM_API_KEY=your_key_here

# Custom news source (optional)
NEWS_SOURCE_API_URL=
NEWS_SOURCE_API_KEY=
```

## Troubleshooting

### Database locked
Only one process can write to DuckDB at a time. Make sure you're not running multiple workers or servers.

### Missing tables
Run `npm run seed` to recreate the database schema.

### No articles
Start the RSS worker with `npm run rss-worker` to begin ingesting articles.

### API key invalid
Check the console output from `npm run seed` for the generated API key.

## Performance

DuckDB is optimized for analytical queries and can handle:
- Millions of articles
- Complex aggregations
- Fast full-text search
- Efficient time-series queries

For best performance:
- Use date range filters
- Limit result sets
- Create indexes on frequently queried columns

## License

MIT
