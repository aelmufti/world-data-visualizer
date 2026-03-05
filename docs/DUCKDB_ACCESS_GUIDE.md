# DuckDB Access Guide

Your financial news database is stored in `server/data/financial_news.duckdb`. Here are all the ways to access it:

## ⚠️ Important Note

DuckDB only allows **one connection at a time**. You must stop the server before accessing the database directly.

## Method 1: DuckDB CLI (Recommended for SQL queries)

### Installation

```bash
# macOS
brew install duckdb

# Linux
wget https://github.com/duckdb/duckdb/releases/download/v0.9.2/duckdb_cli-linux-amd64.zip
unzip duckdb_cli-linux-amd64.zip

# Or visit: https://duckdb.org/docs/installation/
```

### Usage

```bash
# Stop the server first!
cd server
duckdb data/financial_news.duckdb
```

### Useful Commands

```sql
-- Show all tables
.tables

-- Show table schema
.schema articles

-- Count records
SELECT COUNT(*) FROM articles;
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM article_mentions;

-- Recent articles
SELECT title, published_at, source_domain 
FROM articles 
ORDER BY published_at DESC 
LIMIT 10;

-- Articles with companies
SELECT 
  a.title,
  a.published_at,
  m.ticker,
  m.mention_count,
  m.entity_sentiment
FROM articles a
JOIN article_mentions m ON a.id = m.article_id
ORDER BY a.published_at DESC
LIMIT 20;

-- Top mentioned companies
SELECT 
  ticker,
  COUNT(*) as mention_count,
  AVG(entity_sentiment) as avg_sentiment
FROM article_mentions
GROUP BY ticker
ORDER BY mention_count DESC
LIMIT 20;

-- Recent events
SELECT 
  ticker,
  event_type,
  confidence,
  detected_at
FROM events
ORDER BY detected_at DESC
LIMIT 30;

-- Articles by source
SELECT 
  source_domain,
  COUNT(*) as article_count
FROM articles
GROUP BY source_domain
ORDER BY article_count DESC;

-- Articles by date
SELECT 
  DATE(published_at) as date,
  COUNT(*) as count
FROM articles
GROUP BY DATE(published_at)
ORDER BY date DESC
LIMIT 7;

-- Export to CSV
COPY (SELECT * FROM articles LIMIT 100) TO 'articles.csv' (HEADER, DELIMITER ',');

-- Exit
.quit
```

## Method 2: Node.js Script (Quick Queries)

I've created a helper script for you:

```bash
cd server

# Stop the server first!

# Run a query
node query-db.mjs "SELECT COUNT(*) FROM articles"

# Recent articles
node query-db.mjs "SELECT title, published_at FROM articles ORDER BY published_at DESC LIMIT 10"

# Companies
node query-db.mjs "SELECT * FROM companies LIMIT 10"
```

## Method 3: Web Viewer (Visual Interface)

I've created a web-based viewer at `server/db-viewer.html`.

### Setup

1. Add the query endpoint (already done in the code above)
2. Keep the server running
3. Open `server/db-viewer.html` in your browser

The viewer provides:
- Live statistics (article count, companies, events)
- Quick query buttons
- Custom SQL query editor
- Results displayed in a table
- Only allows SELECT queries for safety

**Note:** This method works WITH the server running because it uses the API endpoint.

## Method 4: Python (with DuckDB library)

```bash
pip install duckdb
```

```python
import duckdb

# Stop the server first!
conn = duckdb.connect('server/data/financial_news.duckdb')

# Query
result = conn.execute("SELECT COUNT(*) FROM articles").fetchall()
print(f"Total articles: {result[0][0]}")

# Get recent articles
articles = conn.execute("""
    SELECT title, published_at, source_domain 
    FROM articles 
    ORDER BY published_at DESC 
    LIMIT 10
""").fetchdf()  # Returns pandas DataFrame

print(articles)

conn.close()
```

## Method 5: Export to Other Formats

### Export to CSV

```sql
-- In DuckDB CLI
COPY (SELECT * FROM articles) TO 'articles.csv' (HEADER, DELIMITER ',');
COPY (SELECT * FROM companies) TO 'companies.csv' (HEADER, DELIMITER ',');
```

### Export to Parquet

