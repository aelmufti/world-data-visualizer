# Congress Tracker Architecture - Dynamic Politicians

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Congress.gov API                             │
│  https://api.congress.gov/v3/member?chamber=house&congress=119   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Fetch every 24h
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              CongressApiService                                  │
│  - fetchHouseMembers() → 435+ members                           │
│  - fetchSenateMembers() → 100 members                           │
│  - syncPoliticiansToDatabase()                                  │
│  - shouldRefresh() → checks if >24h old                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Store/Update
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DuckDB Database                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ politicians table                                         │  │
│  │ - bioguide_id (PK)                                       │  │
│  │ - last_name, full_name                                   │  │
│  │ - party, state, chamber                                  │  │
│  │ - is_active (boolean)                                    │  │
│  │ - last_updated (timestamp)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ filings table                                            │  │
│  │ - filing_id, politician, pdf_url, year                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ trades table                                             │  │
│  │ - id, ticker, action, transaction_date, amount           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ alerts table                                             │  │
│  │ - id, trade_id, detected_at, read                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Query: SELECT * FROM politicians
                             │        WHERE is_active = true
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CongressPipeline                               │
│                                                                  │
│  initialize():                                                   │
│    1. Check if CONGRESS_API_KEY exists                          │
│    2. Create CongressApiService                                 │
│    3. Check if data >24h old → refresh if needed                │
│                                                                  │
│  runPoll():                                                      │
│    1. Check if 24h elapsed → refresh if needed                  │
│    2. Get active politicians from database                      │
│    3. For each politician:                                      │
│       - Scrape House/Senate disclosure sites                    │
│       - Download PDFs                                           │
│       - Parse trades                                            │
│       - Store in database                                       │
│       - Create alerts                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Scrape filings
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              House & Senate Scrapers                             │
│                                                                  │
│  HouseScraper:                                                   │
│    https://disclosures-clerk.house.gov                          │
│                                                                  │
│  SenateScraper:                                                  │
│    https://efdsearch.senate.gov                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ PDF URLs
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PDF Parser                                    │
│  - Download PDF                                                  │
│  - Convert to text (pdftotext)                                  │
│  - Extract trades                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Parsed trades
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Database Storage                              │
│  - Insert filing                                                │
│  - Insert trades                                                │
│  - Create alerts                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API Endpoints                                 │
│  GET /api/congress/politicians                                   │
│  GET /api/congress/trades                                        │
│  GET /api/congress/alerts                                        │
│  GET /api/congress/status                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/WebSocket
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend                                      │
│  - CongressTrackerTab                                           │
│  - Display trades                                               │
│  - Show alerts                                                  │
│  - Real-time updates                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Setup
```
User runs: npx tsx sync-politicians.ts
    ↓
CongressApiService.syncPoliticiansToDatabase()
    ↓
Fetch from Congress.gov API (3 requests)
    ↓
Store 535+ politicians in database
    ↓
Mark all as is_active = true
```

### 2. Server Startup
```
Server starts
    ↓
CongressPipeline.initialize()
    ↓
Check CONGRESS_API_KEY
    ↓
Create CongressApiService
    ↓
Check: shouldRefresh() → is data >24h old?
    ↓
If yes: syncPoliticiansToDatabase()
    ↓
Ready to poll
```

### 3. Polling Cycle
```
CongressPipeline.runPoll()
    ↓
Check if 24h elapsed since last refresh
    ↓
If yes: Refresh politicians from API
    ↓
Query: SELECT * FROM politicians WHERE is_active = true
    ↓
For each of 535+ politicians:
    ↓
    Scrape House/Senate sites for filings
    ↓
    Download PDF
    ↓
    Parse trades
    ↓
    Store in database
    ↓
    Create alerts
    ↓
Emit events for real-time updates
```

### 4. Auto-Refresh Logic
```
Every 24 hours:
    ↓
CongressApiService.shouldRefresh()
    ↓
Check MAX(last_updated) from politicians table
    ↓
If (now - last_updated) > 24 hours:
    ↓
    Fetch fresh data from Congress.gov API
    ↓
    Mark all existing politicians as is_active = false
    ↓
    Insert/update politicians from API
    ↓
    Mark them as is_active = true
    ↓
    Update last_updated timestamp
```

## Key Components

### CongressApiService
**Purpose**: Interface to Congress.gov API

**Methods**:
- `fetchHouseMembers(congress)` - Paginated fetch of House members
- `fetchSenateMembers(congress)` - Single fetch of Senate members
- `fetchAllMembers(congress)` - Combines both chambers
- `syncPoliticiansToDatabase(congress)` - Updates database
- `getActivePoliticians()` - Queries database for active members
- `shouldRefresh()` - Checks if data is stale (>24h)

**API Calls**:
```
House: 2 requests (250 + 185+ members)
Senate: 1 request (100 members)
Total: 3 requests per refresh
```

