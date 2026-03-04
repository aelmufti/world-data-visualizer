# Carte Thermique Hiérarchique (Style Finviz)

## Vue d'Ensemble

La carte thermique a été transformée en une visualisation hiérarchique à deux niveaux, inspirée de Finviz.com:

1. **Niveau 1 - Secteurs**: Groupes visuels avec bordures colorées et labels
2. **Niveau 2 - Actions**: Cellules individuelles colorées par performance

## Structure Hiérarchique

```
Market (Root)
├── Technology
│   ├── AAPL (+2.5%)
│   ├── MSFT (+1.8%)
│   ├── NVDA (+5.7%)
│   └── ...
├── Healthcare
│   ├── UNH (+1.9%)
│   ├── JNJ (-0.3%)
│   └── ...
├── Financial
│   ├── JPM (+0.8%)
│   ├── V (+1.2%)
│   └── ...
└── ...
```

## Secteurs Disponibles

### 11 Secteurs GICS (Global Industry Classification Standard)

1. **Technology** - Technologie de l'information
2. **Communication** - Services de communication
3. **Consumer Cyclical** - Consommation cyclique
4. **Consumer Defensive** - Consommation défensive
5. **Healthcare** - Santé
6. **Financial** - Services financiers
7. **Industrial** - Industrie
8. **Energy** - Énergie
9. **Materials** - Matériaux
10. **Real Estate** - Immobilier
11. **Utilities** - Services publics

### Catégories Spéciales

- **Index** - Indices boursiers
- **ETF** - Fonds négociés en bourse
- **Crypto** - Cryptomonnaies et actifs numériques
- **Commodity ETF** - ETFs de matières premières
- **Tech ETF** - ETFs technologiques

## Visualisation

### Couleurs des Secteurs (Bordures)

| Secteur | Couleur | Code |
|---------|---------|------|
| Technology | Bleu | #3b82f6 |
| Communication | Bleu-vert | #06b6d4 |
| Consumer Cyclical | Violet | #8b5cf6 |
| Consumer Defensive | Violet foncé | #6366f1 |
| Healthcare | Rouge | #ef4444 |
| Financial | Vert | #10b981 |
| Industrial | Indigo | #6366f1 |
| Energy | Orange | #f59e0b |
| Materials | Jaune | #eab308 |
| Real Estate | Rose | #ec4899 |
| Utilities | Cyan | #06b6d4 |

### Couleurs des Actions (Remplissage)

Échelle de performance basée sur le changement en pourcentage:

- **Rouge foncé** (-5% ou moins): #dc2626
- **Gris** (0%): #374151
- **Vert foncé** (+5% ou plus): #16a34a
- **Dégradé** entre ces valeurs

## Preset S&P 500 Top

Le nouveau preset par défaut contient ~120 actions du S&P 500, réparties par secteur:

### Technology (15 actions)
AAPL, MSFT, NVDA, AVGO, ORCL, CSCO, ADBE, CRM, ACN, AMD, IBM, INTC, QCOM, TXN, AMAT

### Communication (8 actions)
GOOGL, META, NFLX, DIS, CMCSA, T, VZ, TMUS

### Consumer Cyclical (10 actions)
AMZN, TSLA, HD, MCD, NKE, SBUX, TGT, LOW, TJX, BKNG

### Consumer Defensive (10 actions)
WMT, PG, COST, KO, PEP, PM, MO, MDLZ, CL, KMB

### Healthcare (13 actions)
UNH, JNJ, LLY, ABBV, MRK, TMO, ABT, DHR, PFE, BMY, AMGN, GILD, CVS

### Financial (13 actions)
BRK-B, JPM, V, MA, BAC, WFC, MS, GS, SPGI, BLK, C, AXP, SCHW

### Industrial (9 actions)
CAT, BA, HON, UNP, RTX, LMT, DE, UPS, GE

### Energy (7 actions)
XOM, CVX, COP, SLB, EOG, MPC, PSX

### Materials (6 actions)
LIN, APD, SHW, FCX, NEM, DOW

### Real Estate (6 actions)
AMT, PLD, CCI, EQIX, PSA, SPG

### Utilities (5 actions)
NEE, DUK, SO, D, AEP

## Améliorations par Rapport à la Version Précédente

### Avant (Version Plate)
- ❌ Toutes les actions au même niveau
- ❌ Pas de groupement visuel
- ❌ Difficile de comparer les secteurs
- ❌ 32 actions maximum

### Après (Version Hiérarchique)
- ✅ Groupement par secteur avec bordures colorées
- ✅ Labels de secteur visibles
- ✅ Comparaison facile entre secteurs
- ✅ 120+ actions dans le preset S&P 500
- ✅ Structure claire et organisée
- ✅ Style professionnel type Finviz