```sql
COPY (SELECT * FROM articles) TO 'articles.parquet' (FORMAT PARQUET);
```

### Export to JSON

```sql
COPY (SELECT * FROM articles LIMIT 100) TO 'articles.json';
```

## Database Schema

### Tables

1. **articles** - News articles
   - id (VARCHAR, PRIMARY KEY)
   - title (VARCHAR)
   - url (VARCHAR, UNIQUE)
   - body (TEXT)
   - published_at (TIMESTAMP)
   - ingested_at (TIMESTAMP)
   - source_domain (VARCHAR)
   - raw_sentiment (DOUBLE)

2. **companies** - Tracked companies
   - id (VARCHAR, PRIMARY KEY)
   - ticker (VARCHAR, UNIQUE)
   - name (VARCHAR)
   - sector (VARCHAR)
   - created_at (TIMESTAMP)

3. **article_mentions** - Company mentions in articles
   - id (VARCHAR, PRIMARY KEY)
   - article_id (VARCHAR, FOREIGN KEY)
   - company_id (VARCHAR, FOREIGN KEY)
   - ticker (VARCHAR)
   - mention_count (INTEGER)
   - entity_sentiment (DOUBLE)
   - is_primary_subject (BOOLEAN)
   - event_tags (VARCHAR[])

4. **events** - Detected events
   - id (VARCHAR, PRIMARY KEY)
   - company_id (VARCHAR, FOREIGN KEY)
   - ticker (VARCHAR)
   - event_type (VARCHAR)
   - confidence (DOUBLE)
   - detected_at (TIMESTAMP)
   - article_url (VARCHAR)
   - article_id (VARCHAR, FOREIGN KEY)

5. **api_keys** - API access keys
   - id (VARCHAR, PRIMARY KEY)
   - key (VARCHAR, UNIQUE)
   - name (VARCHAR)
   - is_active (BOOLEAN)
   - rate_limit (INTEGER)

## Common Queries

### Find articles about a specific company

```sql
SELECT 
  a.title,
  a.url,
  a.published_at,
  m.mention_count,
  m.entity_sentiment
FROM articles a
JOIN article_mentions m ON a.id = m.article_id
WHERE m.ticker = 'AAPL'
ORDER BY a.published_at DESC;
```

### Find breaking news (high importance events)

```sql
SELECT 
  e.ticker,
  e.event_type,
  e.confidence,
  a.title,
  a.url,
  e.detected_at
FROM events e
JOIN articles a ON e.article_id = a.id
WHERE e.confidence > 0.7
ORDER BY e.detected_at DESC
LIMIT 20;
```

### Sentiment analysis by company

```sql
SELECT 
  ticker,
  COUNT(*) as mentions,
  AVG(entity_sentiment) as avg_sentiment,
  MIN(entity_sentiment) as min_sentiment,
  MAX(entity_sentiment) as max_sentiment
FROM article_mentions
GROUP BY ticker
HAVING COUNT(*) >= 5
ORDER BY mentions DESC;
```

### Articles in the last 24 hours

```sql
SELECT 
  title,
  source_domain,
  published_at,
  raw_sentiment
FROM articles
WHERE published_at >= NOW() - INTERVAL 24 HOURS
ORDER BY published_at DESC;
```

## Troubleshooting

### "Database is locked" error

- Stop the server: The server has the database open
- Check for other processes: `ps aux | grep duckdb`
- Kill any hanging processes if needed

### "Table not found" error

- Make sure you're in the correct database file
- Run `.tables` to see available tables
- Check if the database was initialized: `SELECT COUNT(*) FROM articles`

### Performance issues

- DuckDB is very fast, but large queries can take time
- Use LIMIT to test queries first
- Add indexes if needed (already created for common queries)

## Backup

```bash
# Create a backup
cp server/data/financial_news.duckdb server/data/financial_news.backup.duckdb

# Or export everything
duckdb server/data/financial_news.duckdb -c "EXPORT DATABASE 'backup_folder'"
```

## Tips

1. Always use `LIMIT` when exploring data
2. Use `EXPLAIN` to see query execution plans
3. DuckDB supports most PostgreSQL syntax
4. You can query CSV/Parquet files directly without importing
5. Use `.timer on` to see query execution time
