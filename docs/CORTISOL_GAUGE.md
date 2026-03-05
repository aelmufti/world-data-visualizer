# Market Cortisol Level Gauge

## Overview

The Market Cortisol Level is an aggregate stress indicator that combines multiple market signals to provide a single, easy-to-understand measure of overall market stress and anxiety.

## Location

The Cortisol Gauge is displayed in the Overview tab, positioned directly below the Fear & Greed Index panel.

## What It Measures

The cortisol level (0-100) represents the overall stress level in the market, calculated from four key factors:

### Contributing Factors

1. **Fear & Greed Index (35% weight)**
   - Inverted: High fear = High cortisol
   - Combines both stock and crypto market sentiment
   - Source: CNN Fear & Greed (via VIX) + Alternative.me Crypto Index

2. **News Sentiment (30% weight)**
   - Analyzes sentiment from last 24 hours of news articles
   - Negative sentiment = Higher cortisol
   - Source: DuckDB news aggregation with NLP sentiment analysis

3. **Market Volatility (25% weight)**
   - Based on VIX (Volatility Index)
   - Higher volatility = Higher stress
   - Source: Yahoo Finance VIX data

4. **News Volume (10% weight)**
   - Number of news articles in last 24 hours
   - High volume = Increased market activity/stress
   - Source: DuckDB article count

## Classification Levels

| Level | Range | Color | Emoji | Meaning |
|-------|-------|-------|-------|---------|
| Zen | 0-20 | Green | 😌 | Market is calm, low stress |
| Calm | 21-40 | Light Green | 🙂 | Normal conditions, slight activity |
| Alert | 41-60 | Yellow | 😐 | Moderate stress, pay attention |
| Stressed | 61-80 | Orange | 😰 | High stress, significant volatility |
| Panic | 81-100 | Red | 😱 | Extreme stress, market turmoil |

## Features

### Main Display
- Large animated gauge with color gradient (green to red)
- Real-time needle indicator
- Large numeric value (0-100)
- Classification label with emoji

### Details Panel (Expandable)
- Shows contribution from each factor
- Visual progress bars for each component
- Exact contribution values
- Helps understand what's driving the stress level

### Auto-Refresh
- Updates every 10 minutes
- Cached on backend for performance
- Timestamp shows last update time

## API Endpoint

```
GET /api/cortisol
```

### Response Format

```json
{
  "level": 65,
  "classification": "Stressed",
  "color": "#F97316",
  "factors": {
    "fearGreed": {
      "value": 35,
      "weight": 0.35,
      "contribution": 23
    },
    "newsSentiment": {
      "value": -0.15,
      "weight": 0.30,
      "contribution": 17
    },
    "marketVolatility": {
      "value": 28.5,
      "weight": 0.25,
      "contribution": 18
    },
    "newsVolume": {
      "value": 145,
      "weight": 0.10,
      "contribution": 7
    }
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

## Use Cases

1. **Quick Market Assessment**: Get an instant read on overall market stress
2. **Risk Management**: Higher cortisol = Consider reducing exposure
3. **Opportunity Detection**: Extreme levels (very low or very high) may signal opportunities
4. **Trend Monitoring**: Track how stress levels change over time
5. **Correlation Analysis**: Compare with your portfolio performance

## Technical Implementation

### Backend
- **File**: `server/src/cortisol-endpoint.ts`
- **Database**: DuckDB for news sentiment queries
- **Caching**: 10-minute cache via NodeCache
- **Dependencies**: Fear & Greed API, DuckDB, Yahoo Finance

### Frontend
- **Component**: `src/components/CortisolGauge.tsx`
- **Service**: `src/services/cortisolService.ts`
- **Styling**: Neumorphic design matching app theme
- **Animation**: Smooth needle transitions with cubic-bezier easing

## Future Enhancements

Potential improvements:
- Historical cortisol level chart
- Alerts when crossing thresholds
- Customizable factor weights
- Additional factors (social media sentiment, options flow, etc.)
- Sector-specific cortisol levels
- Correlation with portfolio performance
