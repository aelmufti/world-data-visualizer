# Implementation Plan: Live Stock Market Tab

## Overview

This implementation plan breaks down the Live Stock Market Tab feature into discrete, incremental coding tasks. The feature provides real-time market monitoring with WebSocket streaming, interactive candlestick charts, watchlist management, price alerts, market heatmaps, and comparison tools. Each task builds on previous work, with property-based tests validating correctness properties from the design document.

The implementation follows a phased approach: Core Infrastructure → Basic UI Components → Advanced Features → Visualizations → Polish & Testing.

## Tasks

- [x] 1. Install dependencies and set up project structure
  - Install frontend dependencies: lightweight-charts, fast-check, @fast-check/vitest, d3, @types/d3, fuse.js
  - Install backend dependencies: ws, @types/ws
  - Create directory structure: src/components/StockMarket/, server/src/stock-market/
  - Set up TypeScript interfaces in src/types/stock-market.ts
  - _Requirements: 20.1, 20.2, 20.3_

- [x] 2. Implement backend WebSocket server for real-time price streaming
  - [x] 2.1 Create WebSocket server class in server/src/stock-market/websocket-server.ts
    - Implement StockWebSocketServer with subscription management
    - Add per-symbol subscription tracking with Map<string, Set<WebSocket>>
    - Implement subscribe/unsubscribe message handlers
    - Add heartbeat ping/pong mechanism (30s interval)
    - Implement rate limiting (max 100 symbols per client)
    - Add automatic cleanup on client disconnect
    - _Requirements: 3.1, 3.3, 15.6_

  - [x] 2.2 Write property test for WebSocket subscription management
    - **Property 6: WebSocket connection during market hours**
    - **Validates: Requirements 3.1**

  - [x] 2.3 Integrate WebSocket server with Express app in server/src/index.ts
    - Mount WebSocket server on port 8001
    - Add WebSocket upgrade handler
    - Configure CORS for WebSocket connections
    - _Requirements: 3.1_

  - [x] 2.4 Write unit tests for WebSocket server
    - Test subscription/unsubscription flow
    - Test broadcast to multiple clients
    - Test heartbeat and disconnection handling
    - _Requirements: 3.1, 3.3_


- [x] 3. Implement backend market data service and APIs
  - [x] 3.1 Create market data service in server/src/stock-market/market-data-service.ts
    - Extend existing Yahoo Finance integration from market-data.ts
    - Implement real-time quote fetching with caching (1-minute cache)
    - Add batch quote endpoint support
    - Implement price update polling for WebSocket broadcast
    - _Requirements: 3.1, 3.2, 15.1, 15.2_

  - [x] 3.2 Create historical data API endpoint GET /api/stock/history/:symbol
    - Accept query params: interval (1m, 5m, 15m, 1h, 1d), range (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y)
    - Fetch OHLCV data from Yahoo Finance
    - Implement LRU cache with 5-minute TTL for intraday, 1-hour for daily
    - Return CandleData[] with metadata
    - _Requirements: 5.2, 5.3, 9.1, 9.2, 9.4_

  - [x] 3.3 Write property test for historical data caching
    - **Property 37: Historical data caching**
    - **Validates: Requirements 9.4**

  - [x] 3.4 Create stock search API endpoint GET /api/stock/search
    - Build symbol database JSON file with US, EU, and Asian stocks
    - Implement Fuse.js fuzzy search on symbol and company name
    - Accept query params: q (query), limit (default 10), types (stock/index/etf)
    - Return SearchResult[] with symbol, name, exchange, type
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [x] 3.5 Write property test for search result limiting
    - **Property 22: Search result limiting**
    - **Validates: Requirements 6.4**

  - [x] 3.6 Create market hours service in server/src/stock-market/market-hours-service.ts
    - Define market hours for US (NYSE/NASDAQ), EU (Euronext), ASIA (TSE)
    - Implement getMarketStatus() with timezone conversion
    - Implement getNextMarketEvent() for countdown calculations
    - Add holiday checking for 2025-2026
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 8.1, 8.5, 8.6_

  - [x] 3.7 Write unit tests for market hours service
    - Test market status calculation for different timezones
    - Test holiday detection
    - Test next event calculation
    - _Requirements: 4.4, 8.6_

- [x] 4. Checkpoint - Backend infrastructure complete
  - Ensure all backend tests pass
  - Verify WebSocket server accepts connections
  - Test historical data API with sample requests
  - Ask the user if questions arise


