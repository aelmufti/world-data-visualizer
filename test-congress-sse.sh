#!/bin/bash

# Test the Congress tracker SSE stream
# This will connect to the real-time alert stream

echo "🔔 Connecting to Congress trade alert stream..."
echo "📡 Listening for new trades..."
echo ""
echo "Press Ctrl+C to stop"
echo "---"
echo ""

curl -N http://localhost:8000/api/congress/alerts/stream
