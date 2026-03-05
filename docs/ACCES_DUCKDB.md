# Comment Accéder à DuckDB - Congress Tracker

Plusieurs méthodes pour explorer les données du Congress Tracker dans DuckDB.

---

## 🌐 Méthode 1 : Interface Web (Recommandé)

### Ouvrir le visualiseur HTML
```bash
open server/db-viewer.html
```

Ou double-cliquez sur `server/db-viewer.html` dans le Finder.

### Requêtes utiles dans l'interface web :

```sql
-- Voir tous les trades
SELECT * FROM trades ORDER BY transaction_date DESC LIMIT 20;

-- Statistiques par politicien
SELECT 
  politician,
  full_name,
  party,
  COUNT(*) as total_trades,
  SUM(amount_max) as total_value
FROM trades
GROUP BY politician, full_name, party
ORDER BY total_trades DESC;

-- Trades récents avec prix
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

---

## 💻 Méthode 2 : CLI DuckDB (Terminal)

### Ouvrir la base de données
```bash
cd server
duckdb data/financial_news.duckdb
```

### Commandes utiles

#### Voir toutes les tables
```sql
SHOW TABLES;
```

#### Décrire une table
```sql
DESCRIBE trades;
DESCRIBE filings;
DESCRIBE alerts;
DESCRIBE price_cache;
```

#### Requêtes d'exploration

**Tous les trades de Pelosi :**
```sql
SELECT 
  ticker,
  action,
  amount_label,
  transaction_date,
  notes
FROM trades
WHERE politician = 'Pelosi'
ORDER BY transaction_date DESC;
```

**Top 10 tickers les plus tradés :**
```sql
SELECT 
  ticker,
  COUNT(*) as trade_count,
  COUNT(DISTINCT politician) as politician_count
FROM trades
WHERE ticker IS NOT NULL
GROUP BY ticker
ORDER BY trade_count DESC
LIMIT 10;
```

**Statistiques par parti :**
```sql
SELECT 
  party,
  COUNT(*) as total_trades,
  COUNT(DISTINCT politician) as politicians,
  SUM(CASE WHEN action = 'Purchase' THEN 1 ELSE 0 END) as purchases,
  SUM(CASE WHEN action LIKE 'Sale%' THEN 1 ELSE 0 END) as sales
FROM trades
GROUP BY party;
```

**Trades par chambre :**
```sql
SELECT 
  chamber,
  COUNT(*) as trades,
  COUNT(DISTINCT politician) as politicians
FROM trades
GROUP BY chamber;
```

**Alertes non lues :**
```sql
SELECT 
  a.id,
  a.detected_at,
  t.politician,
  t.ticker,
  t.action,
  t.amount_label
FROM alerts a
JOIN trades t ON a.trade_id = t.id
WHERE a.read = false
ORDER BY a.detected_at DESC;
```

**Cache des prix :**
```sql
SELECT 
  ticker,
  price_date,
  close_price,
  fetched_at
FROM price_cache
ORDER BY fetched_at DESC
LIMIT 20;
```

#### Quitter DuckDB
```sql
.quit
```
ou `Ctrl+D`

---

## 🔧 Méthode 3 : API REST

### Via curl

**Statistiques système :**
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

**Alertes non lues :**
```bash
curl "http://localhost:8000/api/congress/alerts?unread=true" | python3 -m json.tool
```

---

## 📊 Méthode 4 : Script Node.js

Créez un fichier `query-duckdb.js` :

```javascript
import Database from 'duckdb-async';

async function query() {
  const db = await Database.create('server/data/financial_news.duckdb');
  
  // Exemple : Top traders
  const result = await db.all(`
    SELECT 
      politician,
      full_name,
      party,
      COUNT(*) as trades
    FROM trades
    GROUP BY politician, full_name, party
    ORDER BY trades DESC
    LIMIT 10
  `);
  
  console.table(result);
  
  await db.close();
}

query();
```

Exécutez :
```bash
node query-duckdb.js
```

---

## 🐍 Méthode 5 : Python avec DuckDB

Créez un fichier `query_duckdb.py` :

```python
import duckdb

# Connexion
conn = duckdb.connect('server/data/financial_news.duckdb')

# Requête
result = conn.execute("""
    SELECT 
        politician,
        ticker,
        action,
        amount_label,
        transaction_date
    FROM trades
    ORDER BY transaction_date DESC
    LIMIT 10
""").fetchdf()

print(result)

conn.close()
```

Exécutez :
```bash
python3 query_duckdb.py
```

---

## 📝 Requêtes SQL Utiles

### Analyse des Performances

**Win rate par politicien (approximatif) :**
```sql
SELECT 
  politician,
  full_name,
  party,
  COUNT(*) as total_trades,
  COUNT(DISTINCT ticker) as unique_tickers,
  AVG(amount_max) as avg_trade_size
FROM trades
GROUP BY politician, full_name, party
ORDER BY total_trades DESC;
```

**Trades par mois :**
```sql
SELECT 
  strftime(transaction_date, '%Y-%m') as month,
  COUNT(*) as trades,
  COUNT(DISTINCT politician) as politicians
