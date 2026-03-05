# Congress.gov API Integration

The Congress Tracker now dynamically fetches politician data from the official Congress.gov API instead of using a hardcoded list.

## Features

- **Dynamic Data**: Fetches all current House and Senate members from Congress.gov API
- **Auto-Refresh**: Updates politician data every 24 hours automatically
- **Database Storage**: Stores politicians in DuckDB `politicians` table
- **Active Tracking**: Only tracks politicians marked as `is_active = true`
- **Scalable**: Handles all 435+ House members and 100 Senate members

## Setup

### 1. Get a Congress.gov API Key

1. Visit https://api.congress.gov/sign-up/
2. Sign up for a free API key (no credit card required)
3. You'll receive the key via email instantly

### 2. Add API Key to Environment

Edit `server/.env` and add:

```bash
CONGRESS_API_KEY=your_api_key_here
```

### 3. Initial Sync

Run the sync script to populate the database:

```bash
cd server
npx tsx sync-politicians.ts
```

This will:
- Fetch all House members (435+) from Congress.gov
- Fetch all Senate members (100) from Congress.gov
- Store them in the `politicians` table
- Mark them as active

### 4. Start the Server

```bash
npm run dev
```

The pipeline will now:
- Use politicians from the database instead of hardcoded array
- Auto-refresh politician data every 24 hours
- Track all active members automatically

## API Endpoints Used

### House Members
```
GET https://api.congress.gov/v3/member?chamber=house&congress=119&limit=250&api_key=<KEY>
GET https://api.congress.gov/v3/member?chamber=house&congress=119&limit=250&offset=250&api_key=<KEY>
```

### Senate Members
```
GET https://api.congress.gov/v3/member?chamber=senate&congress=119&limit=100&api_key=<KEY>
```

## Database Schema

### Politicians Table

```sql
CREATE TABLE politicians (
  bioguide_id VARCHAR PRIMARY KEY,
  last_name VARCHAR,
  full_name VARCHAR,
  party VARCHAR,           -- 'D', 'R', or 'I'
  state VARCHAR,
  chamber VARCHAR,         -- 'house' or 'senate'
  district VARCHAR,        -- House only
  is_active BOOLEAN,       -- true for current members
  last_updated TIMESTAMP
);
```

## How It Works

### 1. Initialization

When the server starts:
```typescript
await congressPipeline.initialize();
```

This:
- Creates the `politicians` table if it doesn't exist
- Checks if politician data is older than 24 hours
- If yes, fetches fresh data from Congress.gov API
- Updates the database with current members

### 2. Polling

When the pipeline runs:
```typescript
await congressPipeline.runPoll();
```

This:
- Checks if 24 hours have passed since last refresh
- If yes, refreshes politician data from API
- Queries: `SELECT * FROM politicians WHERE is_active = true`
- Processes filings for all active politicians

### 3. Auto-Refresh

The refresh logic:
```typescript
const shouldRefresh = await congressApi.shouldRefresh();
if (shouldRefresh) {
  await congressApi.syncPoliticiansToDatabase();
}
```

Runs automatically:
- On server startup
- Every time the pipeline polls (if 24h elapsed)

## Manual Operations

### View All Politicians

```bash
cd server
npx tsx -e "
import { initDatabase } from './src/database.js';
import { getDatabase } from './src/database.js';
await initDatabase();
const db = getDatabase();
const politicians = await db.all('SELECT * FROM politicians WHERE is_active = true ORDER BY chamber, state, last_name');
console.table(politicians);
"
```

### Force Refresh

```bash
cd server
npx tsx sync-politicians.ts
```

### Check Last Update

```bash
cd server
npx tsx -e "
import { initDatabase } from './src/database.js';
import { getDatabase } from './src/database.js';
await initDatabase();
const db = getDatabase();
const result = await db.all('SELECT MAX(last_updated) as last_update FROM politicians');
console.log('Last updated:', result[0].last_update);
"
```

## Migration from Hardcoded Array

### Before
```typescript
const TRACKED_POLITICIANS = [
  { lastName: 'Pelosi', fullName: 'Nancy Pelosi', party: 'D', state: 'CA', chamber: 'house' },
  // ... 10 hardcoded politicians
];
```

### After
```typescript
// Fetch from database
const politicians = await congressApi.getActivePoliticians();
// Returns 535+ politicians dynamically
```

## Benefits

1. **Complete Coverage**: Tracks all 535+ members instead of just 11
2. **Always Current**: Auto-updates when members change
3. **No Maintenance**: No need to manually update the list
4. **Official Data**: Uses official Congress.gov API
5. **Scalable**: Handles new members automatically

## Troubleshooting

### No Politicians Found

If you see: `No active politicians found in database`

Solution:
```bash
cd server
npx tsx sync-politicians.ts
```

### API Key Not Set

If you see: `CONGRESS_API_KEY not set`

Solution:
1. Get API key from https://api.congress.gov/sign-up/
2. Add to `server/.env`: `CONGRESS_API_KEY=your_key_here`
3. Restart server

### API Rate Limits

The free tier allows:
- 5,000 requests per hour
- No daily limit

Our usage:
- Initial sync: ~3 requests
- Daily refresh: ~3 requests
- Well within limits

## Files Changed

- `server/src/congress-tracker/congress-api-service.ts` - New API service
- `server/src/congress-tracker/database.ts` - Added politicians table
- `server/src/congress-tracker/pipeline.ts` - Uses database instead of array
- `server/src/congress-tracker/scrapers.ts` - Updated interfaces
- `server/sync-politicians.ts` - Manual sync script
- `server/.env` - Added CONGRESS_API_KEY

## Next Steps

The rest of the pipeline works exactly the same:
1. Pipeline queries: `SELECT * FROM politicians WHERE is_active = true`
2. For each politician, scrapes House/Senate disclosure sites
3. Downloads PDFs, parses trades, stores in database
4. Creates alerts for new trades

No changes needed to:
- PDF parsing
- Trade extraction
- Alert generation
- Frontend display