## Fonctionnalités Conservées

- ✅ Données en temps réel via API
- ✅ Mises à jour WebSocket
- ✅ Tooltip au survol
- ✅ Clic pour détails
- ✅ Presets multiples
- ✅ Mode custom
- ✅ Filtre par secteur

## Algorithme de Détection de Secteur

### 1. Détection par Pattern

```typescript
// Indices
if (symbol.startsWith('^')) return 'Index';

// Crypto
if (symbol.endsWith('-USD')) return 'Crypto';

// ETFs
if (symbol.startsWith('XL')) return 'ETF';
```

### 2. Mapping Manuel

Plus de 100 symboles mappés manuellement vers leur secteur GICS correct:

```typescript
const stockSectors = {
  'AAPL': 'Technology',
  'JPM': 'Financial',
  'UNH': 'Healthcare',
  // ... 100+ mappings
};
```

### 3. Fallback

Si aucune correspondance: `'Other'`

## Layout D3.js

### Configuration Treemap

```typescript
const treemap = d3.treemap()
  .size([width, height])
  .paddingOuter(4)      // Espace autour de la carte
  .paddingTop(20)       // Espace pour le label du secteur
  .paddingInner(2)      // Espace entre les cellules
  .round(true);         // Arrondir les positions
```

### Hiérarchie

```typescript
const hierarchyData = {
  name: 'Market',
  children: [
    {
      name: 'Technology',
      children: [
        { symbol: 'AAPL', marketCap: 3000000000000, changePercent: 2.5 },
        { symbol: 'MSFT', marketCap: 2800000000000, changePercent: 1.8 },
        // ...
      ]
    },
    // ... autres secteurs
  ]
};
```

## Interactions

### Survol (Hover)
- Opacité réduite de la cellule
- Tooltip avec détails complets
- Pas d'effet sur les autres cellules

### Clic
- Navigation vers la vue détaillée
- Graphique en chandelier
- Données historiques
- Actualités

### Filtre par Secteur
- Affiche uniquement le secteur sélectionné
- Recalcule la taille des cellules
- Conserve les bordures et labels

## Exemples d'Utilisation

### Vue Complète du Marché
```
Preset: S&P 500 Top
Filtre: All
Résultat: 120+ actions groupées par 11 secteurs
```

### Focus sur la Tech
```
Preset: S&P 500 Top
Filtre: Technology
Résultat: 15 actions tech avec plus d'espace
```

### Surveillance Crypto
```
Preset: Crypto & Digital Assets
Filtre: All
Résultat: Cryptos et actions crypto groupées
```

### Analyse Sectorielle
```
Preset: Sector ETFs
Filtre: All
Résultat: 20 ETFs sectoriels pour comparer les secteurs
```

## Performance

### Optimisations
- Cache API de 1 minute
- Rendu D3 optimisé
- Pas de re-render inutile
- WebSocket pour mises à jour incrémentales

### Limites Recommandées
- Maximum: 150 symboles
- Optimal: 50-120 symboles
- Minimum: 10 symboles

## Tests

### Test du Preset S&P 500
```bash
# Échantillon de 16 actions
curl "http://localhost:8000/api/quotes?symbols=AAPL,MSFT,NVDA,GOOGL,META,AMZN,TSLA,UNH,JNJ,JPM,V,MA,XOM,CVX,WMT,PG"
```

### Test de Tous les Secteurs
```bash
# Une action par secteur
curl "http://localhost:8000/api/quotes?symbols=AAPL,GOOGL,AMZN,WMT,UNH,JPM,CAT,XOM,LIN,AMT,NEE"
```

## Comparaison avec Finviz

### Similitudes ✅
- Structure hiérarchique à 2 niveaux
- Groupement par secteur
- Bordures colorées par secteur
- Cellules colorées par performance
- Labels de secteur visibles
- Taille proportionnelle à la capitalisation

### Différences
- Finviz: Données statiques, snapshot
- Notre version: Données en temps réel, WebSocket
- Finviz: Vue fixe
- Notre version: Presets multiples + custom
- Finviz: Pas de filtres
- Notre version: Filtres par secteur

## Prochaines Améliorations

- [ ] Sous-secteurs (3 niveaux: Secteur → Industrie → Action)
- [ ] Animation des transitions
- [ ] Zoom sur secteur
- [ ] Comparaison temporelle (jour/semaine/mois)
- [ ] Export en image
- [ ] Partage de configuration
- [ ] Alertes sur mouvements sectoriels
