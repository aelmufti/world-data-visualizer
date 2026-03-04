#!/bin/bash

# Script pour explorer rapidement les données du Congress Tracker

DB_PATH="server/data/financial_news.duckdb"

echo "🗳️  Congress Tracker - Exploration des Données"
echo "=============================================="
echo ""

# Vérifier que DuckDB est installé
if ! command -v duckdb &> /dev/null; then
    echo "❌ DuckDB n'est pas installé"
    echo "Installation: brew install duckdb"
    exit 1
fi

# Vérifier que la base existe
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Base de données non trouvée: $DB_PATH"
    exit 1
fi

echo "📊 Statistiques Générales"
echo "------------------------"
duckdb "$DB_PATH" -c "
SELECT 
  'Filings' as type, 
  COUNT(*) as count 
FROM filings
UNION ALL
SELECT 
  'Trades' as type, 
  COUNT(*) as count 
FROM trades
UNION ALL
SELECT 
  'Alertes non lues' as type, 
  COUNT(*) as count 
FROM alerts WHERE read = false
UNION ALL
SELECT 
  'Prix en cache' as type, 
  COUNT(*) as count 
FROM price_cache;
"

echo ""
echo "🏆 Top 5 Politiciens (par nombre de trades)"
echo "-------------------------------------------"
duckdb "$DB_PATH" -c "
SELECT 
  full_name,
  party,
  chamber,
  COUNT(*) as trades
FROM trades
GROUP BY full_name, party, chamber
ORDER BY trades DESC
LIMIT 5;
"

echo ""
echo "📈 Top 5 Tickers les Plus Tradés"
echo "--------------------------------"
duckdb "$DB_PATH" -c "
SELECT 
  ticker,
  COUNT(*) as trades,
  COUNT(DISTINCT politician) as politicians
FROM trades
WHERE ticker IS NOT NULL
GROUP BY ticker
ORDER BY trades DESC
LIMIT 5;
"

echo ""
echo "🔵🔴 Trades par Parti"
echo "--------------------"
duckdb "$DB_PATH" -c "
SELECT 
  party,
  COUNT(*) as total_trades,
  SUM(CASE WHEN action = 'Purchase' THEN 1 ELSE 0 END) as achats,
  SUM(CASE WHEN action LIKE 'Sale%' THEN 1 ELSE 0 END) as ventes
FROM trades
GROUP BY party;
"

echo ""
echo "🏛️  Trades par Chambre"
echo "---------------------"
duckdb "$DB_PATH" -c "
SELECT 
  chamber,
  COUNT(*) as trades,
  COUNT(DISTINCT politician) as politicians
FROM trades
GROUP BY chamber;
"

echo ""
echo "📅 Derniers Trades (5 plus récents)"
echo "-----------------------------------"
duckdb "$DB_PATH" -c "
SELECT 
  transaction_date,
  politician,
  ticker,
  action,
  amount_label
FROM trades
ORDER BY transaction_date DESC
LIMIT 5;
"

echo ""
echo "💰 Distribution des Montants"
echo "---------------------------"
duckdb "$DB_PATH" -c "
SELECT 
  CASE 
    WHEN amount_max < 15000 THEN '< \$15K'
    WHEN amount_max < 50000 THEN '\$15K - \$50K'
    WHEN amount_max < 100000 THEN '\$50K - \$100K'
    WHEN amount_max < 250000 THEN '\$100K - \$250K'
    WHEN amount_max < 500000 THEN '\$250K - \$500K'
    WHEN amount_max < 1000000 THEN '\$500K - \$1M'
    ELSE '> \$1M'
  END as montant,
  COUNT(*) as trades
FROM trades
GROUP BY montant
ORDER BY MIN(amount_max);
"

echo ""
echo "=============================================="
echo "✅ Exploration terminée!"
echo ""
echo "Pour plus de détails:"
echo "  - Interface web: open server/db-viewer.html"
echo "  - CLI interactif: duckdb $DB_PATH"
echo "  - Guide complet: cat ACCES_DUCKDB.md"
