import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'world-data-visualizer',
  });
}

const db = getFirestore();

// Connect to emulator if running locally
if (process.env.NODE_ENV !== 'production') {
  db.settings({
    host: 'localhost:8080',
    ssl: false,
  });
  console.log('🔧 Using Firestore Emulator');
}

export { db };
export const auth = admin.auth();

export const collections = {
  companies: 'companies',
  articles: 'articles',
  mentions: 'article_mentions',
  events: 'events',
  apiKeys: 'api_keys',
};