- [x] 5. Create frontend TypeScript types and interfaces
  - [x] 5.1 Define core data models in src/types/stock-market.ts
    - Create StockQuote, CandleData, PriceAlert, MarketStatus interfaces
    - Create StockMetrics, WatchlistItem, HeatmapData interfaces
    - Create WebSocket message types (WSClientMessage, WSServerMessage)
    - Create Timeframe type union
    - _Requirements: All (foundational)_

  - [x] 5.2 Define component prop interfaces
    - Create props for IndexDisplay, CandlestickChart, StockSearch
    - Create props for WatchlistPanel, AlertPanel, MarketStatusIndicator
    - Create props for HeatmapView, ComparisonView
    - _Requirements: All (foundational)_

- [x] 6. Implement WebSocket client service
  - [x] 6.1 Create WebSocket client in src/services/stockWebSocket.ts
    - Implement connection management with auto-reconnect (5s interval, max 3 attempts)
    - Add subscribe/unsubscribe methods
    - Implement message parsing and event emission
    - Add heartbeat ping/pong handling
    - Implement fallback to polling when WebSocket unavailable
    - _Requirements: 3.1, 3.3, 15.6_

  - [x] 6.2 Write property test for WebSocket reconnection
    - **Property 8: WebSocket reconnection behavior**
    - **Validates: Requirements 3.3**

  - [x] 6.3 Write property test for WebSocket fallback
    - **Property 63: WebSocket fallback to polling**
    - **Validates: Requirements 15.6**

  - [x] 6.2 Create stock data service in src/services/stockDataService.ts
    - Implement fetchQuote() for single stock
    - Implement fetchBatchQuotes() for multiple stocks
    - Implement fetchHistoricalData() with caching
    - Implement searchStocks() with 300ms debouncing
    - Add exponential backoff retry logic
    - _Requirements: 6.2, 9.2, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 6.3 Write property test for search debouncing
    - **Property 60: Search input debouncing**
    - **Validates: Requirements 15.3**

  - [x] 6.4 Write property test for exponential backoff
    - **Property 62: Exponential backoff retry**
    - **Validates: Requirements 15.5**


- [x] 7. Implement localStorage utilities for persistence
  - [x] 7.1 Create localStorage service in src/services/stockStorage.ts
    - Implement saveWatchlist() and loadWatchlist() with version 1 schema
    - Implement saveAlerts() and loadAlerts() with version 1 schema
    - Implement savePreferences() and loadPreferences() with version 1 schema
    - Implement saveRecentSearches() and loadRecentSearches() (max 10 items)
    - Add error handling for quota exceeded
    - _Requirements: 7.4, 17.5_

  - [x] 7.2 Write property test for watchlist persistence
    - **Property 27: Watchlist persistence**
    - **Validates: Requirements 7.4**

  - [x] 7.3 Write property test for alert persistence
    - **Property 72: Alert persistence**
    - **Validates: Requirements 17.5**

- [x] 8. Create main StockMarketTab container component
  - [x] 8.1 Implement StockMarketTab component in src/components/StockMarket/StockMarketTab.tsx
    - Create component with state: activeView, selectedSymbol, watchlist, alerts, marketStatus
    - Initialize WebSocket connection on mount
    - Implement view routing (overview, chart, heatmap, comparison)
    - Add error boundary wrapper
    - Load persisted data from localStorage
    - _Requirements: 1.1, 1.2, 7.4, 17.5_

  - [x] 8.2 Write property test for navigation
    - **Property 1: Navigation to stock market view**
    - **Validates: Requirements 1.2**

  - [x] 8.3 Add route to App.tsx for /stock-market path
    - Configure React Router route
    - _Requirements: 1.2_

- [x] 9. Integrate Stock Market tab into Navbar
  - [x] 9.1 Add Stock Market tab to Navbar component
    - Add navigation item with stock chart icon and "Marché Boursier" label
    - Implement active state styling
    - Add onClick handler to navigate to /stock-market
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 9.2 Write property test for active tab styling
    - **Property 2: Active tab styling**
    - **Validates: Requirements 1.4**