### Politicians Table
**Purpose**: Store current Congress members

**Schema**:
```sql
CREATE TABLE politicians (
  bioguide_id VARCHAR PRIMARY KEY,  -- Official Congress ID
  last_name VARCHAR,                -- For scraper matching
  full_name VARCHAR,                -- Display name
  party VARCHAR,                    -- D, R, or I
  state VARCHAR,                    -- Two-letter code
  chamber VARCHAR,                  -- house or senate
  district VARCHAR,                 -- House only
  is_active BOOLEAN,                -- Currently serving
  last_updated TIMESTAMP            -- Last API refresh
);
```

**Indexes**: Primary key on bioguide_id

**Queries**:
- Active politicians: `WHERE is_active = true`
- By chamber: `WHERE chamber = 'house'`
- By state: `WHERE state = 'CA'`
- Stale check: `MAX(last_updated)`

### CongressPipeline
**Purpose**: Orchestrate the entire scraping process

**Lifecycle**:
1. `initialize()` - Setup database, check API key, refresh if needed
2. `runPoll()` - Main polling loop
3. `processPolitician()` - Handle one politician
4. `processFiling()` - Handle one filing

**State**:
- `isRunning` - Prevent concurrent polls
- `lastPollTime` - Track last successful poll
- `congressApi` - API service instance

## Configuration

### Environment Variables
```bash
# Required for dynamic politicians
CONGRESS_API_KEY=your_key_here

# Optional (defaults shown)
PORT=8000
DB_PATH=./data/financial_news.duckdb
```

### API Limits
- Free tier: 5,000 requests/hour
- Our usage: ~3 requests/day (refresh)
- Rate limit: Never reached

## Monitoring

### Check Politician Count
```bash
curl http://localhost:8000/api/congress/status | jq '.trackedPoliticians'
```

### Check Last Refresh
```sql
SELECT MAX(last_updated) FROM politicians;
```

### View Active Politicians
```sql
SELECT chamber, COUNT(*) 
FROM politicians 
WHERE is_active = true 
GROUP BY chamber;
```

Expected:
- House: 435+
- Senate: 100

## Scaling

### Current Load
- Politicians: 535
- Filings per year: ~2,000
- Trades per year: ~10,000
- API calls per day: 3

### Capacity
- Database: DuckDB handles millions of rows
- API: 5,000 req/hour = 120,000/day
- Scrapers: Parallel processing with rate limiting

### Future Expansion
- Add historical congresses (118, 117, etc.)
- Track committee assignments
- Monitor bill sponsorships
- Link to campaign finance data

## Error Handling

### API Failures
- Retry with exponential backoff
- Fall back to cached data
- Log errors, continue with other politicians

### Scraper Failures
- Individual politician failures don't stop pipeline
- Warnings collected and returned
- Partial success is acceptable

### Database Failures
- Transaction rollback on errors
- Duplicate detection (INSERT OR IGNORE)
- Constraint validation

## Performance

### Optimization Strategies
1. **Parallel Processing**: Process politicians concurrently
2. **Batch Operations**: Group database inserts
3. **Caching**: Store API responses for 24h
4. **Pagination**: Handle large result sets
5. **Timeouts**: Prevent hanging requests

### Benchmarks
- API sync: ~5 seconds (3 requests)
- Database insert: ~1 second (535 rows)
- Full poll: ~30 minutes (535 politicians × 2 years)

## Security

### API Key Protection
- Stored in .env (not committed)
- Server-side only (never exposed to client)
- Rate limiting prevents abuse

### Data Validation
- Sanitize politician names for SQL
- Validate party codes (D, R, I)
- Check chamber values (house, senate)

### Access Control
- Public API endpoints (read-only)
- No write access from frontend
- Admin operations require server access

## Maintenance

### Daily Tasks
- None (fully automated)

### Weekly Tasks
- Check logs for errors
- Monitor API usage

### Monthly Tasks
- Review politician count (should be ~535)
- Verify data freshness

### Yearly Tasks
- Update congress number (119 → 120)
- Archive old data if needed

## Troubleshooting

### No Politicians Found
**Symptom**: `trackedPoliticians: 0`
**Solution**: Run `npx tsx sync-politicians.ts`

### Stale Data
**Symptom**: `last_updated` is old
**Solution**: Restart server or run sync script

### API Errors
**Symptom**: 401 Unauthorized
**Solution**: Check CONGRESS_API_KEY in .env

### Missing Trades
**Symptom**: Filings but no trades
**Solution**: Check pdftotext installation

## Documentation Files

- `CONGRESS_API_SETUP.md` - Full setup guide
- `CONGRESS_DYNAMIC_POLITICIANS.md` - Quick reference
- `CONGRESS_MIGRATION_SUMMARY.md` - Migration details
- `QUICK_START_CONGRESS_API.md` - 3-step setup
- `CONGRESS_ARCHITECTURE.md` - This file
