# 🚀 Guide de Démarrage - Indices Boursiers en Temps Réel

## Démarrage Rapide

### 1. Démarrer le Backend
```bash
cd server
npm run dev
```

Le serveur démarre sur `http://localhost:8000`

### 2. Démarrer le Frontend
```bash
npm run dev
```

L'application démarre sur `http://localhost:5173`

### 3. Accéder aux Indices
1. Ouvrir l'application dans le navigateur
2. Cliquer sur l'onglet "Marché Boursier" 📈
3. Les 10 indices majeurs s'affichent avec leurs vraies valeurs

## 🧪 Tester l'API

### Test Simple
```bash
curl "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI"
```

### Test Complet (tous les indices)
```bash
curl "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI,^RUT,^VIX,^FCHI,^GDAXI,^FTSE,^N225,000001.SS"
```

### Test avec Formatage JSON
```bash
curl -s "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI" | python3 -m json.tool
```

## 📊 Indices Disponibles

### États-Unis 🇺🇸
- **S&P 500** (^GSPC) - Les 500 plus grandes entreprises américaines
- **NASDAQ** (^IXIC) - Marché technologique américain
- **DOW Jones** (^DJI) - 30 grandes entreprises industrielles américaines
- **Russell 2000** (^RUT) - Petites capitalisations américaines
- **VIX** (^VIX) - Indice de volatilité (peur du marché)

### Europe 🇪🇺
- **CAC 40** (^FCHI) - 40 plus grandes entreprises françaises
- **DAX** (^GDAXI) - 40 plus grandes entreprises allemandes
- **FTSE 100** (^FTSE) - 100 plus grandes entreprises britanniques

### Asie 🌏
- **Nikkei 225** (^N225) - 225 plus grandes entreprises japonaises
- **Shanghai Composite** (000001.SS) - Bourse de Shanghai

## 🔄 Rafraîchissement

- **Automatique**: Les indices se rafraîchissent toutes les 60 secondes
- **WebSocket**: Les mises à jour en temps réel sont diffusées via WebSocket
- **Cache**: Les données sont mises en cache pendant 1 minute côté backend

## 🎨 Interface

Chaque indice affiche:
```
┌─────────────────────────────┐
│ S&P 500                     │
│ 6,816.63                    │
│ ▼ -64.99    -0.94%         │
│ 00:35:03                    │
└─────────────────────────────┘
```

- **Ligne 1**: Nom de l'indice
- **Ligne 2**: Valeur actuelle
- **Ligne 3**: Variation (points et %)
- **Ligne 4**: Heure de dernière mise à jour

## 🐛 Dépannage

### Le backend ne démarre pas
```bash
cd server
npm install
npm run dev
```

### Les indices ne s'affichent pas
1. Vérifier que le backend est démarré: `curl http://localhost:8000/api/health`
2. Vérifier la console du navigateur pour les erreurs
3. Vérifier que le port 8000 n'est pas bloqué

### Erreur "Rate limit exceeded"
Yahoo Finance limite le nombre de requêtes. Attendez quelques minutes avant de réessayer.

### Les valeurs sont à 0
Le backend utilise des valeurs de fallback si Yahoo Finance ne répond pas. Vérifiez votre connexion internet.

## 📝 Fichiers Modifiés

- ✅ `src/hooks/useMarketIndexes.ts` - Hook pour charger les indices
- ✅ `src/components/StockMarket/StockMarketTab.tsx` - Utilise le hook
- ✅ `server/src/stock-market/quote-endpoint.ts` - Endpoint API (existant)
- ✅ `server/src/stock-market/market-data-service.ts` - Service de données (existant)

## 🎯 Fonctionnalités

- ✅ Connexion à Yahoo Finance
- ✅ 10 indices majeurs mondiaux
- ✅ Rafraîchissement automatique (60s)
- ✅ Mises à jour WebSocket en temps réel
- ✅ Gestion des erreurs
- ✅ Cache côté backend (1 min)
- ✅ Interface responsive
- ✅ Animations visuelles

## 🔗 Liens Utiles

- [Yahoo Finance](https://finance.yahoo.com/)
- [Documentation API](server/ARCHITECTURE.md)
- [Guide Complet](INDICES_YAHOO_FINANCE.md)
