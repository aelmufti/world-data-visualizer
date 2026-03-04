# Setup Checklist - DuckDB Edition

Use this checklist to ensure your Financial News API is properly set up.

## Pre-Installation

- [ ] Node.js 18+ installed
- [ ] npm or yarn available
- [ ] Terminal/command line access

## Installation Steps

### Automated Setup (Recommended)

- [ ] Navigate to server directory: `cd server`
- [ ] Run setup script: `./setup-duckdb.sh`
- [ ] Verify no errors in output
- [ ] Note the API key displayed

### Manual Setup (Alternative)

- [ ] Navigate to server directory: `cd server`
- [ ] Install dependencies: `npm install`
- [ ] Create data directory: `mkdir -p data`
- [ ] Copy environment file: `cp .env.example .env`
- [ ] Seed database: `npm run seed`
- [ ] Note the API key displayed

## Verification

- [ ] Test database connection: `npm run test-db`
- [ ] Check database file exists: `ls -lh data/financial_news.duckdb`
- [ ] Verify companies seeded (should show 15 companies)
- [ ] Verify API key created

## Configuration

- [ ] Review `.env` file
- [ ] Set `PORT` if needed (default: 8000)
- [ ] Set `DB_PATH` if needed (default: ./data/financial_news.duckdb)
- [ ] Add `AIS_STREAM_API_KEY` if using vessel tracking

## Running the Server

- [ ] Start server: `npm run dev`
- [ ] Server starts without errors
- [ ] Server listening on configured port
- [ ] No database connection errors

## Testing API

- [ ] Get API key from seed output
- [ ] Test root endpoint: `curl http://localhost:8000/`
- [ ] Test articles endpoint with API key:
  ```bash
  curl -H "X-API-Key: YOUR_KEY" http://localhost:8000/articles
  ```
- [ ] Test trending endpoint:
  ```bash
  curl -H "X-API-Key: YOUR_KEY" http://localhost:8000/trending
  ```
- [ ] Test sector aggregation:
  ```bash
  curl -H "X-API-Key: YOUR_KEY" http://localhost:8000/api/aggregated/sector/technology
  ```

## RSS Worker (Optional)

- [ ] Open new terminal
- [ ] Navigate to server: `cd server`
- [ ] Start RSS worker: `npm run rss-worker`
- [ ] Worker starts fetching feeds
- [ ] Articles being processed
- [ ] No errors in output

## Verification Checklist

### Database
- [ ] Database file created in `data/` directory
- [ ] Tables created (companies, articles, mentions, events, api_keys)
- [ ] Sample companies inserted (15 companies)
- [ ] API key generated
- [ ] Indexes created

### Server
- [ ] Server starts successfully
- [ ] No port conflicts
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] CORS configured

### API Endpoints
- [ ] `GET /` - Returns version info
- [ ] `GET /articles` - Returns articles (may be empty initially)
- [ ] `GET /companies/:ticker/summary` - Returns company data
- [ ] `GET /events` - Returns events (may be empty initially)
- [ ] `GET /trending` - Returns trending data
- [ ] `GET /api/aggregated/sector/:sector` - Returns sector news
- [ ] `GET /api/aggregated/all` - Returns all sectors
- [ ] `GET /api/aggregated/top` - Returns top articles
- [ ] `GET /api/market/overview` - Returns market data
- [ ] `GET /api/market/sectors` - Returns sector performance

### RSS Worker (if running)
- [ ] Fetching from 20+ sources
- [ ] Processing articles
- [ ] Detecting companies
- [ ] Storing in database
- [ ] No errors or timeouts

## Common Issues

### Database locked
- [ ] Only one server/worker instance running
- [ ] No other processes accessing database

### Port already in use
- [ ] Change PORT in `.env`
- [ ] Or stop other service on port 8000

### API key invalid
- [ ] Using correct key from seed output
- [ ] Key in `X-API-Key` header
- [ ] Key is active in database

### No articles
- [ ] RSS worker running
- [ ] Wait a few minutes for ingestion
- [ ] Check worker logs for errors

### Missing tables
- [ ] Run `npm run seed` again
- [ ] Check for errors in seed output

## Production Checklist

- [ ] Build application: `npm run build`
- [ ] Test production build: `npm start`
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Configure proper API keys
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS if needed
- [ ] Document deployment process

## Backup Checklist

- [ ] Database backup script created
- [ ] Backup location configured
- [ ] Backup schedule set up
- [ ] Restore process tested
- [ ] Backup retention policy defined

## Monitoring Checklist

- [ ] Server health check endpoint
- [ ] Database size monitoring
- [ ] API response time tracking
- [ ] Error rate monitoring
- [ ] RSS worker status check

## Documentation Review

- [ ] Read `QUICK_START.md`
- [ ] Review `README_DUCKDB.md`
- [ ] Understand `MIGRATION_TO_DUCKDB.md`
- [ ] Check API endpoint documentation
- [ ] Review database schema

## Final Verification

- [ ] All tests passing
- [ ] No errors in logs
- [ ] API responding correctly
- [ ] Database populated (if RSS worker running)
- [ ] Performance acceptable
- [ ] Ready for development/production

## Success Criteria

✅ Server running on configured port
✅ Database initialized and accessible
✅ API endpoints responding
✅ Authentication working
✅ RSS worker ingesting articles (if enabled)
✅ No errors in logs
✅ Documentation reviewed

---

## Need Help?

If any checklist item fails:

1. Check the error message
2. Review relevant documentation
3. Run `npm run test-db` to verify database
4. Check `.env` configuration
5. Verify Node.js version (18+)
6. Review logs for specific errors

## Quick Commands Reference

```bash
# Setup
./setup-duckdb.sh

# Start server
npm run dev

# Start RSS worker
npm run rss-worker

# Test database
npm run test-db

# Create API key
npm run create-api-key

# Seed database
npm run seed

# Build for production
npm run build

# Start production
npm start
```

---

**Setup Complete!** ✅

Your Financial News API is ready to use.
