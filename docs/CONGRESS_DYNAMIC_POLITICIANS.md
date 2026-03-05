# Dynamic Politicians - Quick Reference

## What Changed

The Congress Tracker now fetches all 535+ members of Congress dynamically from the official Congress.gov API instead of tracking only 11 hardcoded politicians.

## Quick Setup (3 Steps)

### 1. Get API Key
Visit https://api.congress.gov/sign-up/ and sign up (free, instant)

### 2. Add to .env
```bash
# In server/.env
CONGRESS_API_KEY=your_key_here
```

### 3. Sync Data
```bash
cd server
npx tsx sync-politicians.ts
```

Done! The server will now track all active Congress members.

## How It Works

### Before (Hardcoded)
```typescript
const TRACKED_POLITICIANS = [
  { lastName: 'Pelosi', ... },
  { lastName: 'Davidson', ... },
  // Only 11 politicians
];
```

### After (Dynamic)
```typescript
// Fetches from database
const politicians = await congressApi.getActivePoliticians();
// Returns 435+ House + 100 Senate = 535+ politicians
```

## Auto-Refresh

The system automatically refreshes politician data every 24 hours:

- On server startup (if data is stale)
- During each pipeline poll (if 24h elapsed)
- Manual: `npx tsx sync-politicians.ts`

## Database Query

The pipeline now uses:
```sql
SELECT * FROM politicians WHERE is_active = true
```

Instead of iterating over a hardcoded array.

## API Calls

### Initial Sync (3 requests)
1. House page 1: 250 members
2. House page 2: 185+ members  
3. Senate: 100 members

### Daily Refresh (3 requests)
Same as above, runs automatically every 24 hours.

## Benefits

✅ Tracks all 535+ members (was 11)  
✅ Auto-updates when members change  
✅ No manual maintenance needed  
✅ Official Congress.gov data  
✅ Free API (5,000 req/hour limit)  

## Commands

```bash
# Initial sync
cd server && npx tsx sync-politicians.ts

# View politicians
cd server && npx tsx -e "
import { initDatabase } from './src/database.js';
import { getDatabase } from './src/database.js';
await initDatabase();
const db = getDatabase();
const pols = await db.all('SELECT * FROM politicians WHERE is_active = true');
console.log('Total:', pols.length);
console.table(pols.slice(0, 10));
"

# Check last update
cd server && npx tsx -e "
import { initDatabase } from './src/database.js';
import { getDatabase } from './src/database.js';
await initDatabase();
const db = getDatabase();
const r = await db.all('SELECT MAX(last_updated) as t FROM politicians');
console.log('Last updated:', r[0].t);
"
```

## Files Modified

- ✅ `congress-api-service.ts` - New API service
- ✅ `database.ts` - Added politicians table
- ✅ `pipeline.ts` - Uses database query
- ✅ `scrapers.ts` - Updated interfaces
- ✅ `endpoints.ts` - Uses database
- ✅ `sync-politicians.ts` - Manual sync script

## Backward Compatibility

The old `politicians.ts` file is no longer used but can remain for reference. All functionality now comes from the database.

## Troubleshooting

**No politicians found?**
```bash
cd server && npx tsx sync-politicians.ts
```

**API key not working?**
- Check it's in `server/.env` (not root `.env`)
- Verify format: `CONGRESS_API_KEY=abc123...`
- Restart server after adding

**Want to see the data?**
```bash
cd server && open db-viewer.html
# Then query: SELECT * FROM politicians LIMIT 100;
```
