#!/bin/bash
# Monitor 2026 Congress trades in real-time

echo "🔍 Monitoring 2026 Congress Trades"
echo "=================================="
echo ""

while true; do
  # Get current count
  COUNT=$(curl -s "http://localhost:8000/api/congress/trades" | jq '[.trades[] | select(.transaction_date | startswith("2026"))] | length')
  
  # Get last poll time
  LAST_POLL=$(curl -s "http://localhost:8000/api/congress/status" | jq -r '.lastPollTime')
  
  # Clear screen and show status
  clear
  echo "🔍 2026 Congress Trades Monitor"
  echo "=================================="
  echo ""
  echo "📊 Current 2026 Trades: $COUNT"
  echo "⏰ Last Poll: $LAST_POLL"
  echo "🔄 Next Poll: ~60 minutes after last poll"
  echo ""
  echo "Recent 2026 Trades:"
  echo "-------------------"
  
  # Show recent trades
  curl -s "http://localhost:8000/api/congress/trades" | jq -r '.trades[] | select(.transaction_date | startswith("2026")) | "\(.politician) (\(.party)-\(.state)) - \(.ticker) \(.action) on \(.transaction_date)"'
  
  echo ""
  echo "Press Ctrl+C to stop monitoring"
  echo "Refreshing in 30 seconds..."
  
  sleep 30
done
