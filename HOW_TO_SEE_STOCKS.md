# 📊 How to See the Stocks Politicians Picked

## Quick Access

### Option 1: Web Browser (Recommended)
1. Open your browser
2. Go to: **http://localhost:5173**
3. Click **"Trading Politique 🏛️"** in the navbar
4. You'll see the stocks immediately!

### Option 2: API (For Developers)
```bash
curl http://localhost:8000/api/politician-trading/featured
```

## What You'll See

### Top Performers Section
At the top, you'll see cards for each high-performing politician:
- **Nancy Pelosi** - 56.0% return rate
- **Warren Davidson** - 78.8% return rate
- **Donald Norcross** - 70.8% return rate
- **Terri Sewell** - 67.9% return rate
- **Bryan Steil** - 62.5% return rate
- **Nick LaLota** - 61.6% return rate
- **Michael Guest** - 52.5% return rate
- **Tom McClintock** - 50.0% return rate
- **Dwight Evans** - 48.0% return rate

### Stocks Table
Below that, you'll see a table with all their trades:

| Ticker | Politician | Return | Asset | Action | Date | Amount |
|--------|-----------|--------|-------|--------|------|--------|
| AVGO | Nancy Pelosi | 56.0% | Broadcom Inc. | ▲ BUY | Jun 26, 2024 | $1M – $5M |
| MSFT | Nancy Pelosi | 56.0% | Microsoft | ▼ SELL | Jul 26, 2024 | $1M – $5M |
| GOOGL | Nancy Pelosi | 56.0% | Alphabet | ▲ BUY | Jan 14, 2025 | $250K – $500K |
| NVDA | Michael Guest | 52.5% | NVIDIA | ▲ BUY | Feb 20, 2024 | $200 |
| MPWR | Michael Guest | 52.5% | Monolithic Power | ▲ BUY | Oct 20, 2025 | $200 |

## Features

### Toggle Views
- **🏆 Top Performers**: Shows only the featured high-return politicians
- **📊 All Trades**: Shows all congressional trades

### Filters
- **Action Filter**: All / Buy / Sell
- **Ticker Filter**: Filter by specific stock (AVGO, NVDA, GOOGL, etc.)

### Color-Coded Tickers
Each ticker has a unique color:
- **GOOGL**: Blue (#4285F4)
- **AMZN**: Orange (#FF9900)
- **NVDA**: Green (#76B900)
- **AAPL**: Gray (#A2AAAD)
- **MSFT**: Blue (#00A4EF)

### Interactive Features
- Hover over rows to highlight
- Click ticker badges to filter
- Click PDF links to see original filings

## Stocks They're Trading

### Nancy Pelosi's Picks (5 trades)
1. **AVGO (Broadcom)** - $1M-$5M purchase (Jun 2024)
2. **MSFT (Microsoft)** - $1M-$5M sale (Jul 2024)
3. **GOOGL (Alphabet)** - $250K-$500K purchase (Jan 2025)
4. **AVGO (Broadcom)** - $200 purchase (Jun 2025)
5. **DIS (Disney)** - $1M-$5M sale (Dec 2025)

### Michael Guest's Picks (2 trades)
1. **NVDA (NVIDIA)** - $200 purchase (Feb 2024) 🔥
2. **MPWR (Monolithic Power)** - $200 purchase (Oct 2025)

### Terri Sewell's Picks (1 trade)
1. **NVDA (NVIDIA)** - $200 purchase (Feb 2024) 🔥

## Key Insights

### Most Popular Stocks
1. **AVGO (Broadcom)** - 2 trades
2. **NVDA (NVIDIA)** - 2 trades
3. **GOOGL, MSFT, DIS, MPWR** - 1 trade each

### Trading Patterns
- **Heavy Tech Focus**: NVDA, GOOGL, MSFT, AVGO
- **Large Positions**: Multiple $1M+ trades
- **Options Trading**: Pelosi uses call options frequently
- **Spouse Ownership**: Most trades owned by spouse

### Timing
- **NVDA Feb 2024**: Guest and Sewell bought before the AI boom 🚀
- **AVGO Jun 2024**: Pelosi bought before major gains
- **GOOGL Jan 2025**: Pelosi bought call options

## Screenshots

When you open the page, you'll see:

```
┌─────────────────────────────────────────────────────────┐
│  🏛️ Congressional Trading                               │
│  U.S. House & Senate · Stock Disclosures               │
│                                                         │
│  Total: 8    Buys: 5    Sells: 3                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🏆 TOP PERFORMERS BY RETURN RATE                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Nancy Pelosi │  │ Warren       │  │ Donald       │ │
│  │ 🔵 Democrat  │  │ Davidson     │  │ Norcross     │ │
│  │ CA           │  │ 🔴 Republican│  │ 🔵 Democrat  │ │
│  │              │  │ OH           │  │ NJ           │ │
│  │ 56.0%        │  │ 78.8%        │  │ 70.8%        │ │
│  │ Return Rate  │  │ Return Rate  │  │ Return Rate  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘

[🏆 Top Performers] [📊 All Trades]

[All] [Buy] [Sell] | [All] [AVGO] [NVDA] [GOOGL] [MSFT]

┌─────────────────────────────────────────────────────────┐
│ Ticker │ Politician    │ Return │ Asset      │ Action  │
├────────┼───────────────┼────────┼────────────┼─────────┤
│ AVGO   │ Nancy Pelosi  │ 56.0%  │ Broadcom   │ ▲ BUY   │
│ MSFT   │ Nancy Pelosi  │ 56.0%  │ Microsoft  │ ▼ SELL  │
│ GOOGL  │ Nancy Pelosi  │ 56.0%  │ Alphabet   │ ▲ BUY   │
│ NVDA   │ Michael Guest │ 52.5%  │ NVIDIA     │ ▲ BUY   │
└─────────────────────────────────────────────────────────┘
```

## Access Now

Just open: **http://localhost:5173** and click **"Trading Politique 🏛️"**

All the stocks they picked are right there! 🎯
