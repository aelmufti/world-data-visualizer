# 📊 Financial News Aggregator & Portfolio Dashboard

Système d'agrégation d'actualités financières avec analyse sectorielle intelligente et scoring avancé.

## 🎯 Fonctionnalités

- **Agrégation multi-sources**: RSS feeds (Yahoo Finance, MarketWatch, Seeking Alpha, CNBC, Bloomberg)
- **Scoring intelligent**: Pertinence sectorielle + importance événementielle + sentiment + recency decay
- **10 secteurs couverts**: Technology, Finance, Healthcare, Energy, Consumer, Industrial, Materials, Real Estate, Utilities, Telecom
- **Carte interactive AIS**: Suivi en temps réel des pétroliers (WTI Crude) avec données aisstream.io
- **API REST**: Endpoints pour récupérer les articles par secteur ou globalement
- **Frontend React**: Interface moderne avec Tailwind CSS
- **Firebase/Firestore**: Base de données temps réel avec émulateur local

## 🚀 Installation Rapide

### Prérequis
- Node.js ≥ 18
- Firebase CLI (pour l'émulateur Firestore)
- Une clé API Firebase (optionnel pour production)

### Installation

```bash
# Cloner le projet
git clone <your-repo-url>
cd world-data-visualizer

# Installer les dépendances (root)
npm install

# Installer les dépendances (server)
cd server
npm install
cd ..
```

### Configuration

1. **Frontend** - Créer `.env` à la racine:
```env
# Clé API Anthropic (pour Claude)
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here

# URL du serveur backend
VITE_API_URL=http://localhost:8000

# AIS Stream API (optionnel, pour suivi pétroliers en temps réel)
# Inscription gratuite sur: https://aisstream.io
VITE_AISSTREAM_API_KEY=your_aisstream_api_key_here

# NewsAPI (optionnel, 100 requêtes/jour gratuit)
NEWS_API_KEY=your_newsapi_key_here
```

2. **Backend** - Créer `server/.env`:
```env
PORT=8000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_API_KEY=your_firebase_api_key_here
```

⚠️ **Important**: Ne jamais commiter les fichiers `.env` (déjà dans `.gitignore`)

### Lancement

```bash
# Terminal 1: Firestore Emulator
cd server
firebase emulators:start --only firestore

# Terminal 2: Backend API
cd server
npm run dev

# Terminal 3: RSS Worker (ingestion)
cd server
npm run rss-worker

# Terminal 4: Frontend
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📡 API Endpoints

### Articles par secteur
```bash
GET /api/aggregated/sector/:sector?limit=15

# Exemples
curl "http://localhost:8000/api/aggregated/sector/technology?limit=15"
curl "http://localhost:8000/api/aggregated/sector/finance?limit=10"
curl "http://localhost:8000/api/aggregated/sector/energy?limit=20"
```

**Secteurs disponibles**: `technology`, `finance`, `healthcare`, `energy`, `consumer`, `industrial`, `materials`, `real_estate`, `utilities`, `telecom`

### Top articles globaux
```bash
GET /api/aggregated/top?limit=30

curl "http://localhost:8000/api/aggregated/top?limit=50"
```

### Tous les secteurs
```bash
GET /api/aggregated/all?topPerSector=10

curl "http://localhost:8000/api/aggregated/all?topPerSector=15"
```

## 🧮 Système de Scoring

### Formule Finale
```typescript
finalScore = (relevanceScore × 0.6) + (importanceScore × 0.3) + (sentimentScore × 0.1) × decayFactor
```

### 1. Score de Pertinence (0-10)
Basé sur les mots-clés sectoriels avec:
- **Word-boundary matching**: Évite les faux positifs ("tech" ne matche pas "biotech")
- **Position weighting**: Titre ×2.0, Lead ×1.5, Body ×1.0
- **Courbe logarithmique**: `10 × (1 - e^(-matches × 0.4))`

**Exemple**: Article Apple iPhone
- Titre: 3 keywords (Apple, iPhone, iPad) × 2.0 = 6.0
- Lead: 2 keywords (chip, M4) × 1.5 = 3.0
- Score: 10 × (1 - e^(-9.0 × 0.4)) = 9.8/10

### 2. Score d'Importance (1-10)
Basé sur le type d'événement détecté:
- M&A / Acquisition: 10
- Action réglementaire: 9
- Earnings beat/miss: 8
- Licenciements / Procès: 7
- Partenariat / Lancement produit: 6
- Changement direction: 5
- Par défaut: 3

### 3. Score de Sentiment (0-10)
```typescript
sentimentScore = ((rawSentiment + 1) / 2) × 10
// -1.0 (très négatif) → 0 points
//  0.0 (neutre) → 5 points
// +1.0 (très positif) → 10 points
```

### 4. Recency Decay
```typescript
ageInHours = (now - publishedAt) / 3600000
decayFactor = e^(-0.15 × ageInHours)
// Half-life: 4.6 heures
// 0h = 100%, 4.6h = 50%, 9.2h = 25%, 24h = 2%
```

### Filtrage
- Seuil minimum: `relevanceScore >= 1.0`
- Tri: Par `finalScore` décroissant

## 📊 Résultats Actuels

Sur 111 articles RSS récupérés toutes les 5 minutes:
- **Technology**: 15 articles (score moyen ~7.0)
- **Finance**: 10 articles (score moyen ~6.5)
- **Energy**: 10 articles (score moyen ~6.0)
- **Consumer**: 8 articles
- **Industrial**: 6 articles
- **Materials**: 5 articles
- **Telecom**: 4 articles
- **Healthcare**: 4 articles
- **Real Estate**: 3 articles
- **Utilities**: 2 articles

**Taux d'acceptation**: ~30% (30-35 articles passent le filtre)

## 🔧 Architecture

### Backend (`server/`)
```
server/
├── src/
│   ├── index.ts              # API Express
│   ├── aggregator.ts         # Système de scoring
│   ├── aggregation-endpoint.ts # Routes API
│   ├── rss-worker.ts         # Ingestion RSS
│   ├── nlp.ts                # Analyse NLP basique
│   ├── firebase.ts           # Config Firebase
│   └── types.ts              # Types TypeScript
├── firebase.json             # Config Firebase
├── firestore.rules           # Règles de sécurité
└── package.json
```

### Frontend (`src/`)
```
src/
├── components/
│   ├── AINewsPanel.tsx       # Panel actualités
│   ├── AIAnalysis.tsx        # Analyse sectorielle
│   └── Sparkline.tsx         # Graphiques
├── data/
│   ├── sectors.ts            # Définition secteurs
│   └── sectorAnalysisFramework.ts
├── hooks/
│   ├── useAIProvider.ts      # Hook IA
│   └── useStockPrices.ts     # Hook cours
├── services/
│   ├── aiApi.ts              # Client API IA
│   └── stockApi.ts           # Client API stocks
└── App.tsx                   # Composant principal
```

## 📈 Améliorations Futures

### Carte AIS Interactive
La carte des pétroliers affiche actuellement des données de démonstration. Pour activer les données en temps réel:

1. **Créer un compte gratuit** sur [aisstream.io](https://aisstream.io)
2. **Obtenir une clé API** (tier gratuit disponible)
3. **Ajouter la clé** dans `.env`: `VITE_AISSTREAM_API_KEY=your_key`
4. **Décommenter le code WebSocket** dans `src/components/OilTankerMap.tsx`

**Sources de données AIS**:
- **aisstream.io**: WebSocket API pour données AIS en temps réel (recommandé)
- **OpenSeaMap / OpenCPN**: Données communautaires open-source
- Filtrage automatique sur les pétroliers (types 80-89)

### Priorité Haute
- [ ] **TF-IDF**: Pondération des keywords rares (2-3h)
- [ ] **Event Detection Confidence**: Éviter faux positifs sur événements importants (1h)
- [ ] **Cross-Sector Dampening**: Éviter qu'un article score haut dans plusieurs secteurs (30min)

### Priorité Moyenne
- [ ] **Text Length Normalization**: Normaliser par longueur d'article
- [ ] **Keyword Weighting**: Poids différents par keyword (entreprise > produit > terme générique)
- [ ] **Percentile-Based Cutoff**: Filtre adaptatif au volume quotidien

### Priorité Basse
- [ ] **OpenAI/Claude NLP**: Détection avancée d'entreprises et événements
- [ ] **Clustering**: Déduplication sémantique
- [ ] **Redis Cache**: Performance améliorée
- [ ] **Plus de sources RSS**: TechCrunch, WSJ, FT, etc.

## 🛠️ Stack Technique

| Technologie | Usage |
|------------|-------|
| TypeScript | Langage principal |
| Node.js + Express | Backend API |
| Firebase/Firestore | Base de données |
| React 18 | Frontend |
| Tailwind CSS | Styling |
| Vite | Build tool |
| RSS Parser | Ingestion feeds |
| Compromise + Sentiment | NLP basique |

## 📝 Documentation Détaillée

- `server/SCORING_METHODOLOGY.md` - Méthodologie complète de scoring avec exemples
- `server/SCORING_IMPROVEMENTS.md` - Historique des améliorations et fixes
- `server/README.md` - Documentation backend spécifique
- `SECURITY.md` - Bonnes pratiques de sécurité

## 🔒 Sécurité

- ✅ Toutes les clés API dans `.env` (non commité)
- ✅ `.gitignore` configuré pour protéger les credentials
- ✅ Firestore rules pour sécuriser la base
- ✅ CORS configuré sur l'API
- ✅ Validation des inputs

**Checklist avant commit**:
1. Vérifier qu'aucune clé API n'est hardcodée
2. Vérifier que `.env` est dans `.gitignore`
3. Vérifier que `API_KEY.txt` et `serviceAccountKey.json` sont ignorés

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT - Libre d'utilisation et de modification

---

**Dernière mise à jour**: 3 mars 2026
