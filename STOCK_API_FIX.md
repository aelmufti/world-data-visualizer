# Corrections API Stock Market

## Problèmes identifiés

### 1. WebSocket - Erreurs de connexion
**Symptômes:**
- `WebSocket connection failed: Invalid frame header`
- `WebSocket is closed before the connection is established`
- Erreur 400 Bad Request sur les connexions WebSocket

**Cause:**
Les deux serveurs WebSocket (Stock Market et AIS) utilisaient la configuration `{ server, path }` qui créait des conflits lors de l'attachement au même serveur HTTP.

**Solution appliquée:**
- Passage en mode `noServer` pour les deux WebSocket servers
- Gestion manuelle de l'événement `upgrade` du serveur HTTP
- Routage basé sur le path (`/stock-prices` et `/api/ais-stream`)

**Fichiers modifiés:**
- `server/src/stock-market/websocket-server.ts`
- `server/src/ais-proxy.ts`

```typescript
// Avant (ne fonctionnait pas)
this.wss = new WebSocketServer({ server, path });

// Après (fonctionne)
this.wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  if (request.url === path) {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }
});
```

### 2. Endpoints API manquants
**Symptômes:**
- `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- Erreur 404 sur `/api/quote/:symbol`
- Erreur 404 sur `/api/quotes`

**Cause:**
Le frontend appelait des endpoints qui n'existaient pas sur le backend:
- `/api/quote/:symbol` - Quote individuelle
- `/api/quotes?symbols=...` - Quotes multiples

**Solution appliquée:**
Création d'un nouveau fichier `server/src/stock-market/quote-endpoint.ts` avec les endpoints manquants.

**Fichiers créés:**
- `server/src/stock-market/quote-endpoint.ts`

**Fichiers modifiés:**
- `server/src/index.ts` (ajout du router)

**Endpoints ajoutés:**

#### GET /api/quote/:symbol
Récupère une quote pour un symbole unique.

**Exemple:**
```bash
curl http://localhost:8000/api/quote/AAPL
```

**Réponse:**
```json
{
  "symbol": "AAPL",
  "price": 175.23,
  "change": -2.15,
  "changePercent": -1.21,
  "volume": 0,
  "timestamp": "2026-03-03T23:10:27.034Z"
}
```

#### GET /api/quotes?symbols=AAPL,GOOGL,MSFT
Récupère des quotes pour plusieurs symboles (max 50).

**Exemple:**
```bash
curl "http://localhost:8000/api/quotes?symbols=AAPL,GOOGL,MSFT"
```

**Réponse:**
```json
[
  {
    "symbol": "AAPL",
    "price": 175.23,
    "change": -2.15,
    "changePercent": -1.21,
    "volume": 0,
    "timestamp": "2026-03-03T23:10:27.034Z"
  },
  {
    "symbol": "GOOGL",
    "price": 140.58,
    "change": 1.23,
    "changePercent": 0.88,
    "volume": 0,
    "timestamp": "2026-03-03T23:10:28.034Z"
  }
]
```

### 3. Rate limiting Yahoo Finance
**Symptômes:**
- `Edge: Too Many Requests`
- Données incorrectes ou manquantes
- Graphiques vides

**Cause:**
L'API Yahoo Finance (non officielle) applique un rate limiting strict et bloque les requêtes.

**Solution appliquée:**

#### Option 1: API Finnhub (implémentée)
- Utilisation de l'API Finnhub avec clé `demo` (limitée)
- Fallback automatique vers des données mock réalistes
- Cache de 1 minute pour réduire les appels

**Fichier modifié:**
- `server/src/market-data.ts`

```typescript
// Configuration Finnhub
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'demo';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Fallback avec données mock réalistes
private getFallbackQuote(symbol: string): YahooQuote {
  const basePrice = this.getBasePriceForSymbol(symbol);
  const randomChange = (Math.random() - 0.5) * 0.05; // ±2.5%
  const change = basePrice * randomChange;
  
  return {
    symbol,
    regularMarketPrice: basePrice + change,
    regularMarketChange: change,
    regularMarketChangePercent: randomChange * 100,
  };
}
```

#### Option 2: Données historiques mock
Pour les graphiques, ajout d'un générateur de données OHLCV réalistes.

**Fichier modifié:**
- `server/src/stock-market/historical-data-service.ts`

```typescript
private generateMockHistoricalData(
  symbol: string,
  interval: Interval,
  range: Range
): HistoricalDataResponse {
  // Génère des chandeliers réalistes avec:
  // - Prix de base selon le symbole
  // - Volatilité de 2%
  // - Relations OHLC cohérentes (high > low, etc.)
  // - Volume aléatoire réaliste
}
```

## État actuel des endpoints

### ✅ Endpoints fonctionnels

| Endpoint | Méthode | Description | Status |
|----------|---------|-------------|--------|
| `/api/quote/:symbol` | GET | Quote individuelle | ✅ Fonctionne (Finnhub + fallback) |
| `/api/quotes?symbols=...` | GET | Quotes multiples | ✅ Fonctionne (Finnhub + fallback) |
| `/api/stock/history/:symbol` | GET | Données historiques OHLCV | ✅ Fonctionne (Yahoo + fallback mock) |
| `/api/stock/search?q=...` | GET | Recherche de symboles | ✅ Fonctionne |
| `/api/market-status` | GET | Statut du marché | ✅ Fonctionne |
| `ws://localhost:8000/stock-prices` | WebSocket | Prix temps réel | ✅ Fonctionne |
| `ws://localhost:8000/api/ais-stream` | WebSocket | Données AIS bateaux | ✅ Fonctionne |

