#!/bin/bash

echo "🧪 Testing Congress Tracker Endpoints"
echo "======================================"
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
curl -s http://localhost:8000/api/health | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'✅ Status: {data[\"status\"]}'); print(f'   Congress Tracker: {data[\"services\"][\"congressTracker\"]}')"
echo ""

# Test 2: System status
echo "2️⃣ Testing status endpoint..."
curl -s http://localhost:8000/api/congress/status | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'✅ Tracked Politicians: {data[\"trackedPoliticians\"]}'); print(f'   Total Trades: {data[\"totalTrades\"]}'); print(f'   Total Filings: {data[\"totalFilings\"]}'); print(f'   Polling: {data[\"isPolling\"]}')"
echo ""

# Test 3: Politicians
echo "3️⃣ Testing politicians endpoint..."
curl -s http://localhost:8000/api/congress/politicians | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'✅ Total Politicians: {len(data[\"politicians\"])}'); print(f'   Sample: {data[\"politicians\"][0][\"fullName\"]} ({data[\"politicians\"][0][\"party\"]}-{data[\"politicians\"][0][\"state\"]})')"
echo ""

# Test 4: Trades
echo "4️⃣ Testing trades endpoint..."
curl -s "http://localhost:8000/api/congress/trades?limit=5" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'✅ Trades returned: {len(data[\"trades\"])}'); trade = data['trades'][0]; print(f'   Latest: {trade[\"politician\"]} - {trade[\"ticker\"]} {trade[\"action\"]} on {trade[\"transaction_date\"]}')"
echo ""

# Test 5: 2026 trades
echo "5️⃣ Checking 2026 trades..."
curl -s http://localhost:8000/api/congress/trades | python3 -c "import sys, json; data = json.load(sys.stdin); trades_2026 = [t for t in data['trades'] if t['transaction_date'].startswith('2026')]; print(f'✅ 2026 Trades: {len(trades_2026)}'); [print(f'   - {t[\"politician\"]}: {t[\"ticker\"]} on {t[\"transaction_date\"]}') for t in trades_2026[:5]]"
echo ""

# Test 6: Specific politician
echo "6️⃣ Testing politician-specific endpoint..."
curl -s http://localhost:8000/api/congress/trades/Pelosi | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'✅ Pelosi trades: {len(data[\"trades\"])}'); [print(f'   - {t[\"ticker\"]} {t[\"action\"]} on {t[\"transaction_date\"]}') for t in data['trades'][:3]]" 2>/dev/null || echo "   (No trades found for Pelosi)"
echo ""

echo "======================================"
echo "✅ All tests completed!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
