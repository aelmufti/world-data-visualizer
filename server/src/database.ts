import { Database } from 'duckdb-async';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/financial_news.duckdb';

let db: Database;

export async function initDatabase() {
  // Créer une nouvelle instance de Database avec await
  db = await Database.create(DB_PATH);
  
  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR PRIMARY KEY,
      ticker VARCHAR UNIQUE NOT NULL,
      name VARCHAR NOT NULL,
      sector VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id VARCHAR PRIMARY KEY,
      title VARCHAR NOT NULL,
      url VARCHAR UNIQUE NOT NULL,
      body TEXT,
      published_at TIMESTAMP NOT NULL,
      ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      source_domain VARCHAR,
      raw_sentiment DOUBLE DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS article_mentions (
      id VARCHAR PRIMARY KEY,
      article_id VARCHAR NOT NULL,
      company_id VARCHAR NOT NULL,
      ticker VARCHAR NOT NULL,
      mention_count INTEGER DEFAULT 1,
      entity_sentiment DOUBLE DEFAULT 0,
      is_primary_subject BOOLEAN DEFAULT FALSE,
      event_tags VARCHAR[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR PRIMARY KEY,
      company_id VARCHAR NOT NULL,
      ticker VARCHAR NOT NULL,
      event_type VARCHAR NOT NULL,
      confidence DOUBLE NOT NULL,
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      article_url VARCHAR,
      article_id VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (article_id) REFERENCES articles(id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id VARCHAR PRIMARY KEY,
      key VARCHAR UNIQUE NOT NULL,
      name VARCHAR NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      rate_limit INTEGER DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_sentiment ON articles(raw_sentiment);
    CREATE INDEX IF NOT EXISTS idx_mentions_article ON article_mentions(article_id);
    CREATE INDEX IF NOT EXISTS idx_mentions_company ON article_mentions(company_id);
    CREATE INDEX IF NOT EXISTS idx_mentions_ticker ON article_mentions(ticker);
    CREATE INDEX IF NOT EXISTS idx_events_company ON events(company_id);
    CREATE INDEX IF NOT EXISTS idx_events_ticker ON events(ticker);
    CREATE INDEX IF NOT EXISTS idx_events_detected ON events(detected_at DESC);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
  `);

  console.log('✅ DuckDB initialized at:', DB_PATH);
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export const collections = {
  companies: 'companies',
  articles: 'articles',
  mentions: 'article_mentions',
  events: 'events',
  apiKeys: 'api_keys',
};
