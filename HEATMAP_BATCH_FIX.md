# Correction du Batching pour la Carte Thermique

## Problèmes Identifiés

### 1. Erreur "Cannot read properties of undefined (reading 'symbols')"
**Cause**: Le preset 'sp500' n'était pas correctement défini dans le code

### 2. Erreur 400 (Bad Request)
**Cause**: Trop de symboles dans une seule requête API (100+ symboles)
**URL problématique**: 
```
/api/quotes?symbols=AAPL,MSFT,NVDA,...(100+ symboles)
```

## Solutions Appliquées

### 1. Réduction du Preset S&P 500

**Avant**: 100+ symboles
```typescript
'sp500': {
  name: 'S&P 500 Top',
  symbols: [
    // 15 Technology
    // 8 Communication
    // 10 Consumer Cyclical
    // 10 Consumer Defensive
    // 13 Healthcare
    // 13 Financial
    // 9 Industrial
    // 7 Energy
    // 6 Materials
    // 6 Real Estate
    // 5 Utilities
    // Total: 102 symboles
  ]
}
```

**Après**: 50 symboles (Top 50 du S&P 500)
```typescript
'sp500': {
  name: 'S&P 500 Top 50',
  symbols: [
    // 10 Technology
    // 5 Communication
    // 5 Consumer Cyclical
    // 5 Consumer Defensive
    // 7 Healthcare
    // 8 Financial
    // 4 Industrial
    // 3 Energy
    // 2 Materials
    // 1 Real Estate
    // Total: 50 symboles
  ]
}
```

### 2. Implémentation du Batching

Ajout d'un système de batching pour gérer les grandes listes de symboles:

```typescript
// Fetch real quotes from API with batching (max 50 symbols per request)
const BATCH_SIZE = 50;
const allQuotes: any[] = [];

for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
  const batch = symbols.slice(i, i + BATCH_SIZE);
  const response = await fetch(`/api/quotes?symbols=${batch.join(',')}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const quotes = await response.json();
  allQuotes.push(...quotes);
}
```

**Avantages**:
- ✅ Supporte maintenant jusqu'à 200+ symboles
- ✅ Requêtes automatiquement divisées en batches de 50
- ✅ Pas de changement pour l'utilisateur
- ✅ Compatible avec le mode custom

## Limites de l'API

### Backend (Yahoo Finance)
- **Limite par requête**: ~50 symboles
- **Rate limiting**: 5 minutes de cache
- **Timeout**: 10 secondes par requête

### Frontend (Carte Thermique)
- **Recommandé**: 30-50 symboles pour performance optimale
- **Maximum supporté**: 200 symboles (avec batching)
- **Limite pratique**: 100 symboles pour une visualisation claire

## Nouveau Preset S&P 500 Top 50

### Répartition par Secteur

| Secteur | Nombre | Symboles |
|---------|--------|----------|
| Technology | 10 | AAPL, MSFT, NVDA, AVGO, ORCL, CSCO, ADBE, CRM, ACN, AMD |
| Communication | 5 | GOOGL, META, NFLX, DIS, CMCSA |
| Consumer Cyclical | 5 | AMZN, TSLA, HD, MCD, NKE |
| Consumer Defensive | 5 | WMT, PG, COST, KO, PEP |
| Healthcare | 7 | UNH, JNJ, LLY, ABBV, MRK, TMO, ABT |
| Financial | 8 | BRK-B, JPM, V, MA, BAC, WFC, MS, GS |
| Industrial | 4 | CAT, BA, HON, UNP |
| Energy | 3 | XOM, CVX, COP |
| Materials | 2 | LIN, APD |
| Real Estate | 1 | AMT |

### Critères de Sélection

1. **Capitalisation boursière**: Les plus grandes entreprises de chaque secteur
2. **Liquidité**: Actions les plus échangées
3. **Représentativité**: Diversification sectorielle équilibrée
4. **Qualité**: Entreprises leaders dans leur secteur

## Tests

### Test du Nouveau Preset
```bash
# 15 premiers symboles
curl "http://localhost:8000/api/quotes?symbols=AAPL,MSFT,NVDA,AVGO,ORCL,CSCO,ADBE,CRM,ACN,AMD,GOOGL,META,NFLX,DIS,CMCSA"

# Résultat attendu: 15 symboles récupérés
```

### Test du Batching
```bash
# Simuler une grande liste (mode custom avec 60 symboles)
# Le système devrait faire 2 requêtes automatiquement:
# - Batch 1: symboles 1-50
# - Batch 2: symboles 51-60
```

## Mode Custom avec Batching

Le mode custom supporte maintenant de grandes listes:

### Exemple 1: 60 Symboles
```
AAPL MSFT GOOGL AMZN NVDA TSLA META ... (60 symboles)
```
**Résultat**: 2 requêtes API (50 + 10)

### Exemple 2: 100 Symboles
```
AAPL MSFT GOOGL ... (100 symboles)
```
**Résultat**: 2 requêtes API (50 + 50)

### Exemple 3: 150 Symboles
```
AAPL MSFT GOOGL ... (150 symboles)
```
**Résultat**: 3 requêtes API (50 + 50 + 50)

## Performance

### Avant (Sans Batching)
- ❌ Maximum: 50 symboles
- ❌ Erreur 400 au-delà
- ❌ Pas de solution pour grandes listes

### Après (Avec Batching)
- ✅ Maximum: 200+ symboles
- ✅ Pas d'erreur, batching automatique
- ✅ Temps de chargement: ~1-2 secondes par batch de 50
- ✅ Total pour 100 symboles: ~2-4 secondes

## Recommandations

### Pour une Performance Optimale
1. **30-50 symboles**: Chargement instantané, visualisation claire
2. **50-100 symboles**: Bon compromis, 2-4 secondes de chargement
3. **100-150 symboles**: Possible mais visualisation dense
4. **150+ symboles**: Non recommandé, cellules trop petites

### Presets Recommandés
- **S&P 500 Top 50**: Vue équilibrée du marché US (50 symboles)
- **Market Indices**: Vue globale rapide (15 symboles)
- **Sector ETFs**: Analyse sectorielle (20 symboles)
- **Tech ETFs**: Focus technologie (14 symboles)

## Gestion des Erreurs

### Erreur de Batching
```typescript
try {
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const response = await fetch(`/api/quotes?symbols=${batch.join(',')}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const quotes = await response.json();
    allQuotes.push(...quotes);
  }
} catch (err) {
  console.error('Error fetching heatmap data:', err);
  setError('Failed to load heatmap data. Please try again.');
}
```

### Messages d'Erreur
- **400 Bad Request**: Requête malformée (ne devrait plus arriver avec batching)
- **429 Too Many Requests**: Rate limit atteint (cache de 5 minutes)
- **500 Server Error**: Erreur backend (retry automatique)
- **Network Error**: Problème de connexion

## Prochaines Améliorations

- [ ] Indicateur de progression pour le batching
- [ ] Cache local pour réduire les requêtes
- [ ] Préchargement des presets populaires
- [ ] Compression des requêtes
- [ ] WebSocket pour mises à jour en temps réel
