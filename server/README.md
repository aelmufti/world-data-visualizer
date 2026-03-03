# Financial News API - Firebase Edition

API de news financières en temps quasi-réel avec Firebase/Firestore.

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env`:
```
PORT=8000
FIREBASE_PROJECT_ID=world-data-visualizer
NEWS_SOURCE_API_URL=https://api.example.com/news
NEWS_SOURCE_API_KEY=your_key
```

## Démarrage

### 1. Seed des entreprises
```bash
npm run build
node dist/seed.js
```

### 2. Lancer l'API
```bash
npm run dev
```

### 3. Lancer le worker (dans un autre terminal)
```bash
npm run worker
```

## Endpoints

- `GET /articles` - Liste des articles avec filtres
- `GET /companies/:ticker/summary` - Résumé pour un ticker
- `GET /events` - Événements détectés
- `GET /trending` - Tickers tendance

Tous les endpoints nécessitent le header `X-API-Key`.

## Structure Firestore

Collections:
- `companies` - Entreprises NYSE/NASDAQ
- `articles` - Articles ingérés
- `article_mentions` - Mentions d'entreprises dans articles
- `events` - Événements détectés
- `api_keys` - Clés API

## NLP Features

- Détection d'entités (entreprises)
- Analyse de sentiment par entité
- Classification de 16 types d'événements financiers
