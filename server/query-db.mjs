#!/usr/bin/env node
import Database from 'duckdb-async';

const DB_PATH = './data/financial_news.duckdb';

async function main() {
  const query = process.argv[2];
  
  if (!query) {
    console.log('Usage: node query-db.mjs "SELECT * FROM articles LIMIT 5"');
    console.log('\nCommon queries:');
    console.log('  node query-db.mjs "SELECT COUNT(*) as count FROM articles"');
    console.log('  node query-db.mjs "SELECT * FROM companies LIMIT 10"');
    console.log('  node query-db.mjs "SELECT title, published_at FROM articles ORDER BY published_at DESC LIMIT 10"');
    process.exit(1);
  }

  try {
    const db = await Database.create(DB_PATH);
    const results = await db.all(query);
    console.log(JSON.stringify(results, null, 2));
    await db.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nNote: Make sure the server is stopped before running queries.');
    console.error('DuckDB only allows one process to access the database at a time.');
    process.exit(1);
  }
}

main();
