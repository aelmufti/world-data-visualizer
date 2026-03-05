# Fear & Greed Index Feature

## Overview
Added Fear & Greed Index indicators for both crypto and stock markets to provide real-time sentiment analysis.

## Features

### 📊 Dual Market Coverage
- **Stock Market Index**: Calculated from VIX volatility index
- **Crypto Market Index**: Real-time data from Alternative.me API

### 🎨 Visual Gauge Display
- Animated needle gauge showing sentiment from 0-100
- Color-coded gradient (Red → Orange → Gray → Green)
- Real-time classification (Extreme Fear, Fear, Neutral, Greed, Extreme Greed)

### 📈 Integration Points
- Added to Overview tab for quick market sentiment snapshot
- Auto-refreshes every 30 minutes
- Cached on backend for 1 hour to reduce API calls

## API Endpoints

### GET `/api/fear-greed/crypto`
Fetches crypto market Fear & Greed Index from Alternative.me

**Response:**
```json
{
  "value": 45,
  "classification": "Fear",
  "color": "#F97316",
  "timestamp": "2026-03-05T10:30:00Z",
  "valueClassification": "Fear",
  "source": "Alternative.me"
}
```

### GET `/api/fear-greed/stock`
Calculates stock market Fear & Greed Index based on VIX

**Response:**
```json
{
  "value": 62,
  "classification": "Greed",
  "color": "#10B981",
  "timestamp": "2026-03-05T10:30:00Z",
  "vix": 15.23,
  "source": "Calculated from VIX",
  "note": "Approximation based on VIX volatility index"
}
```

### GET `/api/fear-greed/both`
Fetches both indices in a single request

**Response:**
```json
{
  "crypto": { ... },
  "stock": { ... },
  "timestamp": "2026-03-05T10:30:00Z"
}
```

## Classification Scale

| Value Range | Classification | Color |
|-------------|---------------|-------|
| 0-25 | Extreme Fear | Red (#EF4444) |
| 26-45 | Fear | Orange (#F97316) |
| 46-55 | Neutral | Gray (#64748B) |
| 56-75 | Greed | Green (#10B981) |
| 76-100 | Extreme Greed | Bright Green (#22C55E) |

## Technical Details

### Frontend Components
- `src/components/FearGreedPanel.tsx` - Main display component with gauges
- `src/services/fearGreedService.ts` - API service layer

### Backend Services
- `server/src/fear-greed-endpoint.ts` - Express router with caching

### Data Sources
- **Crypto**: Alternative.me Fear & Greed Index API (free, no auth required)
- **Stock**: Calculated approximation using VIX from Yahoo Finance

### Calculation Logic (Stock Market)
```
VIX < 12:   value = 80-100 (Extreme Greed)
VIX 12-20:  value = 50-80  (Greed/Neutral)
VIX 20-30:  value = 25-50  (Fear)
VIX > 30:   value = 0-25   (Extreme Fear)
```

## Usage

The Fear & Greed Index is automatically displayed on the Overview tab. It provides:
- Quick sentiment snapshot for both markets
- Visual gauge representation
- Color-coded classifications
- Automatic updates every 30 minutes

## Future Enhancements
- Add historical trend charts
- Include more factors in stock market calculation (put/call ratio, market breadth, etc.)
- Add alerts for extreme sentiment levels
- Show sentiment change over time
