import { initDatabase, getDatabase, collections } from './database.js';
import { randomUUID, randomBytes } from 'crypto';

async function createApiKey() {
  await initDatabase();
  const db = getDatabase();
  
  const apiKey = 'api_' + randomBytes(32).toString('hex');
  const id = randomUUID();
  
  try {
    await db.run(`
      INSERT INTO ${collections.apiKeys} (id, key, name, is_active, rate_limit)
      VALUES (?, ?, ?, ?, ?)
    `, id, apiKey, 'Pro API Key', true, 300);
    
    console.log('✅ API Key created successfully!');
    console.log('');
    console.log('API Key:', apiKey);
    console.log('ID:', id);
    console.log('');
    console.log('Test with:');
    console.log(`curl -H "X-API-Key: ${apiKey}" http://localhost:8000/articles`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating API key:', error.message);
    process.exit(1);
  }
}

createApiKey();