FROM trades
GROUP BY month
ORDER BY month DESC;
```

**Plus gros trades :**
```sql
SELECT 
  politician,
  ticker,
  action,
  amount_max,
  amount_label,
  transaction_date
FROM trades
ORDER BY amount_max DESC
LIMIT 20;
```

**Activité récente (7 derniers jours) :**
```sql
SELECT 
  politician,
  COUNT(*) as trades,
  GROUP_CONCAT(DISTINCT ticker) as tickers
FROM trades
WHERE transaction_date >= date('now', '-7 days')
GROUP BY politician
ORDER BY trades DESC;
```

### Analyse des Filings

**Filings par année :**
```sql
SELECT 
  year,
  COUNT(*) as filings,
  COUNT(DISTINCT politician) as politicians
FROM filings
GROUP BY year
ORDER BY year DESC;
```

**Derniers filings :**
```sql
SELECT 
  filing_id,
  politician,
  full_name,
  party,
  chamber,
  fetched_at,
  pdf_url
FROM filings
ORDER BY fetched_at DESC
LIMIT 10;
```

### Analyse des Prix

**Tickers avec prix cachés :**
```sql
SELECT 
  ticker,
  COUNT(*) as price_points,
  MIN(price_date) as first_date,
  MAX(price_date) as last_date
FROM price_cache
WHERE close_price IS NOT NULL
GROUP BY ticker
ORDER BY price_points DESC;
```

**Prix récents :**
```sql
SELECT 
  ticker,
  price_date,
  close_price,
  fetched_at
FROM price_cache
WHERE close_price IS NOT NULL
ORDER BY fetched_at DESC
LIMIT 20;
```

---

## 🔍 Méthode 6 : Endpoint de Requête Direct

Le serveur expose un endpoint pour exécuter des requêtes SQL :

```bash
curl -X POST http://localhost:8000/api/db/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT politician, COUNT(*) as trades FROM trades GROUP BY politician ORDER BY trades DESC LIMIT 5"
  }' | python3 -m json.tool
```

⚠️ **Note :** Seules les requêtes SELECT sont autorisées pour des raisons de sécurité.

---

## 📍 Localisation de la Base de Données

```
server/data/financial_news.duckdb
```

Taille actuelle :
```bash
ls -lh server/data/financial_news.duckdb
```

---

## 🛠️ Commandes Rapides

### Voir le schéma complet
```bash
cd server
duckdb data/financial_news.duckdb -c "SHOW TABLES;"
duckdb data/financial_news.duckdb -c "DESCRIBE trades;"
```

### Compter les enregistrements
```bash
duckdb data/financial_news.duckdb -c "SELECT COUNT(*) FROM trades;"
duckdb data/financial_news.duckdb -c "SELECT COUNT(*) FROM filings;"
duckdb data/financial_news.duckdb -c "SELECT COUNT(*) FROM alerts WHERE read = false;"
```

### Export CSV
```bash
duckdb data/financial_news.duckdb -c "COPY (SELECT * FROM trades) TO 'trades.csv' (HEADER, DELIMITER ',');"
```

### Backup de la base
```bash
cp server/data/financial_news.duckdb server/data/financial_news.duckdb.backup
```

---

## 🎯 Exemples Pratiques

### 1. Trouver les trades NVDA
```sql
SELECT 
  politician,
  action,
  amount_label,
  transaction_date
FROM trades
WHERE ticker = 'NVDA'
ORDER BY transaction_date DESC;
```

### 2. Comparer Démocrates vs Républicains
```sql
SELECT 
  party,
  COUNT(*) as total_trades,
  SUM(CASE WHEN action = 'Purchase' THEN 1 ELSE 0 END) as buys,
  SUM(CASE WHEN action LIKE 'Sale%' THEN 1 ELSE 0 END) as sells,
  ROUND(AVG(amount_max), 2) as avg_amount
FROM trades
GROUP BY party;
```

### 3. Politiciens les plus actifs ce mois-ci
```sql
SELECT 
  politician,
  full_name,
  COUNT(*) as trades_this_month
FROM trades
WHERE strftime(transaction_date, '%Y-%m') = strftime('now', '%Y-%m')
GROUP BY politician, full_name
ORDER BY trades_this_month DESC;
```

### 4. Analyse des montants
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
  END as amount_range,
  COUNT(*) as trades
FROM trades
GROUP BY amount_range
ORDER BY MIN(amount_max);
```

---

## 🚨 Dépannage

### Base de données verrouillée
Si vous obtenez une erreur "database is locked" :
```bash
# Arrêter le serveur
# Puis accéder à DuckDB
cd server
duckdb data/financial_news.duckdb
```

### Réinitialiser les alertes
```sql
UPDATE alerts SET read = true;
```

### Supprimer le cache des prix
```sql
DELETE FROM price_cache;
```

### Voir les connexions actives
```sql
SELECT * FROM duckdb_connections();
```

---

## 📚 Ressources

- **Documentation DuckDB :** https://duckdb.org/docs/
- **SQL Reference :** https://duckdb.org/docs/sql/introduction
- **Guide d'accès existant :** `DUCKDB_ACCESS_GUIDE.md`

---

**Méthode recommandée :** Utilisez l'interface web (`server/db-viewer.html`) pour une exploration visuelle, ou le CLI pour des requêtes rapides.