- [x] 10. Implement IndexDisplay component
  - [x] 10.1 Create IndexDisplay component in src/components/StockMarket/IndexDisplay.tsx
    - Display major indexes: S&P 500, NASDAQ, DOW, Russell 2000, VIX
    - Display international indexes: CAC 40, DAX, FTSE 100, Nikkei 225, Shanghai Composite
    - Show current value, absolute change, percentage change for each
    - Implement color coding: green for positive, red for negative, neutral for zero
    - Add responsive grid layout (3 columns desktop, 2 mobile)
    - Implement click handler to view detailed chart
    - Subscribe to WebSocket updates for real-time data
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 11.5_

  - [x] 10.2 Write property test for index display completeness
    - **Property 3: Index display completeness**
    - **Validates: Requirements 2.2**

  - [x] 10.3 Write property test for value change color coding
    - **Property 4: Value change color coding**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 10.4 Write property test for index update latency
    - **Property 5: Index update latency**
    - **Validates: Requirements 2.5**

  - [x] 10.5 Write unit tests for IndexDisplay
    - Test rendering of all required indexes
    - Test click navigation to chart view
    - Test responsive layout breakpoints
    - _Requirements: 2.1, 2.6, 11.5_

- [x] 11. Implement MarketStatusIndicator component
  - [x] 11.1 Create MarketStatusIndicator in src/components/StockMarket/MarketStatusIndicator.tsx
    - Display status for US, EU, and ASIA markets
    - Show status: Open (green), Closed (red), Pre-Market/After-Hours (yellow)
    - Display next market event time with countdown timer
    - Fetch market status from backend market hours service
    - Update status automatically when market hours change
    - Apply timezone conversion for user's local time
    - _Requirements: 4.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 11.2 Write property test for market status display
    - **Property 31: Market status display**
    - **Validates: Requirements 8.1**

  - [x] 11.3 Write property test for market status color coding
    - **Property 32: Market status color coding**
    - **Validates: Requirements 8.2, 8.3, 8.4**

  - [x] 11.4 Write property test for automatic status updates
    - **Property 34: Automatic market status updates**
    - **Validates: Requirements 8.6**


- [x] 12. Implement CandlestickChart component with Lightweight Charts
  - [x] 12.1 Create CandlestickChart component in src/components/StockMarket/CandlestickChart.tsx
    - Integrate lightweight-charts library
    - Display OHLC candlestick series with volume bars
    - Implement timeframe selector: 1m, 5m, 15m, 1h, 1d, 5d, 1M, 3M, 6M, 1Y, 5Y
    - Add real-time candle updates for current period
    - Implement zoom and pan controls
    - Add crosshair with OHLC tooltip on hover
    - Apply candle color coding: green (close > open), red (close < open)
    - Fetch historical data via stockDataService
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 9.1, 9.2, 9.3_

  - [x] 12.2 Write property test for OHLC data completeness
    - **Property 15: OHLC data completeness**
    - **Validates: Requirements 5.2**

  - [x] 12.3 Write property test for real-time candle updates
    - **Property 16: Real-time candle updates**
    - **Validates: Requirements 5.4**

  - [x] 12.4 Write property test for candle color coding
    - **Property 19: Candle color coding**
    - **Validates: Requirements 5.8, 5.9**

  - [x] 12.5 Write property test for minimum data points
    - **Property 36: Minimum data points**
    - **Validates: Requirements 9.3**

  - [x] 12.6 Write unit tests for CandlestickChart
    - Test chart rendering with sample data
    - Test timeframe switching
    - Test zoom and pan interactions
    - Test tooltip display on hover
    - _Requirements: 5.6, 5.7_

- [x] 13. Checkpoint - Basic UI components complete
  - Ensure IndexDisplay shows all indexes with real-time updates
  - Verify MarketStatusIndicator displays correct status
  - Test CandlestickChart with different timeframes
  - Verify navigation and routing works
  - Ask the user if questions arise


- [x] 14. Implement StockSearch component with autocomplete
  - [x] 14.1 Create StockSearch component in src/components/StockMarket/StockSearch.tsx
    - Create search input field with debounced onChange (300ms)
    - Fetch autocomplete suggestions from /api/stock/search
    - Display up to 10 suggestions with symbol, name, exchange, type
    - Implement keyboard navigation (arrow keys, enter, escape)
    - Show "No results found" message when empty
    - Store recent searches in localStorage (max 10)
    - Call onSelect callback when stock is chosen
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 11.4_

  - [x] 14.2 Write property test for autocomplete performance
    - **Property 20: Search autocomplete performance**
    - **Validates: Requirements 6.2**

  - [x] 14.3 Write property test for search matching scope
    - **Property 21: Search matching scope**
    - **Validates: Requirements 6.3**

  - [x] 14.4 Write property test for screen reader compatibility
    - **Property 57: Screen reader compatible autocomplete**
    - **Validates: Requirements 14.5**

  - [x] 14.5 Write unit tests for StockSearch
    - Test autocomplete display
    - Test keyboard navigation
    - Test "No results found" message
    - Test recent searches functionality
    - _Requirements: 6.7, 14.5_

