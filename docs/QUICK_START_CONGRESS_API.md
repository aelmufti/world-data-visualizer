# Quick Start: Congress.gov API Integration

## 3-Step Setup

### Step 1: Get API Key (2 minutes)
1. Go to https://api.congress.gov/sign-up/
2. Fill out the form (name, email, organization)
3. Check your email for the API key

### Step 2: Configure (30 seconds)
```bash
# Add to server/.env
echo "CONGRESS_API_KEY=paste_your_key_here" >> server/.env
```

### Step 3: Sync Data (1 minute)
```bash
cd server
npx tsx sync-politicians.ts
```

You should see:
```
✅ Successfully synced 535+ politicians
📊 Statistics:
   House: 435+ members
   Senate: 100 members
   Total: 535+ active politicians
```

## Start Using

```bash
cd server
npm run dev
```

The Congress Tracker now:
- ✅ Tracks all 535+ members (was 11)
- ✅ Auto-refreshes every 24 hours
- ✅ Uses official Congress.gov data

## Verify It's Working

### Check API Status
```bash
curl http://localhost:8000/api/congress/status
```

Look for:
```json
{
  "trackedPoliticians": 535,
  ...
}
```

### View Politicians
```bash
curl http://localhost:8000/api/congress/politicians | jq '.count'
```

Should return: `535` (or similar)

### Check Database
```bash
cd server
open db-viewer.html
```

Run query:
```sql
SELECT COUNT(*) FROM politicians WHERE is_active = true;
```

## What Changed

**Before:**
- Hardcoded array of 11 politicians
- Manual updates needed

**After:**
- Dynamic fetch from Congress.gov API
- All 535+ members tracked
- Auto-refresh every 24 hours

## The Pipeline Still Works The Same

1. Query: `SELECT * FROM politicians WHERE is_active = true`
2. For each politician → Scrape House/Senate sites
3. Download PDFs → Parse trades → Store in database
4. Create alerts → Display in frontend

Only the politician list is now dynamic!

## Manual Refresh

Anytime you want to refresh the politician data:
```bash
cd server
npx tsx sync-politicians.ts
```

## Troubleshooting

**"CONGRESS_API_KEY not set"**
- Add to `server/.env` (not root `.env`)
- Restart server

**"No active politicians found"**
- Run: `npx tsx sync-politicians.ts`

**"API error 401"**
- Check API key is correct
- Verify no extra spaces in .env file

## Documentation

- 📘 Full guide: `CONGRESS_API_SETUP.md`
- 📗 Quick reference: `CONGRESS_DYNAMIC_POLITICIANS.md`
- 📕 Migration details: `CONGRESS_MIGRATION_SUMMARY.md`

## Support

The Congress.gov API is:
- ✅ Free forever
- ✅ 5,000 requests/hour limit
- ✅ No credit card required
- ✅ Official government data

We use ~3 requests per day, well within limits.
