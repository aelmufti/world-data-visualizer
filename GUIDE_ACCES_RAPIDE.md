# 🚀 Guide d'Accès Rapide - Congress Tracker

## 3 Façons Simples d'Accéder aux Données

---

## 🌐 1. Interface Web (Le Plus Simple)

### Option A : Frontend React
```bash
# Ouvrir dans le navigateur
open http://localhost:5173/congress-tracker
```

**Fonctionnalités :**
- ✅ Visualisation interactive des trades
- ✅ Filtres par politicien, ticker, action
- ✅ Leaderboard des win rates
- ✅ Notifications en temps réel
- ✅ Graphiques et statistiques

### Option B : Visualiseur DuckDB
```bash
# Ouvrir le visualiseur HTML
open server/db-viewer.html
```

**Fonctionnalités :**
- ✅ Exécuter des requêtes SQL personnalisées
- ✅ Explorer toutes les tables
- ✅ Export CSV
- ✅ Pas besoin d'arrêter le serveur

---

## 🔧 2. API REST (Pour Scripts)

### Script d'Exploration Automatique
```bash
./explore-congress-api.sh
```

**Affiche :**
- Statistiques système
- Top politiciens par win rate
- Derniers trades
- Alertes non lues

### Commandes Manuelles

**Statut du système :**
```bash
curl http://localhost:8000/api/congress/status | python3 -m json.tool
```

**Tous les trades :**
```bash
curl http://localhost:8000/api/congress/trades | python3 -m json.tool
```

**Trades de Pelosi :**
```bash
curl http://localhost:8000/api/congress/trades/Pelosi | python3 -m json.tool
```

**Politiciens avec win rates :**
```bash
curl http://localhost:8000/api/congress/politicians | python3 -m json.tool
```

**Filtrer par ticker :**
```bash
curl "http://localhost:8000/api/congress/trades?ticker=NVDA" | python3 -m json.tool
```

**Filtrer par action :**
```bash
curl "http://localhost:8000/api/congress/trades?action=Purchase" | python3 -m json.tool
```

---

## 💻 3. CLI DuckDB (Pour Requêtes SQL)

⚠️ **Important :** Arrêtez d'abord le serveur pour éviter le verrouillage de la base.

### Arrêter le serveur temporairement
```bash
# Trouver le processus
lsof -i :8000

# Arrêter (remplacer PID par le numéro du processus)
kill <PID>
```

### Accéder à DuckDB
```bash
cd server
duckdb data/financial_news.duckdb
```

### Requêtes Utiles

**Voir toutes les tables :**
```sql
SHOW TABLES;
```

**Statistiques rapides :**
```sql
SELECT 
  'Filings' as type, COUNT(*) as count FROM filings
UNION ALL
SELECT 'Trades', COUNT(*) FROM trades
UNION ALL
SELECT 'Alertes', COUNT(*) FROM alerts WHERE read = false;
```

**Top traders :**
```sql
SELECT 
  politician,
  full_name,
  party,
  COUNT(*) as trades
FROM trades
GROUP BY politician, full_name, party
ORDER BY trades DESC
LIMIT 10;
```

**Trades récents :**
```sql
SELECT 
  politician,
  ticker,
  action,
  amount_label,
  transaction_date
FROM trades
ORDER BY transaction_date DESC
LIMIT 10;
```

**Quitter :**
```sql
.quit
```

### Redémarrer le serveur
```bash
cd server
npm run dev
```

---

## 📊 Données Actuelles

**Statistiques (au 4 mars 2026) :**
- 📄 12 filings traités
- 💼 15 trades enregistrés
- 🔔 15 alertes non lues
- 👥 11 politiciens suivis

**Top Performers :**
1. 🔴 Michael Guest - 100% win rate (2/2)
2. 🔵 Nancy Pelosi - 71% win rate (7/8)

---

## 🎯 Cas d'Usage Courants

### Analyser un Politicien Spécifique
```bash
# Via API
curl http://localhost:8000/api/congress/trades/Pelosi | python3 -m json.tool

# Via Frontend
open "http://localhost:5173/congress-tracker"
# Puis cliquer sur la carte du politicien
```

### Trouver Tous les Trades NVDA
```bash
# Via API
curl "http://localhost:8000/api/congress/trades?ticker=NVDA" | python3 -m json.tool

# Via Frontend
open "http://localhost:5173/congress-tracker"
# Puis cliquer sur le filtre "NVDA"
```

