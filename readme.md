🚀 Installation & Lancement
Prérequis

Node.js ≥ 18
Une clé API Anthropic (pour les fonctionnalités IA)

Installation
bash# Cloner le projet
git clone https://github.com/ton-user/portfolio-dashboard.git
cd portfolio-dashboard

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
Configuration de la clé API
Crée un fichier .env à la racine du projet :
envVITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

⚠️ Ne commite jamais ta clé API. Le fichier .env est ignoré par git.


🛠️ Stack Technique
TechnologieUsageReact 18Framework UITailwind CSSStyling utilitaireClaude API (Anthropic)Génération d'actualités et analyses IADM Sans / DM MonoTypographie (Google Fonts)

📁 Structure du projet
portfolio-dashboard/
├── src/
│   ├── App.jsx              # Composant principal + données démo
│   ├── components/
│   │   ├── AINewsPanel.jsx  # Panel actualités IA
│   │   ├── AIAnalysis.jsx   # Analyse sectorielle IA
│   │   └── Sparkline.jsx    # Mini graphique de tendance
│   └── index.css
├── .env                     # Clé API (non commité)
├── .gitignore
└── README.md

🔮 Évolutions prévues

 Import CSV/Excel pour charger ses vraies positions
 API de cours réels — intégration Yahoo Finance ou Alpha Vantage
 Persistance des alertes — sauvegarde en base de données
 Mode multi-portefeuille — comparer plusieurs stratégies
 Export PDF — rapport sectoriel hebdomadaire
 Notifications push — alertes en temps réel sur mobile


📄 Licence
MIT — libre d'utilisation et de modification.