#!/bin/bash

echo "Testing Financial News API..."
echo ""

# Test root endpoint
echo "1. Testing root endpoint..."
curl -s http://localhost:8000/ | jq .
echo ""

# Test articles endpoint (will need API key)
echo "2. Testing /articles endpoint (should return 401 without API key)..."
curl -s http://localhost:8000/articles | jq .
echo ""

echo "Done! Once you have an API key, test with:"
echo 'curl -H "X-API-Key: your_key" http://localhost:8000/articles'
