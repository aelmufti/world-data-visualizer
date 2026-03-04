#!/bin/bash

# Script de test pour les différents presets de la carte thermique
# Usage: ./test-heatmap-presets.sh

echo "🔥 Test des Presets de la Carte Thermique"
echo "=========================================="
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester un preset
test_preset() {
    local name=$1
    local symbols=$2
    
    echo -e "${BLUE}📊 Test: $name${NC}"
    echo "Symboles: $symbols"
    echo ""
    
    RESPONSE=$(curl -s "http://localhost:8000/api/quotes?symbols=$symbols")
    
    if [ $? -eq 0 ]; then
        COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
        
        if [ ! -z "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ Succès: $COUNT symboles récupérés${NC}"
            
            # Afficher un échantillon
            echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for q in data[:3]:
    color = '\033[0;32m' if q['changePercent'] >= 0 else '\033[0;31m'
    reset = '\033[0m'
    print(f\"  {q['symbol']:10} \${q['price']:>10.2f}  {color}{q['changePercent']:>+7.2f}%{reset}\")
if len(data) > 3:
    print(f'  ... et {len(data) - 3} autres')
" 2>/dev/null
        else
            echo -e "${RED}❌ Erreur: Aucune donnée reçue${NC}"
        fi
    else
        echo -e "${RED}❌ Erreur: Échec de la requête${NC}"
    fi
    
    echo ""
    echo "---"
    echo ""
}

# Test 1: Major Stocks
test_preset "Major Stocks" "AAPL,MSFT,GOOGL,AMZN,NVDA,TSLA,META,JPM"

# Test 2: Market Indices
test_preset "Market Indices" "^GSPC,^IXIC,^DJI,^RUT,^VIX,^FCHI,^GDAXI"

# Test 3: Sector ETFs
test_preset "Sector ETFs" "XLK,XLF,XLV,XLE,XLY,XLP,XLI,XLB"

# Test 4: Technology ETFs
test_preset "Technology ETFs" "QQQ,VGT,XLK,SOXX,SMH,ARKK"

# Test 5: Commodity ETFs
test_preset "Commodity ETFs" "GLD,SLV,USO,UNG,DBA,DBC"

# Test 6: Crypto & Digital Assets
test_preset "Crypto & Digital Assets" "BTC-USD,ETH-USD,COIN,MARA,RIOT"

# Test 7: Custom Mix
test_preset "Custom Mix" "AAPL,^GSPC,QQQ,BTC-USD,GLD"

echo ""
echo -e "${GREEN}✅ Tests terminés${NC}"
echo ""
echo "💡 Pour utiliser dans l'interface:"
echo "   1. Ouvrir l'onglet Stock Market"
echo "   2. Sélectionner la vue Heatmap"
echo "   3. Choisir un preset ou utiliser Custom"
echo "   4. Pour Custom: entrer les symboles séparés par virgule ou espace"
echo ""
