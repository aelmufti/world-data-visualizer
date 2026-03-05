# Company Information API Guide

The Company API provides detailed information about companies mentioned in news articles, including statistics, sentiment analysis, events, and news history.

## Endpoints

### 1. Search Companies

Search for companies by name or ticker symbol.

```http
GET /api/companies/search?q=apple
```

**Query Parameters:**
- `q` (required): Search query (company name or ticker)

**Response:**
```json
{
  "companies": [
    {
      "id": "uuid",
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "sector": "technology",
      "created_at": "2026-03-04T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Example:**
```bash
curl "http://localhost:8000/api/companies/search?q=tesla"
```

---

### 2. Get Company Details

Get detailed information and statistics for a specific company.

```http
GET /api/companies/:ticker
```

**Parameters:**
- `ticker` (required): Company ticker symbol (e.g., AAPL, TSLA)

**Response:**
```json
{
  "company": {
    "id": "uuid",
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "sector": "technology"
  },
  "stats": {
    "totalMentions": 150,
    "mentions24h": 12,
    "avgSentiment": 0.45,
    "recentEvents": [
      {
        "event_type": "product_launch",
        "count": 5
      },
      {
        "event_type": "earnings_beat",
        "count": 2
      }
    ],
    "latestArticle": {
      "title": "Apple announces new iPhone",
      "published_at": "2026-03-04T10:00:00.000Z",
      "url": "https://..."
    }
  }
}
```

**Example:**
```bash
curl "http://localhost:8000/api/companies/AAPL"
```

---

### 3. Get Company News

Get news articles mentioning the company.

```http
GET /api/companies/:ticker/news?limit=50&since=2026-03-01
```

**Parameters:**
- `ticker` (required): Company ticker symbol

**Query Parameters:**
- `limit` (optional): Number of articles to return (default: 50)
- `since` (optional): ISO date string to filter articles from

**Response:**
```json
{
  "ticker": "AAPL",
  "articles": [
    {
      "id": "uuid",
      "title": "Apple announces new product",
      "url": "https://...",
      "published_at": "2026-03-04T10:00:00.000Z",
      "source_domain": "techcrunch.com",
      "raw_sentiment": 0.5,
      "mention_count": 3,
      "entity_sentiment": 0.6,
      "is_primary_subject": true,
      "event_tags": ["product_launch"]
    }
  ],
  "count": 1
}
```

**Example:**
```bash
curl "http://localhost:8000/api/companies/AAPL/news?limit=20"
```

---

### 4. Get Company Events

Get detected events related to the company.

```http
GET /api/companies/:ticker/events?limit=50&event_type=earnings_beat
```

**Parameters:**
- `ticker` (required): Company ticker symbol

**Query Parameters:**
- `limit` (optional): Number of events to return (default: 50)
- `event_type` (optional): Filter by specific event type

**Response:**
```json
{
  "ticker": "AAPL",
  "events": [
    {
      "id": "uuid",
      "event_type": "earnings_beat",
      "confidence": 0.85,
      "detected_at": "2026-03-04T10:00:00.000Z",
      "article_url": "https://...",
      "article_title": "Apple beats earnings expectations"
    }
  ],
  "count": 1
}
```

**Event Types:**
- `earnings_beat` / `earnings_miss`
- `merger_acquisition`
- `government_contract`
- `partnership`
- `executive_change`
- `layoffs`
- `product_launch`
- `regulatory_action`
- `share_buyback`
- `dividend_change`
- `analyst_upgrade` / `analyst_downgrade`
- `insider_trading`
- `sec_filing`
- `lawsuit`

**Example:**
```bash
curl "http://localhost:8000/api/companies/AAPL/events?event_type=product_launch"
```

---

### 5. Get Sentiment Analysis

Get sentiment analysis over time for a company.

```http
GET /api/companies/:ticker/sentiment?days=30
```

**Parameters:**
- `ticker` (required): Company ticker symbol

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "ticker": "AAPL",
  "days": 30,
  "data": [
    {
      "date": "2026-03-04",
      "avg_sentiment": 0.45,
      "mention_count": 12,
      "avg_article_sentiment": 0.38
    },
    {
      "date": "2026-03-03",
      "avg_sentiment": 0.32,
      "mention_count": 8,
      "avg_article_sentiment": 0.25
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:8000/api/companies/AAPL/sentiment?days=7"
```

