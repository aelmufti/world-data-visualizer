# Système de News en Temps Réel par Secteur

## Vue d'ensemble

Le système de news en temps réel affiche les 5 articles les plus importants des dernières 48 heures **pour chaque secteur** avec des mises à jour automatiques et des notifications pour les breaking news.

## Architecture

### Backend (Server)

#### 1. RSS Worker (`server/src/rss-worker-duckdb.ts`)
- Récupère les articles de 20 sources RSS toutes les minutes
- Traite et analyse chaque article (NLP, sentiment, détection d'entreprises)
- Stocke les articles dans DuckDB
- Intégré dans le processus principal du serveur (pas de processus séparé)

#### 2. News WebSocket Server (`server/src/news-websocket-server.ts`)
- WebSocket sur `ws://localhost:8000/news-updates`
- Met à jour les top 5 articles **par secteur** toutes les 30 secondes
- Gère les souscriptions par secteur (clients peuvent s'abonner à un secteur spécifique)
- Calcule les scores basés sur:
  - Pertinence sectorielle (60%) - utilise les mots-clés du secteur
  - Importance des événements (30%)
  - Sentiment (10%)
  - Décroissance temporelle (facteur exponentiel)
- Détecte les breaking news (nouveaux articles dans le top 5 du secteur)
- Broadcast les mises à jour uniquement aux clients abonnés au secteur

#### 3. Scoring Algorithm
```typescript
// Relevance score basé sur les mots-clés du secteur
relevanceScore = scoreSectorRelevance(title, body, sector)

// Score de base
baseScore = (relevanceScore * 0.6) + (importanceScore * 0.3) + (sentimentScore * 0.1)

// Décroissance temporelle
ageInHours = (now - publishedAt) / 3600000
decayFactor = exp(-0.15 * ageInHours)
finalScore = baseScore * decayFactor
```

### Frontend (Client)

#### TopNewsPanel Component (`src/components/TopNewsPanel.tsx`)
- Connexion WebSocket automatique avec reconnexion
- Souscription automatique au secteur actif
- Changement de souscription lors du changement de secteur
- Affichage des top 5 articles avec badges de classement (🥇🥈🥉)
- Notifications navigateur pour breaking news du secteur
- Indicateur de connexion en temps réel (LIVE/DÉCONNECTÉ)
- Mise à jour automatique sans rechargement de page

## Fonctionnalités

### 1. Top 5 Articles par Secteur (48h)
- Classement par score final spécifique au secteur
- Badges visuels (🥇🥈🥉4️⃣5️⃣)
- Scores de pertinence et importance
- Sentiment coloré (positif/négatif/neutre)
- Entreprises et événements associés
- Horodatage de publication
- **Change automatiquement quand l'utilisateur change de secteur**

### 2. Mises à jour en Temps Réel
- WebSocket avec reconnexion automatique
- Mise à jour toutes les 30 secondes pour tous les secteurs
- Souscription par secteur (reçoit uniquement les mises à jour du secteur actif)
- Indicateur de statut de connexion
- Pas de rechargement de page nécessaire

### 3. Notifications Breaking News
- Détection automatique des nouveaux articles dans le top 5 du secteur
- Notification navigateur native
- Notification in-app avec animation
- Auto-dismiss après 10 secondes
- Demande de permission au premier chargement
- **Notifications uniquement pour le secteur actif**

## Secteurs Supportés

Le système supporte 10 secteurs avec leurs propres mots-clés:
- **Technology** (tech) - AI, software, cloud, semiconductors, etc.
- **Finance** (finance) - banking, investment, trading, crypto, etc.
- **Healthcare** (sante) - pharma, biotech, medical devices, etc.
- **Energy** (energie) - oil, gas, renewable, solar, wind, etc.
- **Consumer** (consommation) - retail, e-commerce, brands, etc.
- **Industrial** (industrie) - manufacturing, aerospace, defense, etc.
- **Materials** (materiaux) - mining, metals, chemicals, etc.
- **Real Estate** (immobilier) - property, construction, REITs, etc.
- **Utilities** (services) - electricity, water, infrastructure, etc.
- **Telecom** (telecom) - wireless, 5G, broadband, etc.

## Configuration

### Activer les Notifications
1. Cliquez sur le bandeau bleu "Cliquez pour activer les notifications"
2. Acceptez la permission dans le navigateur
3. Les notifications apparaîtront automatiquement pour les breaking news du secteur actif

### Paramètres de Mise à Jour
- Intervalle de mise à jour: 30 secondes (configurable dans `news-websocket-server.ts`)
- Fenêtre temporelle: 48 heures
- Nombre d'articles: Top 5 par secteur

## Sources RSS

Le système agrège 20 sources d'actualités financières:
- Yahoo Finance, MarketWatch, Seeking Alpha
- CNBC, Financial Times, Wall Street Journal
- TechCrunch, The Verge, Ars Technica
- BioPharma Dive, FiercePharma
- Oil Price, Renewable Energy World
- Et plus...

## Événements Importants

Le système détecte et score ces types d'événements:
- Résultats financiers (earnings beat/miss) - 8/10
- Fusions & acquisitions - 10/10
- Actions réglementaires - 9/10
- Contrats gouvernementaux - 7/10
- Licenciements - 7/10
- Changements de direction - 5/10
- Lancements de produits - 6/10
- Et plus...

## API WebSocket

### Messages du Client

#### Subscribe to Sector
```json
{
  "type": "subscribe",
  "sector": "energy"
}
```

#### Unsubscribe
```json
{
  "type": "unsubscribe"
}
```

#### Ping
```json
{
  "type": "ping"
}
```

### Messages du Serveur

#### Top News Update (pour le secteur souscrit)
```json
{
  "type": "top_news",
  "data": {
    "sector": "energy",
    "articles": [...],
    "lastUpdate": "2026-03-04T01:50:00.000Z"
  }
}
```

#### Breaking News (pour le secteur souscrit)
```json
{
  "type": "breaking_news",
  "data": {
    "sector": "energy",
    "articles": [...],
    "timestamp": "2026-03-04T01:50:00.000Z"
  }
}
```

## Dépannage

### Pas de connexion WebSocket
- Vérifier que le serveur est démarré sur le port 8000
- Vérifier les logs du serveur pour "📰 News WebSocket server initialized"
- Vérifier la console du navigateur pour les erreurs de connexion

### Pas de notifications
- Vérifier que les permissions sont accordées dans le navigateur
- Vérifier que le site est en HTTPS (ou localhost)
- Vérifier les paramètres de notification du système d'exploitation

### Articles non mis à jour
- Vérifier que le RSS worker fonctionne (logs "📰 Fetched X articles")
- Vérifier la base de données DuckDB
- Vérifier les logs "📰 Breaking news in [sector]"
- Vérifier que le client est bien souscrit au secteur (logs "📰 Client subscribed to sector: [sector]")

### Articles non pertinents pour le secteur
- Le système utilise les mots-clés définis dans `aggregator-duckdb.ts`
- Les articles doivent avoir un score de pertinence >= 1.0 pour être inclus
- Vérifier les mots-clés du secteur dans `SECTOR_KEYWORDS`

## Performance

- Connexion WebSocket légère (< 1KB par mise à jour)
- Pas de polling HTTP
- Reconnexion automatique en cas de déconnexion
- Mise en cache côté serveur des scores calculés par secteur
- Broadcast ciblé (uniquement aux clients abonnés au secteur)


## Architecture

### Backend (Server)

#### 1. RSS Worker (`server/src/rss-worker-duckdb.ts`)
- Récupère les articles de 20 sources RSS toutes les minutes
- Traite et analyse chaque article (NLP, sentiment, détection d'entreprises)
- Stocke les articles dans DuckDB
- Intégré dans le processus principal du serveur (pas de processus séparé)

#### 2. News WebSocket Server (`server/src/news-websocket-server.ts`)
- WebSocket sur `ws://localhost:8000/news-updates`
- Met à jour les top 5 articles toutes les 30 secondes
- Calcule les scores basés sur:
  - Importance des événements (30%)
  - Pertinence (60%)
  - Sentiment (10%)
  - Décroissance temporelle (facteur exponentiel)
- Détecte les breaking news (nouveaux articles dans le top 5)
- Broadcast les mises à jour à tous les clients connectés

#### 3. Scoring Algorithm
```typescript
baseScore = (relevanceScore * 0.6) + (importanceScore * 0.3) + (sentimentScore * 0.1)
ageInHours = (now - publishedAt) / 3600000
decayFactor = exp(-0.15 * ageInHours)
finalScore = baseScore * decayFactor
```

### Frontend (Client)

#### TopNewsPanel Component (`src/components/TopNewsPanel.tsx`)
- Connexion WebSocket automatique avec reconnexion
- Affichage des top 5 articles avec badges de classement (🥇🥈🥉)
- Notifications navigateur pour breaking news
- Indicateur de connexion en temps réel (LIVE/DÉCONNECTÉ)
- Mise à jour automatique sans rechargement de page

## Fonctionnalités

### 1. Top 5 Articles (48h)
- Classement par score final
- Badges visuels (🥇🥈🥉4️⃣5️⃣)
- Scores de pertinence et importance
- Sentiment coloré (positif/négatif/neutre)
- Entreprises et événements associés
- Horodatage de publication

### 2. Mises à jour en Temps Réel
- WebSocket avec reconnexion automatique
- Mise à jour toutes les 30 secondes
- Indicateur de statut de connexion
- Pas de rechargement de page nécessaire

### 3. Notifications Breaking News
- Détection automatique des nouveaux articles dans le top 5
- Notification navigateur native
- Notification in-app avec animation
- Auto-dismiss après 10 secondes
- Demande de permission au premier chargement

## Configuration

### Activer les Notifications
1. Cliquez sur le bandeau bleu "Cliquez pour activer les notifications"
2. Acceptez la permission dans le navigateur
3. Les notifications apparaîtront automatiquement pour les breaking news

### Paramètres de Mise à Jour
- Intervalle de mise à jour: 30 secondes (configurable dans `news-websocket-server.ts`)
- Fenêtre temporelle: 48 heures
- Nombre d'articles: Top 5

## Sources RSS

Le système agrège 20 sources d'actualités financières:
- Yahoo Finance, MarketWatch, Seeking Alpha
- CNBC, Financial Times, Wall Street Journal
- TechCrunch, The Verge, Ars Technica
- BioPharma Dive, FiercePharma
- Oil Price, Renewable Energy World
- Et plus...

## Événements Importants

Le système détecte et score ces types d'événements:
- Résultats financiers (earnings beat/miss) - 8/10
- Fusions & acquisitions - 10/10
- Actions réglementaires - 9/10
- Contrats gouvernementaux - 7/10
- Licenciements - 7/10
- Changements de direction - 5/10
- Lancements de produits - 6/10
- Et plus...

## API WebSocket

### Messages du Serveur

#### Top News Update
```json
{
  "type": "top_news",
  "data": {
    "articles": [...],
    "lastUpdate": "2026-03-04T01:50:00.000Z"
  }
}
```

#### Breaking News
```json
{
  "type": "breaking_news",
  "data": {
    "articles": [...],
    "timestamp": "2026-03-04T01:50:00.000Z"
  }
}
```

### Messages du Client

#### Ping
```json
{
  "type": "ping"
}
```

#### Request Update
```json
{
  "type": "request_update"
}
```

## Dépannage

### Pas de connexion WebSocket
- Vérifier que le serveur est démarré sur le port 8000
- Vérifier les logs du serveur pour "📰 News WebSocket server initialized"
- Vérifier la console du navigateur pour les erreurs de connexion

### Pas de notifications
- Vérifier que les permissions sont accordées dans le navigateur
- Vérifier que le site est en HTTPS (ou localhost)
- Vérifier les paramètres de notification du système d'exploitation

### Articles non mis à jour
- Vérifier que le RSS worker fonctionne (logs "📰 Fetched X articles")
- Vérifier la base de données DuckDB
- Vérifier les logs "📰 Updated top news"

## Performance

- Connexion WebSocket légère (< 1KB par mise à jour)
- Pas de polling HTTP
- Reconnexion automatique en cas de déconnexion
- Mise en cache côté serveur des scores calculés
