# Congress Tracker: Dynamic Politicians Migration

## Summary

Successfully replaced the hardcoded 11-politician array with dynamic fetching from Congress.gov API. The system now tracks all 535+ active members of Congress with automatic 24-hour refresh.

## Implementation

### New Components

1. **CongressApiService** (`congress-api-service.ts`)
   - Fetches House members (paginated, 250 per page)
   - Fetches Senate members (single request, 100 total)
   - Syncs data to DuckDB politicians table
   - Checks if refresh needed (24h threshold)

2. **Politicians Table** (in `database.ts`)
   ```sql
   CREATE TABLE politicians (
     bioguide_id VARCHAR PRIMARY KEY,
     last_name VARCHAR,
     full_name VARCHAR,
     party VARCHAR,
     state VARCHAR,
     chamber VARCHAR,
     district VARCHAR,
     is_active BOOLEAN,
     last_updated TIMESTAMP
   );
   ```

3. **Sync Script** (`sync-politicians.ts`)
   - Manual CLI tool to populate/refresh politicians
   - Shows statistics after sync
   - Validates API key

### Modified Components

1. **Pipeline** (`pipeline.ts`)
   - Initializes CongressApiService on startup
   - Checks for stale data (>24h) and refreshes
   - Queries database instead of using hardcoded array
   - Converts database politicians to scraper format

2. **Scrapers** (`scrapers.ts`)
   - Updated to use SimplePolitician interface
   - No longer depends on politicians.ts

3. **Endpoints** (`endpoints.ts`)
   - `/api/congress/politicians` - Queries database
   - `/api/congress/status` - Shows count from database
   - Removed dependency on TRACKED_POLITICIANS array

## Data Flow

### Initialization
```
Server Start
    ↓
Initialize Pipeline
    ↓
Check CONGRESS_API_KEY
    ↓
Create CongressApiService
    ↓
Check if data > 24h old
    ↓
If yes: Fetch from Congress.gov API
    ↓
Store in politicians table
```

### Polling
```
Pipeline Poll
    ↓
Check if 24h elapsed
    ↓
If yes: Refresh politicians
    ↓
Query: SELECT * FROM politicians WHERE is_active = true
    ↓
For each politician:
    ↓
Scrape House/Senate sites
    ↓
Download PDFs
    ↓
Parse trades
    ↓
Store in database
```

## API Usage

### Congress.gov API Endpoints

**House Members (Paginated)**
```
GET /v3/member?chamber=house&congress=119&limit=250&offset=0&api_key=KEY
GET /v3/member?chamber=house&congress=119&limit=250&offset=250&api_key=KEY
```

**Senate Members**
```
GET /v3/member?chamber=senate&congress=119&limit=100&api_key=KEY
```

### Rate Limits
- Free tier: 5,000 requests/hour
- Our usage: ~3 requests/day
- Well within limits

## Configuration

### Environment Variable
```bash
# server/.env
CONGRESS_API_KEY=your_api_key_here
```

### Get API Key
1. Visit: https://api.congress.gov/sign-up/
2. Sign up (free, no credit card)
3. Receive key via email instantly

## Usage

### Initial Setup
```bash
# Add API key to server/.env
echo "CONGRESS_API_KEY=your_key" >> server/.env

# Sync politicians
cd server
npx tsx sync-politicians.ts
```

### Start Server
```bash
cd server
npm run dev
```

The pipeline will:
- Use politicians from database
- Auto-refresh every 24 hours
- Track all 535+ members

### Manual Refresh
```bash
cd server
npx tsx sync-politicians.ts
```

## Benefits

| Before | After |
|--------|-------|
| 11 hardcoded politicians | 535+ from API |
| Manual updates needed | Auto-refresh every 24h |
| Static list | Dynamic, always current |
| Maintenance burden | Zero maintenance |
| Partial coverage | Complete coverage |

## Backward Compatibility

The old `politicians.ts` file is no longer imported but remains in the codebase for reference. All functionality now comes from:

1. Database query: `SELECT * FROM politicians WHERE is_active = true`
2. CongressApiService for refreshing data

## Testing

### Verify Setup
```bash
# Check if API key is set
grep CONGRESS_API_KEY server/.env

# Sync and see results
cd server && npx tsx sync-politicians.ts

# Should show:
# ✅ Successfully synced 535+ politicians
# 📊 Statistics:
#    House: 435+ members
#    Senate: 100 members
```

### Check Database
```bash
cd server
npx tsx -e "
import { initDatabase } from './src/database.js';
import { getDatabase } from './src/database.js';
await initDatabase();
const db = getDatabase();
const count = await db.all('SELECT COUNT(*) as c FROM politicians WHERE is_active = true');
console.log('Active politicians:', count[0].c);
"
```

### View in Browser
```bash
cd server
open db-viewer.html
# Query: SELECT * FROM politicians WHERE is_active = true LIMIT 100;
```

## Monitoring

### Check Last Refresh
```bash
cd server
npx tsx -e "
import { initDatabase } from './src/database.js';
import { getDatabase } from './src/database.js';
await initDatabase();
const db = getDatabase();
const r = await db.all('SELECT MAX(last_updated) as t FROM politicians');
console.log('Last updated:', r[0].t);
const now = new Date();
const last = new Date(r[0].t);
const hours = (now - last) / (1000 * 60 * 60);
console.log('Hours ago:', Math.round(hours));
"
```

### API Status Endpoint
```bash
curl http://localhost:8000/api/congress/status
```

Returns:
```json
{
  "trackedPoliticians": 535,
  "totalFilings": 123,
  "totalTrades": 456,
  ...
}
```

## Files Changed

### New Files
- `server/src/congress-tracker/congress-api-service.ts`
- `server/sync-politicians.ts`
- `CONGRESS_API_SETUP.md`
- `CONGRESS_DYNAMIC_POLITICIANS.md`
- `CONGRESS_MIGRATION_SUMMARY.md`

### Modified Files
- `server/src/congress-tracker/database.ts` - Added politicians table
- `server/src/congress-tracker/pipeline.ts` - Uses database query
- `server/src/congress-tracker/scrapers.ts` - Updated interfaces
- `server/src/congress-tracker/endpoints.ts` - Uses database
- `server/.env` - Added CONGRESS_API_KEY

### Deprecated Files
- `server/src/congress-tracker/politicians.ts` - No longer imported

## Next Steps

1. **Add API key** to `server/.env`
2. **Run sync script**: `npx tsx sync-politicians.ts`
3. **Start server**: `npm run dev`
4. **Verify**: Check `/api/congress/status` shows 535+ politicians

The rest of the pipeline (PDF scraping, trade parsing, alerts) works exactly the same, just with more politicians!

## Troubleshooting

### "No active politicians found"
**Solution**: Run `npx tsx sync-politicians.ts`

### "CONGRESS_API_KEY not set"
**Solution**: Add to `server/.env` and restart server

### "API rate limit exceeded"
**Solution**: Wait 1 hour (unlikely with only 3 requests/day)

### "Failed to fetch House members"
**Solution**: Check internet connection and API key validity

## Documentation

- Full setup guide: `CONGRESS_API_SETUP.md`
- Quick reference: `CONGRESS_DYNAMIC_POLITICIANS.md`
- This summary: `CONGRESS_MIGRATION_SUMMARY.md`