---

### 6. Get Trending Companies

Get most mentioned companies in a time period.

```http
GET /api/companies/trending/list?limit=20&hours=24
```

**Query Parameters:**
- `limit` (optional): Number of companies to return (default: 20)
- `hours` (optional): Time period in hours (default: 24)

**Response:**
```json
{
  "hours": 24,
  "trending": [
    {
      "ticker": "AAPL",
      "company_name": "Apple Inc.",
      "mention_count": 45,
      "avg_sentiment": 0.52,
      "primary_mentions": 12
    },
    {
      "ticker": "TSLA",
      "company_name": "Tesla Inc.",
      "mention_count": 38,
      "avg_sentiment": 0.35,
      "primary_mentions": 10
    }
  ],
  "count": 2
}
```

**Example:**
```bash
curl "http://localhost:8000/api/companies/trending/list?hours=48"
```

---

## Frontend Component

The `CompanyInfoPanel` component provides a UI for searching and viewing company information.

### Features

- **Search by Ticker**: Search for any company by its ticker symbol
- **Company Statistics**: View total mentions, 24h mentions, and average sentiment
- **Recent Events**: See detected events with counts
- **News Feed**: Browse recent articles mentioning the company
- **Sentiment Indicators**: Visual sentiment indicators (positive/negative/neutral)
- **Event Tags**: See what types of events are associated with each article

### Usage

The component is already integrated into the main app in the right column.

```tsx
import CompanyInfoPanel from './components/CompanyInfoPanel'

<CompanyInfoPanel />
```

---

## Use Cases

### 1. Track Specific Companies

Monitor news and sentiment for companies in your portfolio:

```bash
# Get Apple news
curl "http://localhost:8000/api/companies/AAPL/news?limit=10"

# Check Tesla sentiment
curl "http://localhost:8000/api/companies/TSLA/sentiment?days=7"
```

### 2. Detect Breaking Events

Find companies with recent significant events:

```bash
# Get recent merger/acquisition events
curl "http://localhost:8000/api/companies/AAPL/events?event_type=merger_acquisition"

# Get earnings announcements
curl "http://localhost:8000/api/companies/AAPL/events?event_type=earnings_beat"
```

### 3. Sentiment Analysis

Track sentiment changes over time:

```bash
# 30-day sentiment trend
curl "http://localhost:8000/api/companies/AAPL/sentiment?days=30"
```

### 4. Discover Trending Companies

Find what companies are being talked about:

```bash
# Most mentioned in last 24 hours
curl "http://localhost:8000/api/companies/trending/list?hours=24"

# Top 50 companies this week
curl "http://localhost:8000/api/companies/trending/list?limit=50&hours=168"
```

---

## Integration Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:8000'

// Search for a company
async function searchCompany(query: string) {
  const response = await fetch(`${API_BASE}/api/companies/search?q=${query}`)
  return await response.json()
}

// Get company details
async function getCompanyInfo(ticker: string) {
  const response = await fetch(`${API_BASE}/api/companies/${ticker}`)
  return await response.json()
}

// Get company news
async function getCompanyNews(ticker: string, limit = 20) {
  const response = await fetch(
    `${API_BASE}/api/companies/${ticker}/news?limit=${limit}`
  )
  return await response.json()
}
```

### Python

```python
import requests

API_BASE = 'http://localhost:8000'

# Search for a company
def search_company(query):
    response = requests.get(f'{API_BASE}/api/companies/search', params={'q': query})
    return response.json()

# Get company details
def get_company_info(ticker):
    response = requests.get(f'{API_BASE}/api/companies/{ticker}')
    return response.json()

# Get sentiment data
def get_sentiment(ticker, days=30):
    response = requests.get(
        f'{API_BASE}/api/companies/{ticker}/sentiment',
        params={'days': days}
    )
    return response.json()
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Sentiment scores range from -1 (very negative) to +1 (very positive)
- The API uses the same database as the news aggregation system
- Company data is automatically populated as articles are processed
- Ticker symbols are case-insensitive but returned in uppercase

---

## Error Responses

### 404 Not Found
```json
{
  "error": "Company not found"
}
```

### 400 Bad Request
```json
{
  "error": "Query parameter 'q' is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message here"
}
```
