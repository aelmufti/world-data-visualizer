# Congress & Senate Trade Tracker - Implementation Complete ✅

A comprehensive data pipeline for tracking Congressional stock trades with DuckDB storage, PDF parsing, real-time alerts, and win rate calculations.

## What Was Built

### Core System
✅ **DuckDB Schema** - 4 tables (filings, trades, alerts, price_cache)
✅ **PDF Parser** - Downloads and parses PTR PDFs using pdftotext
✅ **House Scraper** - Fetches filings from disclosures-clerk.house.gov
✅ **Senate Scraper** - Fetches filings from efdsearch.senate.gov
✅ **Price Service** - Yahoo Finance integration with caching
✅ **Pipeline** - Concurrent processing with error handling
✅ **Poller** - Automatic 60-minute polling
✅ **API Endpoints** - 9 REST endpoints + SSE streaming
✅ **Win Rate Calculator** - Dynamic calculation per politician

### Files Created

```
server/src/congress-tracker/
├── database.ts          # DuckDB schema and operations
├── pdf-parser.ts        # PDF download and parsing
├── politicians.ts       # Tracked politicians list
├── scrapers.ts          # House & Senate scrapers
├── price-service.ts     # Yahoo Finance integration
├── pipeline.ts          # Main data pipeline
├── poller.ts           # 60-minute polling service
└── endpoints.ts        # Express API routes

Documentation:
├── CONGRESS_TRACKER_GUIDE.md       # Full API documentation
├── CONGRESS_TRACKER_QUICKSTART.md  # Quick start guide
└── CONGRESS_TRACKER_COMPLETE.md    # This file

Testing:
└── server/test-congress-tracker.ts # Test script
```

## Quick Start

### 1. Install pdftotext
```bash
brew install poppler  # macOS
```

### 2. Test the system
```bash
cd server
npm run test:congress
```

### 3. Start the server
```bash
npm run dev
```

The tracker will:
- Initialize DuckDB tables
- Run an immediate poll
- Poll every 60 minutes automatically
- Expose API at `http://localhost:8000/api/congress/`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/congress/trades` | GET | Query trades with filters |
| `/api/congress/trades/:lastName` | GET | Get trades for one politician |
| `/api/congress/filings` | GET | Get all PTR filings |
| `/api/congress/alerts` | GET | Get alerts (new filings) |
| `/api/congress/alerts/:id/read` | PATCH | Mark alert as read |
| `/api/congress/alerts/read-all` | PATCH | Mark all alerts as read |
| `/api/congress/alerts/stream` | GET | SSE stream for real-time alerts |
| `/api/congress/politicians` | GET | Get politicians with win rates |
| `/api/congress/status` | GET | System status and stats |

## Key Features

### 1. Automatic Polling
- Runs every 60 minutes
- One poll immediately on server start
- Only one poll at a time (skip if already running)
- Processes all politicians in parallel

### 2. Deduplication
- DuckDB `filing_id` is the primary key
- `INSERT OR IGNORE` prevents duplicate processing
- No need for external JSON files

### 3. Real-Time Alerts
- SSE stream at `/api/congress/alerts/stream`
- Emits `new-trade` events for each new trade
- Persistent storage in DuckDB `alerts` table

### 4. Win Rate Calculation
- **Purchase:** Win if price went UP
- **Sale:** Win if price went DOWN
- Uses Yahoo Finance historical data
- Prices cached in DuckDB to avoid redundant calls

### 5. Error Resilience
- Single PDF failure → log + continue
- Single politician failure → log warning + continue
- Partial success → return data + warnings array
- 15-second timeout on all HTTP requests
- Never returns 500 if partial data available

### 6. Concurrent Processing
- All politicians scanned in parallel
- PDF downloads capped at 5 concurrent
- Uses `Promise.allSettled` for fault tolerance

## Tracked Politicians

### House (9 members)
- Nancy Pelosi (D-CA)
- Warren Davidson (R-OH)
- Donald Norcross (D-NJ)
- Terri Sewell (D-AL)
- Bryan Steil (R-WI)
- Nick LaLota (R-NY)
- Michael Guest (R-MS)
- Tom McClintock (R-CA)
- Dwight Evans (D-PA)

### Senate (2 members)
- Alex Padilla (D-CA)
- Rick Scott (R-FL)

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    60-Minute Poller                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Scan All Politicians (Parallel)                │
│  House: disclosures-clerk.house.gov (POST + HTML parse)    │
│  Senate: efdsearch.senate.gov (GET + JSON parse)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           Check DuckDB: filing_id exists?                   │
│              YES → Skip    NO → Continue                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Download PDF (15s timeout)                     │
│              Convert to text (pdftotext)                    │
│              Parse trades (regex patterns)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Insert into DuckDB                         │
│  • filings table (filing metadata)                         │
│  • trades table (parsed trade data)                        │
│  • alerts table (one per trade)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Emit 'new-trade' Event (SSE)                   │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         API Request: Enrich with Yahoo Finance              │
│  • Get historical price (transaction_date)                 │
│  • Get current price                                        │
│  • Calculate return % and win/loss                         │
│  • Cache prices in DuckDB                                  │
└─────────────────────────────────────────────────────────────┘
```

