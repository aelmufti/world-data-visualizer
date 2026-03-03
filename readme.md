🚀 Installation & Lancement
Prérequis

Node.js ≥ 18
Une clé API Anthropic (pour les fonctionnalités IA)

Installation
```bash
# Cloner le projet
git clone https://github.com/ton-user/portfolio-dashboard.git
cd portfolio-dashboard

# Installer les dépendances
npm install

# Lancer le serveur proxy ET le frontend
npm run dev:all

# Ou lancer séparément:
# Terminal 1: npm run server
# Terminal 2: npm run dev
```

Configuration des clés API
Crée un fichier .env à la racine du projet :
```env
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

# URL du serveur proxy (optionnel)
VITE_API_URL=http://localhost:3001

# NewsAPI pour actualités en temps réel (gratuit, 100 requêtes/jour)
# Obtenir une clé sur: https://newsapi.org/register
NEWS_API_KEY=your_newsapi_key_here

# ============================================================================
# News Aggregator Configuration (Optionnel - Valeurs par défaut ci-dessous)
# ============================================================================

# NewsAPI Configuration
NEWSAPI_ENABLED=true              # Activer/désactiver NewsAPI
NEWSAPI_TIMEOUT=3000              # Timeout en ms (défaut: 3000)
NEWSAPI_MAX_ARTICLES=10           # Nombre max d'articles par source (défaut: 10)

# Bing News Configuration
BING_ENABLED=true                 # Activer/désactiver Bing News
BING_TIMEOUT=3000                 # Timeout en ms (défaut: 3000)
BING_MAX_ARTICLES=10              # Nombre max d'articles (défaut: 10)

# Google News Configuration
GOOGLE_ENABLED=true               # Activer/désactiver Google News
GOOGLE_ENABLED=3000                # Timeout en ms (défaut: 3000)
GOOGLE_MAX_ARTICLES=10            # Nombre max d'articles (défaut: 10)

# Cache Configuration
CACHE_ENABLED=true                # Activer/désactiver le cache (défaut: true)
CACHE_TTL=900000                  # Durée de vie du cache en ms (défaut: 15 min)
CACHE_MAX_SIZE=100                # Nombre max d'entrées en cache (défaut: 100)

# Scoring Configuration (Poids pour le calcul de pertinence)
SCORING_TITLE_WEIGHT=0.5          # Poids du titre (défaut: 0.5)
SCORING_SNIPPET_WEIGHT=0.3        # Poids du snippet (défaut: 0.3)
SCORING_RECENCY_WEIGHT=0.2        # Poids de la récence (défaut: 0.2)
SCORING_KEYWORD_BONUS=0.1         # Bonus par mot-clé additionnel (défaut: 0.1)

# Deduplication Configuration
DEDUP_ENABLED=true                # Activer/désactiver la déduplication (défaut: true)
DEDUP_THRESHOLD=0.7               # Seuil de similarité (0-1, défaut: 0.7)

# Filtering Configuration
FILTER_MIN_SCORE=0.3              # Score minimum de pertinence (défaut: 0.3)
FILTER_FALLBACK_SCORE=0.2         # Score de secours si < 5 articles (défaut: 0.2)
FILTER_MIN_ARTICLES=5             # Seuil pour activer le fallback (défaut: 5)
FILTER_MAX_ARTICLES=20            # Nombre max d'articles retournés (défaut: 20)
```

⚠️ Ne commite jamais tes clés API. Le fichier .env est ignoré par git.

Le serveur proxy Node.js contourne les restrictions CORS et récupère les cours depuis Yahoo Finance.

### Configuration de l'agrégateur d'actualités

L'application utilise un système d'agrégation multi-sources pour récupérer des actualités pertinentes pour chaque secteur. Voici comment configurer le comportement de l'agrégateur :

#### Sources d'actualités

- **NewsAPI** : Nécessite une clé API (gratuite, 100 requêtes/jour). Obtenir une clé sur [newsapi.org](https://newsapi.org/register)
- **Bing News** : Flux RSS public, aucune clé requise
- **Google News** : Flux RSS public, aucune clé requise

Vous pouvez activer/désactiver chaque source individuellement avec les variables `*_ENABLED`.

#### Paramètres de performance

- **Timeout** : Durée maximale d'attente par source (défaut: 3 secondes)
- **Max Articles** : Nombre maximum d'articles à récupérer par source (défaut: 10)
- **Cache TTL** : Durée de vie du cache (défaut: 15 minutes = 900000 ms)

#### Scoring de pertinence

Le système calcule un score de pertinence (0-1) pour chaque article basé sur :
- **Title Weight** : Importance des mots-clés dans le titre (défaut: 50%)
- **Snippet Weight** : Importance des mots-clés dans le snippet (défaut: 30%)
- **Recency Weight** : Importance de la récence de l'article (défaut: 20%)
- **Keyword Bonus** : Bonus pour chaque mot-clé supplémentaire trouvé (défaut: 0.1)

#### Déduplication

Le système détecte et élimine les doublons en comparant la similarité des titres :
- **Threshold** : Seuil de similarité (défaut: 0.7 = 70%)
- Articles avec similarité > seuil sont considérés comme doublons
- L'article avec le meilleur score de pertinence est conservé

#### Filtrage

- **Min Score** : Score minimum pour qu'un article soit retourné (défaut: 0.3)
- **Fallback Score** : Score de secours si moins de 5 articles (défaut: 0.2)
- **Max Articles** : Nombre maximum d'articles dans la réponse (défaut: 20)


🛠️ Stack Technique
TechnologieUsageReact 18Framework UITailwind CSSStyling utilitaireClaude API (Anthropic)Génération d'actualités et analyses IADM Sans / DM MonoTypographie (Google Fonts)

📁 Structure du projet
```
portfolio-dashboard/
├── src/
│   ├── App.tsx              # Composant principal
│   ├── components/
│   │   ├── AINewsPanel.tsx  # Panel actualités IA
│   │   ├── AIAnalysis.tsx   # Analyse sectorielle IA
│   │   └── Sparkline.tsx    # Mini graphique de tendance
│   ├── data/
│   │   └── sectors.ts       # Données des secteurs
│   ├── hooks/
│   │   └── useStockPrices.ts # Hook pour cours en temps réel
│   ├── services/
│   │   └── stockApi.ts      # API client pour les cours
│   └── utils/
│       └── portfolio.ts     # Fonctions de calcul
├── server/
│   └── index.js             # Serveur proxy Node.js
├── .env                     # Clés API (non commité)
├── .gitignore
└── README.md
```

🔮 Évolutions prévues

 Import CSV/Excel pour charger ses vraies positions
 API de cours réels — intégration Yahoo Finance ou Alpha Vantage
 Persistance des alertes — sauvegarde en base de données
 Mode multi-portefeuille — comparer plusieurs stratégies
 Export PDF — rapport sectoriel hebdomadaire
 Notifications push — alertes en temps réel sur mobile


📄 Licence
MIT — libre d'utilisation et de modification.