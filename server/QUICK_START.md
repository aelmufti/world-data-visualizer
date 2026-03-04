# Quick Start Guide - DuckDB Edition

Get your Financial News API running in 3 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn

## Installation

### Option 1: One-Command Setup (Recommended)

```bash
cd server
./setup-duckdb.sh
```

This will:
1. Install all dependencies
2. Create the data directory
3. Set up environment variables
4. Initialize and seed the database
5. Display your API key

### Option 2: Manual Setup

```bash
cd server

# 1. Install dependencies
npm install

# 2. Create data directory
mkdir -p data

# 3. Set up environment
cp .env.example .env

# 4. Initialize database
npm run seed
```

## Running

### Start the API Server

```bash
npm run dev
```

Server will start at `http://localhost:8000`

### Start the RSS Worker (Optional)

In a new terminal:

```bash
cd server
npm run rss-worker
```

This will continuously fetch and process news from 20+ sources.

## Testing

### Test Database Connection

```bash
npm run test-db
```

### Test API

Get your API key from the seed output, then:

```bash
# Replace YOUR_API_KEY with the actual key
export API_KEY="dev_xxxxx"

# Test articles endpoint
curl -H "X-API-Key: $API_KEY" http://localhost:8000/articles

# Test trending
curl -H "X-API-Key: $API_KEY" http://localhost:8000/trending

# Test sector news
curl -H "X-API-Key: $API_KEY" http://localhost:8000/api/aggregated/sector/technology
```

## Common Commands

```bash
# Start development server
npm run dev

# Start RSS worker
npm run rss-worker

# Seed/reset database
npm run seed

# Create new API key
npm run create-api-key

# Test database
npm run test-db

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Articles
```
GET /articles?limit=20&ticker=AAPL
```

### Company Summary
```
GET /companies/AAPL/summary?hours=24
```

### Events
```
GET /events?ticker=AAPL&event_type=earnings_beat
```

### Trending
```
GET /trending?hours=24&limit=20
```

### Aggregated News
```
GET /api/aggregated/sector/technology?limit=20
GET /api/aggregated/all?topPerSector=10
GET /api/aggregated/top?limit=50
```

### Market Data
```
GET /api/market/overview
GET /api/market/sectors
```

## Project Structure

```
server/
├── src/
│   ├── database.ts              # DuckDB setup
│   ├── index.ts                 # Main API
│   ├── aggregator-duckdb.ts     # News aggregation
│   ├── rss-worker-duckdb.ts     # RSS ingestion
│   └── seed-duckdb.ts           # Database seeding
├── data/
│   └── financial_news.duckdb    # Database file
└── package.json
```

## Environment Variables

Edit `.env` if needed:

```env
PORT=8000
DB_PATH=./data/financial_news.duckdb
AIS_STREAM_API_KEY=your_key_here
```

## Troubleshooting

### "Database locked" error
Only run one instance of the server/worker at a time.

### "No such table" error
Run `npm run seed` to create tables.

### No articles showing
Start the RSS worker: `npm run rss-worker`

### API key invalid
Check the output from `npm run seed` for the generated key.

## Next Steps

1. ✅ Server running
2. ✅ Database seeded
3. ✅ API key obtained
4. 🔄 Start RSS worker to ingest news
5. 📊 Query the API endpoints
6. 🚀 Build your application!

## Documentation

- Full API docs: `README_DUCKDB.md`
- Migration guide: `MIGRATION_TO_DUCKDB.md`
- Database schema: See `src/database.ts`

## Support

For issues:
1. Check `npm run test-db`
2. Review logs in console
3. Verify `.env` configuration
4. Check database file exists: `ls -lh data/`

---

**Ready to go!** 🚀

Start the server with `npm run dev` and begin querying financial news data.
