# Congress & Senate Trade Tracker

Complete data pipeline for tracking Congressional stock trades with DuckDB storage, PDF parsing, real-time alerts, and win rate calculations.

## Features

- ✅ Fetches PTR (Periodic Transaction Report) filings from House & Senate
- ✅ Parses PDF documents into structured trade data
- ✅ Stores everything in local DuckDB database
- ✅ Real-time alerts for new filings via SSE
- ✅ Win rate calculations using Yahoo Finance API
- ✅ Automatic polling every 60 minutes
- ✅ Deduplication via DuckDB (no duplicate processing)
- ✅ Concurrent processing with timeout protection
- ✅ Price caching to avoid redundant API calls

## Prerequisites

Install `pdftotext` for PDF parsing:

```bash
# macOS
brew install poppler

# Linux
apt install poppler-utils
```

## Tracked Politicians

### House Members
- Nancy Pelosi (D-CA)
- Warren Davidson (R-OH)
- Donald Norcross (D-NJ)
- Terri Sewell (D-AL)
- Bryan Steil (R-WI)
- Nick LaLota (R-NY)
- Michael Guest (R-MS)
- Tom McClintock (R-CA)
- Dwight Evans (D-PA)

### Senate Members
- Alex Padilla (D-CA)
- Rick Scott (R-FL)

## API Endpoints

### GET /api/congress/trades
Query trades with optional filters.

**Query Parameters:**
- `politician` - Filter by politician last name (e.g., "Pelosi")
- `ticker` - Filter by stock ticker (e.g., "NVDA")
- `action` - Filter by action type ("Purchase", "Sale", "Exchange")
- `chamber` - Filter by chamber ("house" or "senate")

**Response:**
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

### GET /api/congress/trades/:lastName
Get all trades for a specific politician.

**Example:** `/api/congress/trades/Pelosi`

### GET /api/congress/filings
Get all PTR filings in the database.

**Response:**
```json
{
  "filings": [
    {
      "filing_id": "20024542",
      "politician": "Pelosi",
      "full_name": "Nancy Pelosi",
      "party": "D",
      "state": "CA",
      "chamber": "house",
      "pdf_url": "https://disclosures-clerk.house.gov/...",
      "fetched_at": "2026-03-04T10:30:00Z",
      "year": 2025
    }
  ],
  "count": 1
}
```

### GET /api/congress/alerts
Get trade alerts (new filings detected).

**Query Parameters:**
- `unread=true` - Only return unread alerts

**Response:**
```json
{
  "alerts": [
    {
      "id": "20024542-NVDA-2025-12-30",
      "trade_id": "20024542-NVDA-2025-12-30",
      "detected_at": "2026-03-04T10:30:00Z",
      "read": false,
      ...trade data...
    }
  ],
  "count": 1
}
```

### PATCH /api/congress/alerts/:id/read
Mark a specific alert as read.

### PATCH /api/congress/alerts/read-all
Mark all alerts as read.

### GET /api/congress/alerts/stream
Server-Sent Events (SSE) stream for real-time trade alerts.

**Usage:**
```javascript
const eventSource = new EventSource('/api/congress/alerts/stream');

eventSource.addEventListener('new-trade', (event) => {
  const trade = JSON.parse(event.data);
  console.log('New trade detected:', trade);
});
```

### GET /api/congress/politicians
Get all tracked politicians with win rates.

