import { initDatabase, getDatabase, collections } from './database.js';
import { randomUUID } from 'crypto';

async function seed() {
  await initDatabase();
  const db = getDatabase();

  console.log('🌱 Seeding database...');

  // Sample companies
  const companies = [
    { ticker: 'AAPL', name: 'Apple Inc.', sector: 'technology' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'technology' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'technology' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'consumer' },
    { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'consumer' },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'technology' },
    { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'technology' },
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'finance' },
    { ticker: 'V', name: 'Visa Inc.', sector: 'finance' },
    { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'healthcare' },
    { ticker: 'PFE', name: 'Pfizer Inc.', sector: 'healthcare' },
    { ticker: 'XOM', name: 'Exxon Mobil Corporation', sector: 'energy' },
    { ticker: 'CVX', name: 'Chevron Corporation', sector: 'energy' },
    { ticker: 'WMT', name: 'Walmart Inc.', sector: 'consumer' },
    { ticker: 'BA', name: 'The Boeing Company', sector: 'industrial' },
  ];

  for (const company of companies) {
    const id = randomUUID();
    await db.run(`
      INSERT INTO ${collections.companies} (id, ticker, name, sector)
      VALUES (?, ?, ?, ?)
    `, id, company.ticker, company.name, company.sector);
    console.log(`✅ Added ${company.ticker} - ${company.name}`);
  }

  // Create a default API key
  const apiKeyId = randomUUID();
  const apiKey = 'dev_' + randomUUID().replace(/-/g, '');
  
  await db.run(`
    INSERT INTO ${collections.apiKeys} (id, key, name, is_active, rate_limit)
    VALUES (?, ?, ?, ?, ?)
  `, apiKeyId, apiKey, 'Development Key', true, 1000);

  console.log('\n🔑 API Key created:');
  console.log(`   ${apiKey}`);
  console.log('\n✅ Database seeded successfully!');
  
  process.exit(0);
}

seed().catch(error => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
