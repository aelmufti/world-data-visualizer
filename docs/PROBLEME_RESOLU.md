# ✅ Problème Résolu : Database Initialization

## Problème

Le serveur affichait des erreurs au démarrage :
```
Error updating top news for sector technology: Error: Database not initialized. Call initDatabase() first.
```

## Cause

Les WebSocket servers (`StockWebSocketServer` et `NewsWebSocketServer`) étaient initialisés dans `server.listen()`, qui s'exécute de manière synchrone, **avant** que `initDatabase()` (qui est asynchrone) ne soit terminé.

**Ordre d'exécution incorrect :**
1. `server.listen()` démarre (synchrone)
2. WebSocket servers s'initialisent
3. WebSocket servers essaient d'accéder à la DB
4. ❌ Erreur : DB pas encore initialisée
5. `initDatabase()` se termine (async)

## Solution

Déplacer l'initialisation des WebSocket servers **dans** le callback de `initDatabase()`, après que la base de données soit prête.

**Ordre d'exécution correct :**
1. `server.listen()` démarre
2. `initDatabase()` s'exécute (async)
3. ✅ Database initialisée
4. Congress tracker initialisé
5. WebSocket servers initialisés
6. RSS worker démarré

## Changements Effectués

### Fichier : `server/src/index.ts`

**Avant :**
```typescript
server.listen(PORT, () => {
  console.log(`🚀 Financial News API running on port ${PORT}`);
  
  // ❌ Initialisé trop tôt
  stockWsServer = new StockWebSocketServer(server, '/stock-prices');
  newsWsServer = new NewsWebSocketServer(server, '/news-updates');
});

initDatabase().then(async (database) => {
  db = database;
  // ...
});
```

**Après :**
```typescript
server.listen(PORT, () => {
  console.log(`🚀 Financial News API running on port ${PORT}`);
  // Pas d'initialisation ici
});

initDatabase().then(async (database) => {
  db = database;
  console.log('✅ Database initialized');
  
  // Initialize Congress tracker
  await congressPipeline.initialize();
  await congressPoller.start();
  
  // ✅ Initialisé après la DB
  stockWsServer = new StockWebSocketServer(server, '/stock-prices');
  newsWsServer = new NewsWebSocketServer(server, '/news-updates');
  
  // Start RSS worker
  rssWorker = new RSSWorker();
  rssWorker.run();
});
```

## Vérification

### Logs de Démarrage (Correct)
```
🚀 Financial News API running on port 8000
✅ DuckDB initialized at: ./data/financial_news.duckdb
✅ Database initialized
✅ Congress tracker tables initialized
✅ Congress tracker pipeline initialized
🗳️  Starting Congress trade poller (60 min interval)
📈 Stock Market WebSocket server initialized on ws://localhost:8000/stock-prices
📰 News WebSocket server initialized on ws://localhost:8000/news-updates
📰 Breaking news in technology: 5 articles
📰 Breaking news in finance: 5 articles
...
```

### Health Check
```bash
curl http://localhost:8000/api/health
```

**Résultat :**
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "websocket": "running",
    "newsWebsocket": "running",
    "rssWorker": "running",
    "congressTracker": "running"
  }
}
```

## Impact

✅ Plus d'erreurs "Database not initialized"
✅ Tous les services démarrent dans le bon ordre
✅ WebSocket servers fonctionnent correctement
✅ News aggregation fonctionne
✅ Congress tracker opérationnel

## Services Opérationnels

1. **Database** - DuckDB initialisé
2. **Congress Tracker** - Polling actif (60 min)
3. **Stock WebSocket** - ws://localhost:8000/stock-prices
4. **News WebSocket** - ws://localhost:8000/news-updates
5. **RSS Worker** - 20 feeds surveillés
6. **API REST** - Tous les endpoints disponibles

## Commandes de Vérification

```bash
# Health check
curl http://localhost:8000/api/health

# Congress tracker status
curl http://localhost:8000/api/congress/status

# Frontend
open http://localhost:5173/congress-tracker
```

---

**Statut :** ✅ Résolu et vérifié
**Date :** 4 mars 2026
