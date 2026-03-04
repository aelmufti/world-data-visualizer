# 🗳️ Congress & Senate Trade Tracker

Système complet de suivi des transactions boursières des membres du Congrès américain avec analyse des performances en temps réel.

---

## 🚀 Accès Rapide

### Interface Web
```
http://localhost:5173/congress-tracker
```

### API REST
```bash
curl http://localhost:8000/api/congress/status
curl http://localhost:8000/api/congress/trades
curl http://localhost:8000/api/congress/politicians
```

---

## ✨ Fonctionnalités

- 🏆 **Leaderboard** - Classement des politiciens par win rate
- 📊 **Trades en Temps Réel** - Mise à jour automatique toutes les 60 minutes
- 🔔 **Alertes Instantanées** - Notifications SSE pour nouveaux trades
- 📈 **Analyse de Performance** - Prix historiques et actuels via Yahoo Finance
- 🎯 **Filtres Avancés** - Par action, chambre, ticker, politicien
- 💾 **Stockage DuckDB** - Base de données locale performante
- 📄 **Parsing PDF** - Extraction automatique des PTR filings

---

## 📊 Données Actuelles

- **12 filings** traités
- **15 trades** enregistrés
- **11 politiciens** suivis
- **Win rates** calculés dynamiquement

**Top Performers :**
1. Michael Guest (R-MS) - 100% win rate
2. Nancy Pelosi (D-CA) - 71% win rate

---

## 🏛️ Politiciens Suivis

### House (9 membres)
- Nancy Pelosi (D-CA)
- Warren Davidson (R-OH)
- Donald Norcross (D-NJ)
- Terri Sewell (D-AL)
- Bryan Steil (R-WI)
- Nick LaLota (R-NY)
- Michael Guest (R-MS)
- Tom McClintock (R-CA)
- Dwight Evans (D-PA)

### Senate (2 membres)
- Alex Padilla (D-CA)
- Rick Scott (R-FL)

---

## 🔧 Installation

### Prérequis
```bash
# macOS
brew install poppler  # Pour pdftotext

# Linux
sudo apt install poppler-utils
```

### Démarrage
```bash
# Backend
cd server
npm install
npm run dev

# Frontend
npm install
npm run dev
```

---

## 📚 Documentation

- **Guide Complet** - [CONGRESS_TRACKER_GUIDE.md](./CONGRESS_TRACKER_GUIDE.md)
- **Quick Start** - [CONGRESS_TRACKER_QUICKSTART.md](./CONGRESS_TRACKER_QUICKSTART.md)
- **Accès DuckDB** - [ACCES_DUCKDB.md](./ACCES_DUCKDB.md)
- **Guide Rapide** - [GUIDE_ACCES_RAPIDE.md](./GUIDE_ACCES_RAPIDE.md)
- **Frontend** - [CONGRESS_TRACKER_FRONTEND_INTEGRATED.md](./CONGRESS_TRACKER_FRONTEND_INTEGRATED.md)
- **Système Complet** - [SYSTEME_COMPLET.md](./SYSTEME_COMPLET.md)

---

## 🎯 Utilisation

### Explorer les Données

**Via Frontend :**
```
http://localhost:5173/congress-tracker
```

**Via API :**
```bash
# Statut
curl http://localhost:8000/api/congress/status | python3 -m json.tool

# Trades de Pelosi
curl http://localhost:8000/api/congress/trades/Pelosi | python3 -m json.tool

# Top performers
curl http://localhost:8000/api/congress/politicians | python3 -m json.tool
```

**Via Script :**
```bash
./explore-congress-api.sh
```

### Accéder à DuckDB

**Interface Web :**
```bash
open server/db-viewer.html
```

**CLI (arrêter le serveur d'abord) :**
```bash
cd server
duckdb data/financial_news.duckdb
```

---

## 🔄 Architecture

```
┌─────────────────────────────────────────┐
│         60-Minute Poller                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    House & Senate Scrapers              │
│  - disclosures-clerk.house.gov          │
│  - efdsearch.senate.gov                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         PDF Parser (pdftotext)          │
│  - Download PDFs                        │
│  - Extract trade data                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         DuckDB Storage                  │
│  - filings table                        │
│  - trades table                         │
│  - alerts table                         │
│  - price_cache table                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Yahoo Finance Price Service          │
│  - Historical prices                    │
│  - Current prices                       │
│  - Win rate calculation                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         REST API + SSE Stream           │
│  - 9 endpoints                          │
│  - Real-time alerts                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         React Frontend                  │
│  - Interactive UI                       │
│  - Real-time updates                    │
│  - Advanced filters                     │
└─────────────────────────────────────────┘
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/congress/status` | GET | System status |
| `/api/congress/trades` | GET | Query trades with filters |
| `/api/congress/trades/:lastName` | GET | Get politician's trades |
| `/api/congress/filings` | GET | Get all filings |
| `/api/congress/alerts` | GET | Get alerts |
| `/api/congress/alerts/:id/read` | PATCH | Mark alert as read |
| `/api/congress/alerts/read-all` | PATCH | Mark all alerts as read |
| `/api/congress/alerts/stream` | GET | SSE real-time stream |
| `/api/congress/politicians` | GET | Get politicians with win rates |

---

## 🎨 Captures d'Écran

### Leaderboard
- Cartes interactives des politiciens
- Win rates en temps réel
- Filtrage par clic

### Table des Trades
- 100 trades les plus récents
- Prix et retours calculés
- Indicateurs win/loss
- Filtres multiples

### Notifications
- Toast en temps réel
- Nouveaux trades instantanés
- Auto-dismiss

---

## 🔐 Sécurité

- ✅ Données officielles du gouvernement US
- ✅ Pas de clés API requises
- ✅ Stockage local (DuckDB)
- ✅ Pas de données personnelles
- ✅ Open source

---

## 🤝 Contribution

### Ajouter des Politiciens
Éditez `server/src/congress-tracker/politicians.ts`

### Modifier le Polling
Éditez `server/src/congress-tracker/poller.ts`

### Personnaliser l'UI
Éditez `src/components/CongressTrackerTab.tsx`

---

## 📝 License

MIT

---

## 🙏 Crédits

- **Sources de Données**
  - U.S. House of Representatives
  - U.S. Senate
  - Yahoo Finance

- **Technologies**
  - DuckDB
  - React
  - TypeScript
  - Express
  - pdftotext (Poppler)

---

## 📞 Support

- **Documentation :** Voir les fichiers `CONGRESS_TRACKER_*.md`
- **Issues :** Vérifier les logs du serveur
- **Health Check :** `curl http://localhost:8000/api/health`

---

**Fait avec ❤️ pour la transparence gouvernementale**
