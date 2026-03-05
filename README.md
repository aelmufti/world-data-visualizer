# 📊 Market Intelligence Platform

Real-time financial market analysis platform with multi-source news aggregation, stock market tracking, politician trading monitoring, and vessel tracking capabilities.

## 🎯 Features

- **Multi-Source News Aggregation**: RSS feeds from Yahoo Finance, MarketWatch, Seeking Alpha, CNBC, Bloomberg
- **Intelligent Scoring System**: Sector relevance + event importance + sentiment + recency decay
- **Stock Market Dashboard**: Real-time stock data, candlestick charts, heatmaps, and watchlists
- **Congress Tracker**: Monitor politician trading activities with automatic PDF parsing
- **Live Vessel Tracking**: Real-time AIS data for oil tankers and cargo ships
- **10 Sectors Covered**: Technology, Finance, Healthcare, Energy, Consumer, Industrial, Materials, Real Estate, Utilities, Telecom
- **Modern UI**: React 18 with Tailwind CSS and responsive design

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

## 🚀 Quick Start Guide

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd world-data-visualizer
```

### Step 2: Install Dependencies

Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 3: Configure Environment Variables

#### Frontend Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Anthropic API Key (for AI analysis)
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

# Backend server URL
VITE_API_URL=http://localhost:8000

# Ollama URL (optional, for local AI)
VITE_OLLAMA_URL=http://localhost:11434

# AIS Stream API (optional, for vessel tracking)
# Sign up at: https://aisstream.io
VITE_AISSTREAM_API_KEY=your_aisstream_api_key_here

# NewsAPI (optional, 100 requests/day free)
# Get key at: https://newsapi.org/register
NEWS_API_KEY=your_newsapi_key_here

# Congress.gov API (optional, for politician data)
# Sign up at: https://api.congress.gov/sign-up/
CONGRESS_API_KEY=your_congress_api_key_here
```

#### Backend Configuration

Create a `.env` file in the server directory:

```bash
cd server
cp .env.example .env
cd ..
```

Edit `server/.env`:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database path
DB_PATH=./data/financial_news.duckdb

# AIS Stream API (for vessel tracking)
AIS_STREAM_API_KEY=your_ais_stream_api_key_here

# Congress.gov API (for politician data)
CONGRESS_API_KEY=your_congress_api_key_here
```

### Step 4: Initialize the Database

The database will be created automatically on first run, but you can seed it with initial data:

```bash
cd server
npm run seed
cd ..
```

### Step 5: Start the Application

You'll need to run three processes. Open three terminal windows:

#### Terminal 1: Start the Backend Server

```bash
cd server
npm run dev
```

The backend will start on `http://localhost:8000`

#### Terminal 2: Start the RSS Worker (News Aggregation)

```bash
cd server
npm run rss-worker
```

This process fetches and scores news articles every 5 minutes.

#### Terminal 3: Start the Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 6: Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

## 🔑 Getting API Keys (Optional but Recommended)

### 1. Anthropic API Key (for AI Analysis)

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Add to `.env` as `VITE_ANTHROPIC_API_KEY`

### 2. AIS Stream API (for Vessel Tracking)

