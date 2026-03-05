# 📊 Overview Tab - Documentation

## Description

The Overview tab provides a unified dashboard that aggregates key information from all sections of the Market Intelligence Platform. It gives users a quick snapshot of the entire system at a glance.

## Location

- **Route**: `/overview`
- **Component**: `src/components/OverviewTab.tsx`
- **Navigation**: First item in the navbar (🏠 Overview)

## Features

### 1. Market Indices Card
- Displays real-time data for major market indices:
  - S&P 500 (^GSPC)
  - Dow Jones (^DJI)
  - Nasdaq (^IXIC)
  - VIX (^VIX)
- Shows current price, change, and percentage change
- Color-coded (green for positive, red for negative)
- Auto-refreshes every 5 minutes
- "View All →" button navigates to Stock Market tab

### 2. AIS Vessel Tracking Card
- Shows total number of vessels being tracked
- Live connection status indicator
- Visual breakdown by vessel type:
  - 🔴 Tankers
  - 🔵 Cargo Ships
  - 🟢 Passenger Ships
- Real-time updates from AIS stream

### 3. Politician Trading Card
- Displays 5 most recent congressional trades
- Shows ticker, trade type (purchase/sale), politician name, and date
- Color-coded badges for trade types
- "View All →" button navigates to Politician Trading tab

### 4. Congress Tracker Card
- Shows total trades and unread alerts count
- Displays 3 most recent trades with full details
- Highlights unread alerts in orange
- Shows politician name, party, and transaction details
- "View All →" button navigates to Congress Tracker tab

### 5. Sectorial Analysis Card
- Visual grid of all 11 economic sectors
- Each sector is clickable and navigates to main analysis
- Color-coded by sector theme
- Sectors included:
  - ⚡ Energy
  - 💻 Tech
  - 🏥 Health
  - 🏦 Finance
  - 🛒 Consumer
  - 🏢 Real Estate
  - ⛏️ Materials
  - 📡 Telecom
  - 🏭 Industrial

### 6. System Status Card
- Real-time status of all system components:
  - AIS Stream (Connected/Disconnected)
  - Market Data (Active/Loading)
  - Congress Tracker (Polling/Idle)
  - News Aggregation (Active)
- Last updated timestamp
- Color-coded status indicators

## Data Sources

The Overview tab aggregates data from:
- `stockDataService` - Market indices quotes
- `politicianTradingService` - Recent congressional trades
- `congressTrackerService` - Congress tracker data and system status
- `AISContext` - Vessel tracking data

## Responsive Design

- Grid layout with `auto-fit` and `minmax(400px, 1fr)`
- Adapts to different screen sizes
- Cards maintain consistent styling
- Hover effects on interactive elements

## Navigation

All cards include "View All →" buttons that navigate to their respective detailed views:
- Market Indices → `/stock-market`
- Politician Trading → `/politician-trading`
- Congress Tracker → `/congress-tracker`
- Sectorial Analysis → `/`

## Styling

- Dark theme consistent with the rest of the app
- Glassmorphism effects with `rgba` backgrounds
- Smooth transitions and hover states
- DM Sans font family for text
- DM Mono font family for numbers and timestamps

## Auto-Refresh

- Market indices: Every 5 minutes
- Other data: Loaded once on mount
- Real-time updates via WebSocket for AIS data

## Error Handling

- Graceful fallbacks for failed API calls
- Loading states for all data sections
- Console error logging for debugging

## Future Enhancements

Potential additions:
- News feed summary
- Top performing stocks
- Alert notifications count
- Portfolio performance summary (when implemented)
- Customizable card layout
- Time range filters
- Export/share functionality