- [x] 15. Implement StockDetailView component
  - [x] 15.1 Create StockDetailView in src/components/StockMarket/StockDetailView.tsx
    - Display stock symbol, name, current price, change, percentage change
    - Show volume, market cap, and intraday chart
    - Display performance metrics: 52-week high/low, YTD change, 30-day avg volume
    - Show conditional metrics: P/E ratio, dividend yield, beta (when available)
    - Integrate CandlestickChart for detailed view
    - Subscribe to real-time price updates
    - _Requirements: 6.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 15.2 Write property test for stock selection detail display
    - **Property 23: Stock selection detail display**
    - **Validates: Requirements 6.5**

  - [x] 15.3 Write property test for performance metrics display
    - **Property 38: Performance metrics display**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 15.4 Write property test for conditional stock metrics
    - **Property 39: Conditional stock metrics display**
    - **Validates: Requirements 10.4, 10.5**


- [x] 16. Implement WatchlistPanel component
  - [x] 16.1 Create WatchlistPanel in src/components/StockMarket/WatchlistPanel.tsx
    - Display list of watchlist stocks with symbol, price, change, percentage change
    - Implement add stock via StockSearch integration
    - Add remove button with confirmation for each stock
    - Implement drag-and-drop reordering (react-beautiful-dnd or native)
    - Enforce 50-stock capacity limit with error message
    - Subscribe to real-time price updates for watchlist stocks
    - Persist watchlist changes to localStorage
    - Support compact and expanded view modes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 16.2 Write property test for watchlist addition
    - **Property 24: Watchlist addition**
    - **Validates: Requirements 7.1**

  - [x] 16.3 Write property test for watchlist capacity limit
    - **Property 25: Watchlist capacity limit**
    - **Validates: Requirements 7.2**

  - [x] 16.4 Write property test for watchlist item display
    - **Property 26: Watchlist item display completeness**
    - **Validates: Requirements 7.3**

  - [x] 16.5 Write property test for watchlist removal
    - **Property 28: Watchlist removal**
    - **Validates: Requirements 7.5**

  - [x] 16.6 Write property test for watchlist reordering
    - **Property 29: Watchlist reordering**
    - **Validates: Requirements 7.6**

  - [x] 16.7 Write property test for watchlist update latency
    - **Property 30: Watchlist update latency**
    - **Validates: Requirements 7.7**

  - [x] 16.8 Write unit tests for WatchlistPanel
    - Test drag-and-drop reordering
    - Test capacity limit enforcement
    - Test compact/expanded view toggle
    - _Requirements: 7.2, 7.6_


- [x] 17. Implement AlertPanel component with price alerts
  - [x] 17.1 Create AlertPanel in src/components/StockMarket/AlertPanel.tsx
    - Display list of active price alerts with symbol, condition, target price, status
    - Create form to add new alerts: select stock from watchlist, choose condition (above/below), set target price
    - Implement enable/disable toggle for each alert
    - Add edit and delete actions for alerts
    - Enforce 20-alert capacity limit with error message
    - Persist alerts to localStorage
    - _Requirements: 17.1, 17.2, 17.4, 17.5, 17.6_

  - [x] 17.2 Implement alert monitoring service in src/services/alertService.ts
    - Monitor watchlist stock prices against active alerts
    - Trigger browser notification when alert condition is met
    - Auto-disable alert after triggering
    - Request notification permissions on first alert creation
    - _Requirements: 4.5, 17.3, 17.7_

  - [x] 17.3 Write property test for alert creation
    - **Property 69: Alert creation for watchlist stocks**
    - **Validates: Requirements 17.1, 17.2**

  - [x] 17.4 Write property test for alert triggering
    - **Property 70: Alert triggering**
    - **Validates: Requirements 17.3**

  - [x] 17.5 Write property test for alert CRUD operations
    - **Property 71: Alert CRUD operations**
    - **Validates: Requirements 17.4**

  - [x] 17.6 Write property test for alert capacity limit
    - **Property 73: Alert capacity limit**
    - **Validates: Requirements 17.6**

  - [x] 17.7 Write property test for alert auto-disable
    - **Property 74: Alert auto-disable on trigger**
    - **Validates: Requirements 17.7**

  - [x] 17.8 Write property test for browser notification integration
    - **Property 12: Browser notification integration**
    - **Validates: Requirements 4.5**

  - [x] 17.9 Write unit tests for AlertPanel
    - Test alert form validation
    - Test notification permission handling
    - Test alert triggering logic
    - _Requirements: 17.3, 4.5_


