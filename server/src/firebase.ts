import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBw3eWwKeytqH8tBW79QnrmAWswj1h3LGo",
  authDomain: "world-data-visualizer.firebaseapp.com",
  projectId: "world-data-visualizer",
  storageBucket: "world-data-visualizer.firebasestorage.app",
  messagingSenderId: "459258221355",
  appId: "1:459258221355:web:19bd5a95499402cbc52b6e"
};

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
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
