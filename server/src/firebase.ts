import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'world-data-visualizer',
  });
} catch (error: any) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Firebase initialization error:', error.message);
  }
}

const db = getFirestore();

// Use emulator if FIRESTORE_EMULATOR_HOST is set or in development
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.NODE_ENV !== 'production') {
  db.settings({
    host: 'localhost:8080',
    ssl: false,
  });
  console.log('🔧 Using Firestore Emulator at localhost:8080');
}

export { db };
export const auth = admin.auth();

// Collections
export const collections = {
  companies: 'companies',
  articles: 'articles',
  mentions: 'article_mentions',
  events: 'events',
  apiKeys: 'api_keys',
};