- [x] 18. Implement market event notification system
  - [x] 18.1 Create MarketAlertSystem in src/services/marketAlertSystem.ts
    - Monitor market opening/closing events for US, EU, and ASIA markets
    - Display in-app notifications for market events with market name and time
    - Send browser notifications when permissions granted
    - Display countdown timer when markets are closed
    - Calculate times based on user's local timezone
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 18.2 Write property test for market event notifications
    - **Property 10: Market event notifications**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 18.3 Write property test for timezone-aware market times
    - **Property 11: Timezone-aware market times**
    - **Validates: Requirements 4.4**

  - [x] 18.4 Write property test for market closed countdown
    - **Property 13: Market closed countdown**
    - **Validates: Requirements 4.6**

- [x] 19. Integrate news feed with existing aggregation system
  - [x] 19.1 Create NewsFeed component in src/components/StockMarket/NewsFeed.tsx
    - Fetch news from existing /api/aggregated/sector/:sector endpoint
    - Display article title, source, timestamp, sentiment indicator
    - Implement stock-specific filtering when viewing individual stock
    - Show up to 20 articles with infinite scroll loading
    - Auto-update when new articles available
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 19.2 Write property test for news feed integration
    - **Property 64: News feed integration**
    - **Validates: Requirements 16.2**

  - [x] 19.3 Write property test for stock-specific news filtering
    - **Property 65: Stock-specific news filtering**
    - **Validates: Requirements 16.3**

  - [x] 19.4 Write property test for news article display
    - **Property 66: News article display completeness**
    - **Validates: Requirements 16.4**

  - [x] 19.5 Write unit tests for NewsFeed
    - Test infinite scroll loading
    - Test auto-update mechanism
    - Test stock filtering
    - _Requirements: 16.3, 16.5, 16.6_

- [x] 20. Checkpoint - Advanced features complete
  - Verify watchlist management with add/remove/reorder
  - Test price alerts with notifications
  - Verify market event notifications
  - Test news feed integration
  - Ask the user if questions arise


- [x] 21. Implement HeatmapView component with D3.js
  - [x] 21.1 Create HeatmapView in src/components/StockMarket/HeatmapView.tsx
    - Implement D3.js treemap layout for stock visualization
    - Size rectangles proportionally to market capitalization
    - Color cells by percentage change: green (gains), red (losses), intensity by magnitude
    - Display tooltip on hover: symbol, name, price, change
    - Implement click handler to navigate to stock detail view
    - Group stocks by sector
    - Add sector/index filter dropdown
    - Subscribe to real-time price updates for color changes
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

  - [x] 21.2 Write property test for heatmap color intensity
    - **Property 75: Heatmap color intensity mapping**
    - **Validates: Requirements 18.2**

  - [x] 21.3 Write property test for heatmap size proportionality
    - **Property 76: Heatmap size proportionality**
    - **Validates: Requirements 18.3**

  - [x] 21.4 Write property test for heatmap hover tooltip
    - **Property 77: Heatmap hover tooltip**
    - **Validates: Requirements 18.4**

  - [x] 21.5 Write property test for heatmap click navigation
    - **Property 78: Heatmap click navigation**
    - **Validates: Requirements 18.5**

  - [x] 21.6 Write property test for heatmap real-time updates
    - **Property 79: Heatmap real-time color updates**
    - **Validates: Requirements 18.6**

  - [x] 21.7 Write property test for heatmap filtering
    - **Property 80: Heatmap filtering**
    - **Validates: Requirements 18.7**

  - [x] 21.8 Write unit tests for HeatmapView
    - Test D3 treemap rendering
    - Test sector filtering
    - Test tooltip display
    - _Requirements: 18.4, 18.7_


