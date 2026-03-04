# Migration from Firebase to DuckDB

This guide explains the migration from Firebase to DuckDB for local data storage.

## What Changed

### Database Layer
- Replaced Firebase Firestore with DuckDB (local SQL database)
- All data is now stored in a single `.duckdb` file
- No more cloud dependencies or emulator setup needed

### File Changes
- `src/database.ts` - New DuckDB connection and schema
- `src/aggregator-duckdb.ts` - Updated aggregator for DuckDB
- `src/worker-duckdb.ts` - Updated worker for DuckDB
- `src/rss-worker-duckdb.ts` - Updated RSS worker for DuckDB
- `src/seed-duckdb.ts` - New seed script for initial data
- `src/index.ts` - Updated to use DuckDB

### Removed Dependencies
- `firebase-admin` - No longer needed

### New Dependencies
- `duckdb-async` - DuckDB Node.js driver

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Update your `server/.env` file:

```env
# Database path (optional, defaults to ./data/financial_news.duckdb)
DB_PATH=./data/financial_news.duckdb

# Server port
PORT=8000

# AIS Stream API (if using vessel tracking)
AIS_STREAM_API_KEY=your_ais_key_here
```

### 3. Initialize Database

Run the seed script to create tables and add sample data:

```bash
npm run seed
```

This will:
- Create all necessary tables (companies, articles, mentions, events, api_keys)
- Add sample companies (AAPL, MSFT, GOOGL, etc.)
- Generate a development API key

### 4. Start the Server

```bash
npm run dev
```

### 5. Start Workers (Optional)

To ingest news articles from RSS feeds:

```bash
npm run rss-worker
```

## Database Schema

### Tables

**companies**
- id (VARCHAR, PRIMARY KEY)
- ticker (VARCHAR, UNIQUE)
- name (VARCHAR)
- sector (VARCHAR)
- created_at (TIMESTAMP)

**articles**
- id (VARCHAR, PRIMARY KEY)
- title (VARCHAR)
- url (VARCHAR, UNIQUE)
- body (TEXT)
- published_at (TIMESTAMP)
- ingested_at (TIMESTAMP)
- source_domain (VARCHAR)
- raw_sentiment (DOUBLE)
- created_at (TIMESTAMP)

**article_mentions**
- id (VARCHAR, PRIMARY KEY)
- article_id (VARCHAR, FK)
- company_id (VARCHAR, FK)
- ticker (VARCHAR)
- mention_count (INTEGER)
- entity_sentiment (DOUBLE)
- is_primary_subject (BOOLEAN)
- event_tags (VARCHAR[])
- created_at (TIMESTAMP)

**events**
- id (VARCHAR, PRIMARY KEY)
- company_id (VARCHAR, FK)
- ticker (VARCHAR)
- event_type (VARCHAR)
- confidence (DOUBLE)
- detected_at (TIMESTAMP)
- article_url (VARCHAR)
- article_id (VARCHAR, FK)
- created_at (TIMESTAMP)

**api_keys**
- id (VARCHAR, PRIMARY KEY)
- key (VARCHAR, UNIQUE)
- name (VARCHAR)
- is_active (BOOLEAN)
- rate_limit (INTEGER)
- created_at (TIMESTAMP)

## API Endpoints

All existing API endpoints remain the same:

- `GET /articles` - List articles with filters
- `GET /companies/:ticker/summary` - Company summary
- `GET /events` - List events
- `GET /trending` - Trending companies
- `GET /api/aggregated/sector/:sector` - Sector-specific news
- `GET /api/aggregated/all` - All sectors
- `GET /api/aggregated/top` - Top articles globally

## Benefits of DuckDB

1. **Local-first**: No cloud dependencies, works offline
2. **Fast**: Optimized for analytical queries
3. **Simple**: Single file database, easy to backup
4. **SQL**: Standard SQL queries, easy to understand
5. **Embedded**: No separate database server needed
6. **Free**: No usage costs or quotas

## Data Location

By default, the database is stored at:
```
server/data/financial_news.duckdb
```

You can change this by setting the `DB_PATH` environment variable.

## Backup

To backup your data, simply copy the `.duckdb` file:

```bash
cp data/financial_news.duckdb data/backup_$(date +%Y%m%d).duckdb
```

## Troubleshooting

### Database locked error
If you get a "database is locked" error, make sure only one process is accessing the database at a time.

### Missing tables
Run `npm run seed` to recreate the database schema.

### Performance issues
DuckDB is optimized for analytical queries. For very large datasets (millions of rows), consider adding more indexes or using DuckDB's partitioning features.
