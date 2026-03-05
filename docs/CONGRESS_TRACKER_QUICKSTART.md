# Congress Tracker - Quick Start

Get the Congress & Senate trade tracker running in 3 steps.

## Step 1: Install pdftotext

```bash
# macOS
brew install poppler

# Linux (Ubuntu/Debian)
sudo apt install poppler-utils

# Verify installation
pdftotext -v
```

## Step 2: Test the System

```bash
cd server
npm run test:congress
```

This will:
- ✅ Check if pdftotext is installed
- ✅ Initialize DuckDB tables
- ✅ Test Yahoo Finance API
- ✅ Run a test poll to fetch recent filings
- ✅ Show statistics

Expected output:
```
🧪 Testing Congress Tracker...

1️⃣  Checking pdftotext availability...
   ✅ pdftotext found

2️⃣  Initializing database...
   ✅ Database tables created

3️⃣  Checking database stats...
   📊 Filings: 0
   📊 Trades: 0
   📊 Unread Alerts: 0

4️⃣  Testing Yahoo Finance price lookup...
   ✅ NVDA current price: $142.50

5️⃣  Running test poll (this may take a few minutes)...
   ⏳ Fetching filings from House and Senate...
   ✅ Poll completed
   📄 New filings: 23
   💼 New trades: 147
   🔔 New alerts: 147

6️⃣  Updated database stats...
   📊 Total Filings: 23
   📊 Total Trades: 147
   📊 Unread Alerts: 147

✅ Test complete!
```

## Step 3: Start the Server

```bash
npm run dev
```

The Congress tracker will:
- ✅ Initialize on server start
- ✅ Run an immediate poll
- ✅ Poll every 60 minutes automatically
- ✅ Expose API at `http://localhost:8000/api/congress/`

## Quick API Tests

### Check system status
```bash
curl http://localhost:8000/api/congress/status
```

### Get all trades
```bash
curl http://localhost:8000/api/congress/trades
```

### Get Pelosi's trades
```bash
curl http://localhost:8000/api/congress/trades/Pelosi
```

### Get unread alerts
```bash
curl http://localhost:8000/api/congress/alerts?unread=true
```

### Get all politicians with win rates
```bash
curl http://localhost:8000/api/congress/politicians
```

### Stream real-time alerts (SSE)
```bash
curl -N http://localhost:8000/api/congress/alerts/stream
```

## Frontend Integration

```typescript
// Fetch trades
const response = await fetch('/api/congress/trades?politician=Pelosi');
const { trades } = await response.json();

// Real-time alerts
const eventSource = new EventSource('/api/congress/alerts/stream');
eventSource.addEventListener('new-trade', (event) => {
  const trade = JSON.parse(event.data);
  console.log('New trade:', trade);
  // Update UI with new trade
});
```

## Troubleshooting

### pdftotext not found
```bash
# macOS
brew install poppler

# Linux
sudo apt install poppler-utils
```

### No trades found
- Wait for the first poll to complete (runs immediately on start)
- Check `/api/congress/status` to see last poll time
- Filings can take up to 75 days to appear after a trade

### Yahoo Finance errors
- Prices are cached in DuckDB
- Invalid tickers return `null` and are cached for 24 hours
- Check `price_cache` table in DuckDB

### Database issues
- DuckDB file is at `server/data/financial-news.db`
- Tables are created automatically on first run
- Use `server/db-viewer.html` to inspect the database

## What's Next?

- See [CONGRESS_TRACKER_GUIDE.md](./CONGRESS_TRACKER_GUIDE.md) for full API documentation
- Build a frontend UI to display trades and alerts
- Add more politicians to track in `server/src/congress-tracker/politicians.ts`
- Customize polling interval in `server/src/congress-tracker/poller.ts`

## Architecture Overview

```
Request Flow:
1. Poller runs every 60 minutes
2. Scrapes House & Senate for new PTR filings
3. Downloads PDFs (5 concurrent max)
4. Parses PDFs with pdftotext
5. Stores in DuckDB (deduplication via filing_id)
6. Creates alerts for new trades
7. Emits real-time events via SSE
8. Enriches with Yahoo Finance prices on API requests
```

## Key Features

✅ **Automatic polling** - Every 60 minutes, no manual intervention
✅ **Deduplication** - DuckDB prevents duplicate processing
✅ **Real-time alerts** - SSE stream for instant notifications
✅ **Win rates** - Dynamic calculation using Yahoo Finance
✅ **Price caching** - Avoids redundant API calls
✅ **Error resilience** - Single failures don't crash the pipeline
✅ **Concurrent processing** - Parallel politician scans
✅ **Timeout protection** - 15-second limit on all HTTP requests