- [x] 22. Implement ComparisonView component
  - [x] 22.1 Create ComparisonView in src/components/StockMarket/ComparisonView.tsx
    - Allow adding up to 4 stocks/indexes via StockSearch
    - Display normalized percentage chart from common starting point (0%)
    - Show metrics comparison table: current price, change, volume, market cap, YTD
    - Implement add/remove securities functionality
    - Support all timeframes from CandlestickChart
    - Add toggle between absolute price and percentage change view
    - Integrate lightweight-charts for comparison chart
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [x] 22.2 Write property test for comparison capacity
    - **Property 81: Comparison mode capacity**
    - **Validates: Requirements 19.1**

  - [x] 22.3 Write property test for normalized comparison chart
    - **Property 82: Normalized comparison chart**
    - **Validates: Requirements 19.2**

  - [x] 22.4 Write property test for comparison add/remove
    - **Property 83: Comparison add/remove functionality**
    - **Validates: Requirements 19.4**

  - [x] 22.5 Write property test for comparison timeframe parity
    - **Property 84: Comparison timeframe parity**
    - **Validates: Requirements 19.5**

  - [x] 22.6 Write property test for comparison view toggle
    - **Property 85: Comparison view toggle**
    - **Validates: Requirements 19.6**

  - [x] 22.7 Write unit tests for ComparisonView
    - Test metrics table rendering
    - Test absolute vs percentage toggle
    - Test capacity limit enforcement
    - _Requirements: 19.1, 19.3, 19.6_

- [x] 23. Implement data export functionality
  - [x] 23.1 Add export button to CandlestickChart component
    - Create export button in chart toolbar
    - Generate CSV with columns: timestamp, open, high, low, close, volume
    - Format filename: {symbol}_{startDate}_{endDate}.csv
    - Export data for currently displayed timeframe
    - Ensure export completes within 3 seconds for up to 10,000 data points
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 23.2 Write property test for CSV export format
    - **Property 44: CSV export format**
    - **Validates: Requirements 12.2**

  - [x] 23.3 Write property test for export filename format
    - **Property 45: Export filename format**
    - **Validates: Requirements 12.3**

  - [x] 23.4 Write property test for export performance
    - **Property 47: Export performance**
    - **Validates: Requirements 12.5**


- [x] 24. Implement comprehensive error handling
  - [x] 24.1 Create error handling utilities in src/utils/errorHandling.ts
    - Define user-friendly error messages for common scenarios
    - Implement logError() function with context and timestamp
    - Create error boundary components for major sections
    - _Requirements: 13.1, 13.5_

  - [x] 24.2 Add error handling to all data fetching services
    - Display user-friendly messages on fetch failures
    - Show rate limit messages with resume time
    - Continue displaying cached data when updates fail
    - Isolate errors to individual components
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 24.3 Write property test for fetch error handling
    - **Property 48: Fetch error handling**
    - **Validates: Requirements 13.1**

  - [x] 24.4 Write property test for rate limit error messaging
    - **Property 49: Rate limit error messaging**
    - **Validates: Requirements 13.2**

  - [x] 24.5 Write property test for cached data display on failure
    - **Property 50: Cached data display on failure**
    - **Validates: Requirements 13.3**

  - [x] 24.6 Write property test for isolated error handling
    - **Property 51: Isolated error handling**
    - **Validates: Requirements 13.4**

  - [x] 24.7 Write unit tests for error scenarios
    - Test WebSocket reconnection after failures
    - Test API timeout handling
    - Test localStorage quota exceeded
    - _Requirements: 3.3, 13.1_

- [x] 25. Checkpoint - Visualizations and error handling complete
  - Verify heatmap displays with real-time updates
  - Test comparison tool with multiple stocks
  - Verify data export functionality
  - Test error handling scenarios
  - Ask the user if questions arise


- [x] 26. Implement responsive design and mobile optimization
  - [x] 26.1 Add responsive styles to all components
    - Implement mobile layout (< 768px) with vertical stacking
    - Add touch gesture support for chart interactions (pinch, swipe)
    - Optimize IndexDisplay for mobile with condensed/expandable view
    - Ensure StockSearch remains accessible on mobile
    - Test all breakpoints: mobile (375px), tablet (768px), desktop (1920px)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 26.2 Write property test for responsive layout breakpoint
    - **Property 40: Responsive layout breakpoint**
    - **Validates: Requirements 11.1, 11.2**

  - [x] 26.3 Write property test for touch device interactivity
    - **Property 41: Touch device interactivity**
    - **Validates: Requirements 11.3**

  - [x] 26.4 Write property test for mobile search functionality
    - **Property 42: Mobile search functionality**
    - **Validates: Requirements 11.4**

  - [x] 26.5 Write property test for mobile index display
    - **Property 43: Mobile index display**
    - **Validates: Requirements 11.5**