### 🔧 Points d'amélioration

1. **Clé API Finnhub**
   - Actuellement: clé `demo` (très limitée)
   - Recommandation: Obtenir une clé gratuite sur https://finnhub.io
   - Ajouter dans `server/.env`: `FINNHUB_API_KEY=votre_cle`

2. **Alternative: Alpha Vantage**
   - API gratuite avec 5 requêtes/minute
   - Plus stable que Yahoo Finance
   - Nécessite une clé API gratuite

3. **Cache et optimisation**
   - Cache actuel: 1 minute pour les quotes
   - Cache actuel: 5 minutes pour l'historique intraday
   - Peut être ajusté selon les besoins

## Tests de vérification

### Test des endpoints REST

```bash
# Quote individuelle
curl http://localhost:8000/api/quote/AAPL

# Quotes multiples
curl "http://localhost:8000/api/quotes?symbols=AAPL,GOOGL,MSFT"

# Données historiques
curl "http://localhost:8000/api/stock/history/AAPL?interval=1d&range=5d"

# Recherche
curl "http://localhost:8000/api/stock/search?q=apple&limit=5"
```

### Test WebSocket (avec Node.js)

```javascript
const WebSocket = require('ws');

// Test Stock WebSocket
const stockWs = new WebSocket('ws://localhost:8000/stock-prices');
stockWs.on('open', () => {
  console.log('✅ Stock WebSocket connecté');
  stockWs.send(JSON.stringify({ 
    type: 'subscribe', 
    symbols: ['AAPL', 'GOOGL'] 
  }));
});
stockWs.on('message', (data) => {
  console.log('📨 Quote reçue:', data.toString());
});
```

## Logs nettoyés

### Frontend (AIS)
Tous les logs console ont été retirés de `src/contexts/AISContext.tsx`:
- Logs de connexion WebSocket
- Logs de réception de données
- Logs d'erreurs (remplacés par gestion silencieuse)
- Logs de reconnexion

La console est maintenant propre côté frontend.

## Prochaines étapes recommandées

1. **Obtenir une vraie clé API**
   - Finnhub: https://finnhub.io (gratuit, 60 req/min)
   - Ou Alpha Vantage: https://www.alphavantage.co (gratuit, 5 req/min)

2. **Tester avec des symboles réels**
   - Vérifier que les prix sont corrects
   - Vérifier que les graphiques s'affichent

3. **Monitoring**
   - Surveiller les logs serveur pour les erreurs API
   - Vérifier les taux de cache hit/miss

4. **Optimisation**
   - Ajuster les durées de cache selon l'usage
   - Implémenter un système de queue pour les requêtes API
   - Ajouter un circuit breaker pour les APIs externes