1. Go to [aisstream.io](https://aisstream.io)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add to both `.env` files as `VITE_AISSTREAM_API_KEY` and `AIS_STREAM_API_KEY`

### 3. Congress.gov API (for Politician Trading)

1. Go to [api.congress.gov/sign-up](https://api.congress.gov/sign-up/)
2. Fill out the registration form
3. Receive API key via email
4. Add to both `.env` files as `CONGRESS_API_KEY`

### 4. NewsAPI (for Additional News Sources)

1. Go to [newsapi.org/register](https://newsapi.org/register)
2. Sign up for free tier (100 requests/day)
3. Get your API key
4. Add to `.env` as `NEWS_API_KEY`

## 📁 Project Structure

```
world-data-visualizer/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── StockMarket/         # Stock market components
│   │   ├── AINewsPanel.tsx      # News panel
│   │   ├── CongressTrackerTab.tsx
│   │   ├── OilTankerMap.tsx     # Vessel tracking
│   │   └── ...
│   ├── services/                # API services
│   │   ├── stockDataService.ts
│   │   ├── congressTrackerService.ts
│   │   └── ...
│   ├── data/                    # Static data
│   └── App.tsx                  # Main app component
├── server/                      # Backend source code
│   ├── src/
│   │   ├── index.ts            # Main server
│   │   ├── aggregator-duckdb.ts # News aggregation
│   │   ├── rss-worker-duckdb.ts # RSS worker
│   │   ├── congress-tracker/   # Congress tracking
│   │   ├── stock-market/       # Stock market services
│   │   └── ...
│   └── data/                   # Database files
├── docs/                       # Documentation
├── .env.example               # Frontend env template
├── server/.env.example        # Backend env template
└── README.md                  # This file
```

## 🛠️ Available Scripts

### Frontend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

### Backend Scripts

```bash
cd server

npm run dev          # Start backend server (with hot reload)
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run rss-worker   # Start RSS news worker
npm run seed         # Seed database with initial data
npm run create-api-key # Create a new API key for the backend
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

## 📡 API Endpoints

### News Aggregation

```bash
# Get articles by sector
GET http://localhost:8000/api/aggregated/sector/:sector?limit=15

# Get top articles across all sectors
GET http://localhost:8000/api/aggregated/top?limit=30

# Get all sectors with top articles
GET http://localhost:8000/api/aggregated/all?topPerSector=10
```

### Stock Market

```bash
# Search stocks
GET http://localhost:8000/api/stock-market/search?q=AAPL

# Get historical data
GET http://localhost:8000/api/stock-market/historical/:symbol?period=1mo&interval=1d

# WebSocket for real-time data
WS ws://localhost:8000
```

### Congress Tracker

```bash
# Get politician trades
GET http://localhost:8000/api/politician-trading?limit=50

# Get specific politician's trades
GET http://localhost:8000/api/politician-trading?politician=Nancy%20Pelosi
```

## 🧮 Scoring System

The platform uses an intelligent scoring system for news articles:

```typescript
finalScore = (relevanceScore × 0.6) + (importanceScore × 0.3) + (sentimentScore × 0.1) × decayFactor
```

- **Relevance Score (0-10)**: Based on sector-specific keywords
- **Importance Score (1-10)**: Based on event type (M&A, earnings, etc.)
- **Sentiment Score (0-10)**: Positive/negative sentiment analysis
- **Decay Factor**: Time-based decay (half-life: 4.6 hours)

See `docs/SCORING_METHODOLOGY.md` for detailed information.

## 🔒 Security

- All API keys are stored in `.env` files (not committed to Git)
- `.gitignore` is configured to protect credentials
- Environment variables are validated on startup
- CORS is properly configured

**Before committing code:**
1. Verify no API keys are hardcoded
2. Check that `.env` files are in `.gitignore`
3. Review the security audit report in `docs/SECURITY_AUDIT_REPORT.md`

## 🐛 Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find and kill the process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port in server/.env
PORT=8001
```

### Database Connection Issues

```bash
# Delete and recreate the database
cd server
rm -rf data/financial_news.duckdb*
npm run seed
```

### Missing Dependencies

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

cd server
rm -rf node_modules package-lock.json
npm install
```

### WebSocket Connection Failed

Make sure the backend server is running and the `VITE_API_URL` in `.env` is correct.

## 📚 Additional Documentation

- `docs/SECURITY_AUDIT_REPORT.md` - Security audit and best practices
- `docs/AIS_TEST_USAGE.md` - AIS Stream testing guide
- `server/ARCHITECTURE.md` - Backend architecture
- `server/SCORING_METHODOLOGY.md` - Detailed scoring system
- `server/SCORING_IMPROVEMENTS.md` - Scoring improvements history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - Free to use and modify

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the documentation in the `docs/` folder
3. Check existing issues on GitHub
4. Create a new issue with detailed information

---

**Last Updated**: March 5, 2026

Made with ❤️ for financial market analysis