- [x] 27. Implement accessibility features
  - [x] 27.1 Add keyboard navigation support to all interactive elements
    - Ensure Tab navigation works for all controls
    - Add Enter/Space handlers for custom buttons
    - Implement arrow key navigation for lists
    - Add Escape key handlers for modals/dropdowns
    - _Requirements: 14.1_

  - [x] 27.2 Add ARIA labels and roles to all components
    - Add aria-label to charts and visualizations
    - Add role="region" to major sections
    - Add aria-live for real-time updates
    - Add aria-describedby for tooltips
    - _Requirements: 14.2_

  - [x] 27.3 Add non-color visual indicators for price changes
    - Add up/down arrow icons alongside color coding
    - Add +/- symbols for changes
    - Ensure all information conveyed by color has alternative indicators
    - _Requirements: 14.3_

  - [x] 27.4 Verify text contrast ratios
    - Ensure all text meets 4.5:1 contrast ratio
    - Test with contrast checker tools
    - Adjust colors if needed while maintaining design system
    - _Requirements: 14.4_

  - [x] 27.5 Write property test for keyboard navigation
    - **Property 53: Keyboard navigation**
    - **Validates: Requirements 14.1**

  - [x] 27.6 Write property test for ARIA labels
    - **Property 54: ARIA labels for visualizations**
    - **Validates: Requirements 14.2**

  - [x] 27.7 Write property test for non-color indicators
    - **Property 55: Non-color visual indicators**
    - **Validates: Requirements 14.3**

  - [x] 27.8 Write property test for text contrast
    - **Property 56: Text contrast ratio**
    - **Validates: Requirements 14.4**

  - [x] 27.9 Run accessibility audit with jest-axe
    - Test all components for a11y violations
    - Fix any violations found
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_


- [x] 28. Apply design system consistency
  - [x] 28.1 Ensure all components use design system tokens
    - Apply #060B14 background color
    - Use DM Sans font family for all text
    - Apply existing color palette for interactive elements
    - Use consistent spacing values from design system
    - Apply consistent border and border-radius values
    - Match chart colors to design system palette
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 28.2 Write property test for design system consistency
    - **Property 86: Design system consistency**
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5**

- [x] 29. Implement performance optimizations
  - [x] 29.1 Optimize component rendering
    - Add React.memo to expensive components
    - Implement useMemo for computed values
    - Use useCallback for event handlers
    - Implement virtual scrolling for long lists (watchlist, news feed)
    - Lazy load chart library and D3.js
    - _Requirements: 2.5, 3.2, 7.7, 9.2_

  - [x] 29.2 Optimize WebSocket and API usage
    - Implement request batching for multiple quotes
    - Add request deduplication
    - Optimize WebSocket subscription management
    - Implement efficient cache invalidation
    - _Requirements: 15.3, 15.4_

  - [x] 29.3 Write property test for price update latency
    - **Property 7: Price update latency**
    - **Validates: Requirements 3.2**

  - [x] 29.4 Write property test for request batching
    - **Property 61: Request batching**
    - **Validates: Requirements 15.4**

  - [x] 29.5 Write performance tests
    - Test initial page load < 2 seconds
    - Test time to interactive < 3 seconds
    - Test chart render time < 500ms
    - Test 50-stock watchlist render < 500ms
    - _Requirements: 2.5, 3.2, 7.7, 9.2_


- [x] 30. Write comprehensive integration tests
  - [x] 30.1 Test WebSocket real-time updates end-to-end
    - Test connection establishment
    - Test subscription to multiple symbols
    - Test price update propagation to UI
    - Test reconnection after disconnect
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 30.2 Test watchlist workflow end-to-end
    - Test adding stock via search
    - Test real-time price updates in watchlist
    - Test reordering stocks
    - Test removing stocks
    - Test persistence across page reload
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 30.3 Test alert workflow end-to-end
    - Test creating price alert
    - Test alert triggering when condition met
    - Test browser notification
    - Test alert auto-disable after trigger
    - Test alert persistence
    - _Requirements: 17.1, 17.2, 17.3, 17.5, 17.7_

  - [x] 30.4 Test chart interactions end-to-end
    - Test timeframe switching
    - Test zoom and pan
    - Test real-time candle updates
    - Test data export
    - _Requirements: 5.3, 5.4, 5.6, 12.1_

  - [x] 30.5 Test news feed integration
    - Test fetching news from aggregation API
    - Test stock-specific filtering
    - Test infinite scroll
    - _Requirements: 16.2, 16.3, 16.6_

  - [x] 30.6 Test heatmap and comparison views
    - Test heatmap rendering and interactions
    - Test comparison tool with multiple stocks
    - Test real-time updates in both views
    - _Requirements: 18.1, 18.6, 19.1, 19.2_

