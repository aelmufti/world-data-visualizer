#!/bin/bash

# Script pour explorer les données via l'API REST

echo "🗳️  Congress Tracker - Exploration via API"
echo "=========================================="
echo ""

# Vérifier que le serveur est en cours d'exécution
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "❌ Le serveur n'est pas en cours d'exécution"
    echo "Démarrez-le avec: cd server && npm run dev"
    exit 1
fi

echo "📊 Statut du Système"
echo "-------------------"
curl -s http://localhost:8000/api/congress/status | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"Dernière mise à jour: {data.get('lastPollTime', 'N/A')}\")
print(f\"Filings totaux: {data.get('totalFilings', 0)}\")
print(f\"Trades totaux: {data.get('totalTrades', 0)}\")
print(f\"Alertes non lues: {data.get('unreadAlerts', 0)}\")
print(f\"Politiciens suivis: {data.get('trackedPoliticians', 0)}\")
print(f\"pdftotext: {'✅ Installé' if data.get('pdfToTextAvailable') else '❌ Non installé'}\")
"

echo ""
echo "🏆 Top Politiciens (par Win Rate)"
echo "---------------------------------"
curl -s http://localhost:8000/api/congress/politicians | python3 -c "
import sys, json
data = json.load(sys.stdin)
politicians = [p for p in data['politicians'] if p['winRate'] is not None]
politicians.sort(key=lambda x: x['winRate'], reverse=True)
for i, p in enumerate(politicians[:5], 1):
    party_emoji = '🔵' if p['party'] == 'D' else '🔴'
    print(f\"{i}. {p['fullName']} {party_emoji} - {p['winRate']*100:.0f}% ({p['resolvedTrades']}/{p['totalTrades']} trades)\")
"

echo ""
echo "📈 Derniers Trades"
echo "-----------------"
curl -s http://localhost:8000/api/congress/trades | python3 -c "
import sys, json
data = json.load(sys.stdin)
trades = data['trades'][:5]
for trade in trades:
    action_emoji = '▲' if trade['action'] == 'Purchase' else '▼' if 'Sale' in trade['action'] else '↔'
    party_emoji = '🔵' if trade['party'] == 'D' else '🔴'
    print(f\"{action_emoji} {trade['politician']} {party_emoji} - {trade['ticker']} - {trade['amount_label']} - {trade['transaction_date']}\")
"

echo ""
echo "🔔 Alertes Non Lues"
echo "------------------"
curl -s "http://localhost:8000/api/congress/alerts?unread=true" | python3 -c "
import sys, json
data = json.load(sys.stdin)
count = data['count']
print(f\"Total: {count} alertes non lues\")
if count > 0:
    print(\"\\nDernières alertes:\")
    for alert in data['alerts'][:3]:
        print(f\"  - {alert['politician']}: {alert['ticker']} {alert['action']} {alert['amount_label']}\")
"

echo ""
echo "=========================================="
echo "✅ Exploration terminée!"
echo ""
echo "Commandes utiles:"
echo "  - Trades de Pelosi: curl http://localhost:8000/api/congress/trades/Pelosi | python3 -m json.tool"
echo "  - Tous les politiciens: curl http://localhost:8000/api/congress/politicians | python3 -m json.tool"
echo "  - Interface web: open http://localhost:5173/congress-tracker"