**Response:**
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
    }
  ],
  "count": 11
}
```

### GET /api/congress/status
System status and statistics.

**Response:**
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

## Win Rate Calculation

Win rates are calculated dynamically using Yahoo Finance historical data:

1. **For Purchases:** A trade is a "win" if the stock price went UP after the transaction date
2. **For Sales:** A trade is a "win" if the stock price went DOWN after the transaction date

**Formula:**
- Win Rate = (Number of Wins) / (Total Resolved Trades)
- Resolved Trades = Trades where Yahoo Finance returned valid price data

**Price Caching:**
- All price lookups are cached in DuckDB to avoid redundant API calls
- If Yahoo returns no data, it's cached as `null` and not retried for 24 hours

## Data Sources

### House of Representatives
- **URL:** https://disclosures-clerk.house.gov/
- **Method:** POST to `/FinancialDisclosure/ViewMemberSearchResult`
- **Format:** HTML response with PDF links
- **Years:** 2025, 2026

### Senate
- **URL:** https://efdsearch.senate.gov/
- **Method:** GET to `/search/report/data/`
- **Format:** JSON response with PDF URLs
- **Years:** 2025, 2026

## Polling Behavior

- Runs every **60 minutes**
- One poll immediately on server start
- Only one poll runs at a time (skips if already running)
- Processes all politicians in parallel
- PDF downloads capped at 5 concurrent requests
- 15-second timeout on all HTTP requests

## Error Handling

- Single PDF failure → logs error, continues pipeline
- Single politician failure → logs warning, continues with others
- Missing pdftotext → returns error with install instructions
- Partial success → returns successful data + warnings array
- Never returns 500 if partial data is available

## DuckDB Schema

### filings table
```sql
CREATE TABLE filings (
  filing_id VARCHAR PRIMARY KEY,
  politician VARCHAR,
  full_name VARCHAR,
  party VARCHAR,
  state VARCHAR,
  chamber VARCHAR,
  pdf_url VARCHAR,
  fetched_at TIMESTAMP,
  year INTEGER
);
```

### trades table
```sql
CREATE TABLE trades (
  id VARCHAR PRIMARY KEY,
  filing_id VARCHAR,
  politician VARCHAR,
  full_name VARCHAR,
  party VARCHAR,
  state VARCHAR,
  chamber VARCHAR,
  ticker VARCHAR,
  asset_name VARCHAR,
  asset_type VARCHAR,
  action VARCHAR,
  transaction_date DATE,
  notification_date DATE,
  amount_min BIGINT,
  amount_max BIGINT,
  amount_label VARCHAR,
  notes VARCHAR,
  owner VARCHAR,
  partial BOOLEAN,
  pdf_url VARCHAR,
  inserted_at TIMESTAMP
);
```

### alerts table
```sql
CREATE TABLE alerts (
  id VARCHAR PRIMARY KEY,
  trade_id VARCHAR,
  detected_at TIMESTAMP,
  read BOOLEAN DEFAULT false
);
```

### price_cache table
```sql
CREATE TABLE price_cache (
  ticker VARCHAR,
  price_date DATE,
  close_price DOUBLE,
  fetched_at TIMESTAMP,
  PRIMARY KEY (ticker, price_date)
);
```

## Testing

Check system status:
```bash
curl http://localhost:8000/api/congress/status
```

Get Pelosi's trades:
```bash
curl http://localhost:8000/api/congress/trades/Pelosi
```

Get unread alerts:
```bash
curl http://localhost:8000/api/congress/alerts?unread=true
```

Stream real-time alerts:
```bash
curl -N http://localhost:8000/api/congress/alerts/stream
```

## Architecture

```
congress-tracker/
├── database.ts       # DuckDB schema and operations
├── pdf-parser.ts     # PDF download and parsing logic
├── politicians.ts    # Static list of tracked politicians
├── scrapers.ts       # House and Senate scrapers
├── price-service.ts  # Yahoo Finance integration
├── pipeline.ts       # Main data pipeline
├── poller.ts         # 60-minute polling service
└── endpoints.ts      # Express API routes
```

## Notes

- Filings can take up to 75 days to appear (45 days to file + 30 days to publish)
- Polling every hour is sufficient given the lag
- DuckDB is the single source of truth (no JSON files)
- All operations use `INSERT OR IGNORE` for idempotency
- Trade IDs are deterministic: `{filing_id}-{ticker}-{transaction_date}`
