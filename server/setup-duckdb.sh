#!/bin/bash

echo "🚀 Setting up DuckDB-based Financial News API"
echo ""

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your API keys if needed."
else
    echo "✅ .env file already exists"
fi

# Seed database
echo "🌱 Seeding database..."
npm run seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start the server: npm run dev"
echo "  2. (Optional) Start RSS worker: npm run rss-worker"
echo ""
echo "The API will be available at http://localhost:8000"
