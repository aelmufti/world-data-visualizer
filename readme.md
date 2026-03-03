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
```

⚠️ Ne commite jamais tes clés API. Le fichier .env est ignoré par git.

Le serveur proxy Node.js contourne les restrictions CORS et récupère les cours depuis Yahoo Finance.


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