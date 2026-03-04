#!/bin/bash

echo "🧪 Test des Indices Boursiers Yahoo Finance"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health
echo "1️⃣  Test de santé du backend..."
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend disponible${NC}"
else
    echo -e "${RED}❌ Backend non disponible${NC}"
    echo -e "${YELLOW}💡 Démarrez le backend: cd server && npm run dev${NC}"
    exit 1
fi
echo ""

# Test 2: Single Quote
echo "2️⃣  Test d'un seul indice (S&P 500)..."
RESPONSE=$(curl -s "http://localhost:8000/api/quote/^GSPC")
if echo "$RESPONSE" | grep -q "price"; then
    PRICE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['price'])" 2>/dev/null)
    echo -e "${GREEN}✅ S&P 500: $PRICE${NC}"
else
    echo -e "${RED}❌ Échec de récupération${NC}"
fi
echo ""

# Test 3: Batch Quotes
echo "3️⃣  Test de plusieurs indices (batch)..."
SYMBOLS="^GSPC,^IXIC,^DJI,^RUT,^VIX,^FCHI,^GDAXI,^FTSE,^N225,000001.SS"
RESPONSE=$(curl -s "http://localhost:8000/api/quotes?symbols=$SYMBOLS")
COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)

if [ "$COUNT" = "10" ]; then
    echo -e "${GREEN}✅ $COUNT indices récupérés${NC}"
    echo ""
    echo "Détails des indices:"
    echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for q in data:
    symbol = q['symbol']
    price = q['price']
    change = q['changePercent']
    color = '\033[0;32m' if change > 0 else '\033[0;31m' if change < 0 else '\033[0m'
    print(f'  {color}• {symbol:12} {price:>10.2f} {change:>+7.2f}%\033[0m')
" 2>/dev/null
else
    echo -e "${RED}❌ Seulement $COUNT indices récupérés (attendu: 10)${NC}"
fi
echo ""

# Test 4: Response Time
echo "4️⃣  Test de performance..."
START=$(date +%s%N)
curl -s "http://localhost:8000/api/quotes?symbols=$SYMBOLS" > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

if [ $DURATION -lt 5000 ]; then
    echo -e "${GREEN}✅ Temps de réponse: ${DURATION}ms${NC}"
else
    echo -e "${YELLOW}⚠️  Temps de réponse lent: ${DURATION}ms${NC}"
fi
echo ""

# Test 5: Cache
echo "5️⃣  Test du cache (2ème requête devrait être plus rapide)..."
START=$(date +%s%N)
curl -s "http://localhost:8000/api/quotes?symbols=$SYMBOLS" > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

if [ $DURATION -lt 100 ]; then
    echo -e "${GREEN}✅ Cache fonctionne: ${DURATION}ms${NC}"
else
    echo -e "${YELLOW}⚠️  Cache peut-être pas actif: ${DURATION}ms${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Tests terminés!${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Ouvrir http://localhost:5173"
echo "  2. Aller sur l'onglet 'Marché Boursier'"
echo "  3. Vérifier que les indices s'affichent"
echo ""