## Example API Responses

### GET /api/congress/trades?politician=Pelosi
```json
{
  "trades": [
    {
      "id": "20024542-NVDA-2025-12-30",
      "filing_id": "20024542",
      "politician": "Pelosi",
      "full_name": "Nancy Pelosi",
      "party": "D",
      "state": "CA",
      "chamber": "house",
      "ticker": "NVDA",
      "asset_name": "NVIDIA Corporation - Common Stock",
      "asset_type": "Stock",
      "action": "Purchase",
      "transaction_date": "2025-12-30",
      "notification_date": "2025-12-30",
      "amount_min": 5000001,
      "amount_max": 25000000,
      "amount_label": "$5.0M – $25.0M",
      "notes": "Contribution of 28,200 shares to Donor-Advised Fund",
      "owner": "Spouse",
      "partial": false,
      "pdf_url": "https://disclosures-clerk.house.gov/...",
      "inserted_at": "2026-03-04T10:30:00Z",
      "priceAtTrade": 142.50,
      "priceNow": 178.20,
      "returnPct": 25.1,
      "isWin": true
    }
  ],
  "count": 1
}
```

### GET /api/congress/politicians
```json
{
  "politicians": [
    {
      "lastName": "Pelosi",
      "fullName": "Nancy Pelosi",
      "party": "D",
      "state": "CA",
      "chamber": "house",
      "winRate": 0.56,
      "totalTrades": 18,
      "resolvedTrades": 15
    },
    {
      "lastName": "Davidson",
      "fullName": "Warren Davidson",
      "party": "R",
      "state": "OH",
      "chamber": "house",
      "winRate": 0.79,
      "totalTrades": 24,
      "resolvedTrades": 19
    }
  ],
  "count": 11
}
```

### GET /api/congress/status
```json
{
  "lastPollTime": "2026-03-04T10:30:00Z",
  "isPolling": false,
  "totalFilings": 142,
  "totalTrades": 856,
  "unreadAlerts": 23,
  "pdfToTextAvailable": true,
  "pdfToTextInstall": "Installed",
  "trackedPoliticians": 11
}
```

## Testing

```bash
# Run test script
cd server
npm run test:congress

# Check system status
curl http://localhost:8000/api/congress/status

# Get all trades
curl http://localhost:8000/api/congress/trades

# Get Pelosi's trades
curl http://localhost:8000/api/congress/trades/Pelosi

# Get unread alerts
curl http://localhost:8000/api/congress/alerts?unread=true

# Stream real-time alerts
curl -N http://localhost:8000/api/congress/alerts/stream
```

## Frontend Integration Example

