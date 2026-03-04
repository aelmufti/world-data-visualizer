import { Database } from 'duckdb-async';

async function check() {
  try {
    const db = await Database.create('./data/financial_news.duckdb');
    
    const articles = await db.all('SELECT COUNT(*) as count FROM articles');
    console.log('Articles:', articles[0].count);
    
    const companies = await db.all('SELECT COUNT(*) as count FROM companies');
    console.log('Companies:', companies[0].count);
    
    await db.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
