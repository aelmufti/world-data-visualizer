import pkg from 'duckdb-async';
const { Database } = pkg;

const db = await Database.create('./data/financial_news.duckdb');

const result = await db.all(`
  SELECT 
    COUNT(*) as total_articles,
    COUNT(sentiment) as articles_with_sentiment,
    AVG(sentiment) as avg_sentiment,
    MIN(sentiment) as min_sentiment,
    MAX(sentiment) as max_sentiment
  FROM articles
  WHERE publishedAt >= datetime('now', '-24 hours')
`);

console.log('Sentiment data:', JSON.stringify(result, null, 2));

const sample = await db.all(`
  SELECT title, sentiment, publishedAt
  FROM articles
  WHERE publishedAt >= datetime('now', '-24 hours')
  ORDER BY publishedAt DESC
  LIMIT 5
`);

console.log('\nSample articles:', JSON.stringify(sample, null, 2));

await db.close();