```typescript
// Fetch trades with filters
async function fetchTrades(filters: {
  politician?: string;
  ticker?: string;
  action?: string;
  chamber?: string;
}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/congress/trades?${params}`);
  const { trades } = await response.json();
  return trades;
}

// Real-time alerts
function setupAlertStream() {
  const eventSource = new EventSource('/api/congress/alerts/stream');
  
  eventSource.addEventListener('new-trade', (event) => {
    const trade = JSON.parse(event.data);
    
    // Show notification
    showNotification({
      title: `New ${trade.action} by ${trade.full_name}`,
      body: `${trade.ticker}: ${trade.amount_label}`,
      icon: trade.party === 'D' ? '🔵' : '🔴'
    });
    
    // Update UI
    addTradeToList(trade);
  });
  
  return eventSource;
}

// Get politicians with win rates
async function fetchPoliticians() {
  const response = await fetch('/api/congress/politicians');
  const { politicians } = await response.json();
  
  // Sort by win rate
  politicians.sort((a, b) => (b.winRate || 0) - (a.winRate || 0));
  
  return politicians;
}
```

## Configuration

### Add More Politicians
Edit `server/src/congress-tracker/politicians.ts`:

```typescript
export const TRACKED_POLITICIANS: Politician[] = [
  // Add new politician
  { 
    lastName: 'Smith', 
    fullName: 'John Smith', 
    party: 'R', 
    state: 'TX', 
    chamber: 'house' 
  },
  // ... existing politicians
];
```

### Change Polling Interval
Edit `server/src/congress-tracker/poller.ts`:

```typescript
private pollIntervalMs = 30 * 60 * 1000; // 30 minutes instead of 60
```

### Adjust Concurrency
Edit `server/src/congress-tracker/pipeline.ts`:

```typescript
const batchSize = 10; // Process 10 PDFs at once instead of 5
```

## Troubleshooting

### pdftotext not found
```bash
# macOS
brew install poppler

# Linux
sudo apt install poppler-utils

# Verify
pdftotext -v
```

### No trades appearing
- Filings can take up to 75 days to appear (45 days to file + 30 days to publish)
- Check `/api/congress/status` for last poll time
- Run manual poll: restart server (polls immediately on start)

### Yahoo Finance errors
- Some tickers may not be available
- Prices are cached as `null` if not found
- Check `price_cache` table in DuckDB

### Database locked
- Only one poll runs at a time
- Check `isPolling` in `/api/congress/status`
- Restart server if stuck

## Next Steps

1. **Build Frontend UI**
   - Display trades in a table
   - Show politician leaderboard by win rate
   - Real-time alert notifications
   - Filter by ticker, action, chamber

2. **Add More Features**
   - Email/SMS alerts for specific politicians
   - Export trades to CSV
   - Historical win rate charts
   - Sector analysis (which sectors do politicians trade most)

3. **Optimize Performance**
   - Add indexes to DuckDB tables
   - Implement pagination for large result sets
   - Cache politician win rates

4. **Extend Coverage**
   - Add more politicians to track
   - Include older years (2023, 2024)
   - Track other disclosure types (annual reports)

## Documentation

- **Full Guide:** [CONGRESS_TRACKER_GUIDE.md](./CONGRESS_TRACKER_GUIDE.md)
- **Quick Start:** [CONGRESS_TRACKER_QUICKSTART.md](./CONGRESS_TRACKER_QUICKSTART.md)
- **This Summary:** [CONGRESS_TRACKER_COMPLETE.md](./CONGRESS_TRACKER_COMPLETE.md)

## Support

For issues or questions:
1. Check `/api/congress/status` for system health
2. Review server logs for error messages
3. Run `npm run test:congress` to verify setup
4. Ensure pdftotext is installed: `pdftotext -v`

---

**Status:** ✅ Complete and ready to use
**Last Updated:** March 4, 2026
**Version:** 1.0.0