- [x] 31. Write remaining property-based tests
  - [x] 31.1 Write property test for chart availability
    - **Property 14: Chart availability for indexes**
    - **Validates: Requirements 5.1**

  - [x] 31.2 Write property test for chart interactivity
    - **Property 17: Chart interactivity**
    - **Validates: Requirements 5.6**

  - [x] 31.3 Write property test for candle hover tooltip
    - **Property 18: Candle hover tooltip**
    - **Validates: Requirements 5.7**

  - [x] 31.4 Write property test for next market event display
    - **Property 33: Next market event display**
    - **Validates: Requirements 8.5**

  - [x] 31.5 Write property test for historical data load performance
    - **Property 35: Historical data load performance**
    - **Validates: Requirements 9.2**

  - [x] 31.6 Write property test for export timeframe matching
    - **Property 46: Export timeframe matching**
    - **Validates: Requirements 12.4**

  - [x] 31.7 Write property test for error logging
    - **Property 52: Error logging**
    - **Validates: Requirements 13.5**

  - [x] 31.8 Write property test for single quote API usage
    - **Property 58: Single quote API endpoint usage**
    - **Validates: Requirements 15.1**

  - [x] 31.9 Write property test for batch quote API usage
    - **Property 59: Batch quote API endpoint usage**
    - **Validates: Requirements 15.2**

  - [x] 31.10 Write property test for automatic news updates
    - **Property 67: Automatic news feed updates**
    - **Validates: Requirements 16.5**

  - [x] 31.11 Write property test for news pagination
    - **Property 68: News feed pagination**
    - **Validates: Requirements 16.6**


- [x] 32. Cross-browser and device testing
  - [x] 32.1 Test on Chrome, Firefox, Safari, and Edge
    - Verify all features work on latest versions
    - Test WebSocket connections
    - Test chart rendering
    - Test touch interactions on Safari iOS
    - _Requirements: All_

  - [x] 32.2 Test on multiple devices
    - Test desktop (1920x1080, 1366x768)
    - Test tablet (iPad, 768x1024)
    - Test mobile (iPhone, 375x667, Android)
    - Verify responsive layouts
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 32.3 Test with screen readers
    - Test with NVDA on Windows
    - Test with VoiceOver on macOS/iOS
    - Verify all ARIA labels are announced
    - Verify keyboard navigation works
    - _Requirements: 14.1, 14.2, 14.5_

- [x] 33. Final checkpoint and polish
  - [x] 33.1 Review all components for code quality
    - Remove console.logs and debug code
    - Add JSDoc comments to complex functions
    - Ensure consistent code formatting
    - Run ESLint and fix all warnings
    - _Requirements: All_

  - [x] 33.2 Verify all requirements are met
    - Review requirements document
    - Test each acceptance criterion
    - Document any known limitations
    - _Requirements: All_

  - [x] 33.3 Optimize bundle size
    - Analyze bundle with webpack-bundle-analyzer
    - Lazy load heavy dependencies (D3, charts)
    - Remove unused imports
    - Verify total bundle increase < 500KB
    - _Requirements: Performance_

  - [x] 33.4 Final testing and validation
    - Run all unit tests and ensure 100% pass
    - Run all property tests and ensure 100% pass
    - Test real-time updates during actual market hours
    - Verify error handling with network throttling
    - Test with production build
    - _Requirements: All_

- [x] 34. Final checkpoint - Feature complete
  - Ensure all tests pass (unit, property, integration)
  - Verify all 20 requirements are satisfied
  - Test feature in production-like environment
  - Document any deployment notes or configuration needed
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability to the requirements document
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and integration points
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation uses TypeScript throughout as specified in the design document
- WebSocket server runs on port 8001, separate from main API on port 8000
- All components follow the existing design system (#060B14 background, DM Sans font)
- Real-time updates use WebSocket-first with polling fallback for reliability
- LocalStorage is used for persistence of watchlist, alerts, and preferences
- The feature integrates with existing backend services and news aggregation system

## Implementation Timeline Estimate

- Phase 1 (Tasks 1-4): Core Infrastructure - 3-4 days
- Phase 2 (Tasks 5-13): Basic UI Components - 4-5 days
- Phase 3 (Tasks 14-20): Advanced Features - 5-6 days
- Phase 4 (Tasks 21-25): Visualizations - 3-4 days
- Phase 5 (Tasks 26-34): Polish & Testing - 4-5 days

Total: 19-24 days for complete implementation with comprehensive testing