### Voir les Achats Récents
```bash
# Via API
curl "http://localhost:8000/api/congress/trades?action=Purchase" | python3 -m json.tool

# Via Frontend
open "http://localhost:5173/congress-tracker"
# Puis cliquer sur "Purchase"
```

### Comparer House vs Senate
```bash
# Via API - House
curl "http://localhost:8000/api/congress/trades?chamber=house" | python3 -m json.tool

# Via API - Senate
curl "http://localhost:8000/api/congress/trades?chamber=senate" | python3 -m json.tool

# Via Frontend
open "http://localhost:5173/congress-tracker"
# Puis cliquer sur "house" ou "senate"
```

---

## 🔍 Requêtes SQL Avancées

### Analyse des Montants
```sql
SELECT 
  CASE 
    WHEN amount_max < 15000 THEN '< $15K'
    WHEN amount_max < 50000 THEN '$15K - $50K'
    WHEN amount_max < 100000 THEN '$50K - $100K'
    WHEN amount_max < 250000 THEN '$100K - $250K'
    WHEN amount_max < 500000 THEN '$250K - $500K'
    WHEN amount_max < 1000000 THEN '$500K - $1M'
    ELSE '> $1M'
  END as range,
  COUNT(*) as trades
FROM trades
GROUP BY range
ORDER BY MIN(amount_max);
```

### Activité par Mois
```sql
SELECT 
  strftime(transaction_date, '%Y-%m') as month,
  COUNT(*) as trades,
  COUNT(DISTINCT politician) as politicians
FROM trades
GROUP BY month
ORDER BY month DESC;
```

### Tickers les Plus Populaires
```sql
SELECT 
  ticker,
  COUNT(*) as trades,
  COUNT(DISTINCT politician) as politicians,
  SUM(CASE WHEN action = 'Purchase' THEN 1 ELSE 0 END) as buys,
  SUM(CASE WHEN action LIKE 'Sale%' THEN 1 ELSE 0 END) as sells
FROM trades
WHERE ticker IS NOT NULL
GROUP BY ticker
ORDER BY trades DESC
LIMIT 10;
```

### Démocrates vs Républicains
```sql
SELECT 
  party,
  COUNT(*) as total_trades,
  SUM(CASE WHEN action = 'Purchase' THEN 1 ELSE 0 END) as achats,
  SUM(CASE WHEN action LIKE 'Sale%' THEN 1 ELSE 0 END) as ventes,
  ROUND(AVG(amount_max), 2) as montant_moyen
FROM trades
GROUP BY party;
```

---

## 📱 Accès Mobile

Le frontend est responsive et fonctionne sur mobile :
```
http://localhost:5173/congress-tracker
```

---

## 🛠️ Dépannage

### Le serveur ne répond pas
```bash
# Vérifier si le serveur tourne
curl http://localhost:8000/api/health

# Redémarrer si nécessaire
cd server
npm run dev
```

### Base de données verrouillée
```bash
# Arrêter le serveur d'abord
kill <PID>

# Puis accéder à DuckDB
duckdb server/data/financial_news.duckdb
```

### Pas de données
```bash
# Vérifier le statut
curl http://localhost:8000/api/congress/status

# Forcer un nouveau poll (redémarrer le serveur)
cd server
npm run dev
```

---

## 📚 Documentation Complète

- **Guide détaillé :** `ACCES_DUCKDB.md`
- **API Reference :** `CONGRESS_TRACKER_GUIDE.md`
- **Frontend :** `CONGRESS_TRACKER_FRONTEND_INTEGRATED.md`
- **Quick Start :** `CONGRESS_TRACKER_QUICKSTART.md`

---

## ⚡ Commandes Ultra-Rapides

```bash
# Voir les stats
./explore-congress-api.sh

# Ouvrir le frontend
open http://localhost:5173/congress-tracker

# Ouvrir le visualiseur DB
open server/db-viewer.html

# Trades de Pelosi
curl http://localhost:8000/api/congress/trades/Pelosi | python3 -m json.tool

# Top performers
curl http://localhost:8000/api/congress/politicians | python3 -m json.tool
```

---

**Méthode Recommandée :** Utilisez le frontend React pour une expérience complète et interactive !

```bash
open http://localhost:5173/congress-tracker
```
