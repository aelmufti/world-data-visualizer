import axios from 'axios';
import { db, collections } from './firebase.js';

const NASDAQ_URL = 'https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt';

async function seedCompanies() {
  console.log('📥 Fetching NASDAQ companies...');

  try {
    const response = await axios.get(NASDAQ_URL);
    const lines = response.data.split('\n');
    const headers = lines[0].split('|');

    const companies = [];

    for (let i = 1; i < lines.length - 1; i++) {
      const values = lines[i].split('|');
      if (values[3] === 'Y') continue; // Skip test issues

      const ticker = values[0]?.trim();
      const name = values[1]?.trim();
      const exchange = values[2]?.trim();

      if (!ticker || !name) continue;

      const exchangeMap: Record<string, string> = {
        Q: 'NASDAQ',
        N: 'NYSE',
        A: 'NYSE',
        P: 'NYSE',
        Z: 'BATS',
      };

      const aliases = [];
      if (name.includes(' Inc')) aliases.push(name.replace(' Inc', ''));
      if (name.includes(' Corp')) aliases.push(name.replace(' Corp', ''));
      if (name.includes(',')) aliases.push(name.split(',')[0]);

      companies.push({
        ticker,
        officialName: name,
        aliases: [...new Set(aliases)],
        exchange: exchangeMap[exchange] || 'OTHER',
        sector: null,
        createdAt: new Date(),
      });
    }

    console.log(`📊 Found ${companies.length} companies`);

    // Save to Firestore
    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const company of companies) {
      // Check if exists
      const existing = await db.collection(collections.companies)
        .where('ticker', '==', company.ticker)
        .limit(1)
        .get();

      if (!existing.empty) {
        continue;
      }

      const ref = db.collection(collections.companies).doc();
      batch.set(ref, company);
      count++;
      batchCount++;

      // Commit in batches of 500
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`✅ Saved ${count} companies...`);
        batch = db.batch(); // Create new batch
        batchCount = 0;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`✅ Successfully seeded ${count} new companies`);
  } catch (error: any) {
    console.error('❌ Error seeding companies:', error.message);
  }
}

seedCompanies();
