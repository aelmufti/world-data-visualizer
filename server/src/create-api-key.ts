import { db, collections } from './firebase.js';
import crypto from 'crypto';

async function createApiKey() {
  const apiKey = crypto.randomBytes(32).toString('hex');
  
  const keyData = {
    key: apiKey,
    plan: 'pro',
    rateLimit: 300,
    maxWebsockets: 20,
    createdAt: new Date(),
    isActive: true,
  };

  try {
    const docRef = await db.collection(collections.apiKeys).add(keyData);
    console.log('✅ API Key created successfully!');
    console.log('');
    console.log('API Key:', apiKey);
    console.log('Document ID:', docRef.id);
    console.log('');
    console.log('Test with:');
    console.log(`curl -H "X-API-Key: ${apiKey}" http://localhost:8000/articles`);
  } catch (error: any) {
    console.error('❌ Error creating API key:', error.message);
  }
}

createApiKey();
