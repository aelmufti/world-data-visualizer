# AIS Stream Troubleshooting Guide

## Current Status

The map is now configured to work with Deck.gl and will display vessels when data is available. However, the AIS Stream API connection is currently not working.

## What I've Implemented

1. **Deck.gl Map Component** (`src/components/VesselMap.tsx`)
   - High-performance map that can handle thousands of vessels
   - Color-coded vessels: Red (Tankers), Blue (Cargo), Green (Passenger), Gray (Other)
   - Interactive tooltips with vessel details
   - Real-time statistics panel

2. **Global AIS Context** (`src/contexts/AISContext.tsx`)
   - WebSocket connection starts on app launch
   - Stores up to 200 vessels in memory
   - Automatic reconnection with fallback to demo data
   - Demo data shows 8 sample vessels if real API is unavailable

3. **Backend WebSocket Proxy** (`server/src/ais-proxy.ts`)
   - Proxies connections to aisstream.io (required for CORS)
   - Handles subscription and message forwarding
   - Better error logging

## Current Issue

The WebSocket connection to `wss://stream.aisstream.io/v0/stream` is not establishing. This could be due to:

1. **Rate Limiting**: Too many connection attempts may have triggered rate limiting
2. **API Key Issue**: The key might need to be regenerated or verified
3. **Network Issue**: Temporary connectivity problem

## How to Fix

### Option 1: Check Your AIS Stream Account

1. Go to https://aisstream.io/
2. Log in to your account
3. Check if your API key is active and not rate-limited
4. Generate a new API key if needed
5. Update `server/.env` with the new key:
   ```
   VITE_AISSTREAM_API_KEY=your_new_key_here
   ```
6. Restart the server: `cd server && npm run dev`

### Option 2: Wait for Rate Limit to Reset

If you've made too many connections, wait 15-30 minutes before trying again.

### Option 3: Use Demo Data (Current Fallback)

The app will automatically use demo data after 3 failed connection attempts. This shows 8 sample vessels on the map so you can see how it works.

## Testing the API

To test if the API is working:

```bash
cd server
node test-ais-direct.mjs
```

This should show vessels being received. If it hangs or shows no data, the API key needs attention.

## What Works Now

- ✅ Map opens when clicking "WTI Crude" in Energy sector
- ✅ Deck.gl renders vessels with proper colors
- ✅ Tooltips show vessel details on hover
- ✅ Statistics panel shows vessel counts
- ✅ Demo data fallback if API unavailable
- ✅ Vessel count in sidebar updates in real-time

## Next Steps

1. Verify your aisstream.io API key is active
2. Wait for any rate limits to reset
3. Test with `node test-ais-direct.mjs`
4. Once working, the map will automatically show real vessels

## Demo Data

If you see "⚠️ Using demo data" in the bottom-right corner, the app is using sample vessels. This lets you test the map functionality while the API issue is resolved.
