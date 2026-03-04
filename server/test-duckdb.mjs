import Database from 'duckdb-async';

async function test() {
  console.log('🧪 Testing DuckDB connection...\n');

  try {
    const db = await Database.create('./data/financial_news.duckdb');
    
    // Test companies table
    const companies = await db.all('SELECT * FROM companies LIMIT 5');
    console.log('✅ Companies table:', companies.length, 'rows');
    companies.forEach(c => console.log(`   - ${c.ticker}: ${c.name}`));
    
    // Test articles table
    const articles = await db.all('SELECT COUNT(*) as count FROM articles');
    console.log('\n✅ Articles table:', articles[0].count, 'articles');
    
    // Test mentions table
    const mentions = await db.all('SELECT COUNT(*) as count FROM article_mentions');
    console.log('✅ Mentions table:', mentions[0].count, 'mentions');
    
    // Test events table
    const events = await db.all('SELECT COUNT(*) as count FROM events');
    console.log('✅ Events table:', events[0].count, 'events');
    
    // Test API keys table
    const apiKeys = await db.all('SELECT key, name FROM api_keys WHERE is_active = true');
    console.log('\n✅ API Keys:');
    apiKeys.forEach(k => console.log(`   - ${k.name}: ${k.key}`));
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
