# 🔑 Politician Trading - API Setup for Current Data

## Problem: Outdated Data

The free GitHub repositories contain data from 2020 and are no longer maintained. To get **current, up-to-date** politician trading data from 2024-2025, you need to use a paid API service.

## Solution: Quiver Quantitative API

Quiver Quant provides the most reliable and current congressional trading data.

### Pricing
- **$10/month** for API access
- Includes House + Senate trading data
- Updated daily with latest filings
- Historical data back to 2019

### Sign Up

1. Go to [https://api.quiverquant.com/](https://api.quiverquant.com/)
2. Click "Sign Up"
3. Choose the API plan ($10/month)
4. Get your API key

### Configure Your App

1. Open `server/.env` file
2. Add your API key:
```env
QUIVER_API_KEY=your_api_key_here
```

3. Restart your server:
```bash
cd server
npm run dev
```

### Verify It's Working

Check the status endpoint:
```bash
curl http://localhost:8000/api/politician-trading/status
```

Should return:
```json
{
  "quiverApiConfigured": true,
  "dataSource": "Quiver Quant API (current)",
  "message": "Using current data"
}
```

## Alternative: Free Options (Limited)

### Option 1: Capitol Trades (No API)
- Website: [https://www.capitoltrades.com/](https://www.capitoltrades.com/)
- Has current data but no public API
- Would require web scraping (against TOS)

### Option 2: Financial Modeling Prep
- Website: [https://financialmodelingprep.com/](https://financialmodelingprep.com/)
- Has House disclosure API
- Free tier available but limited
- Requires API key

### Option 3: Build Your Own Scraper
- Scrape from official sources:
  - House: [https://disclosures-clerk.house.gov/](https://disclosures-clerk.house.gov/)
  - Senate: [https://efdsearch.senate.gov/](https://efdsearch.senate.gov/)
- Complex: PDFs, inconsistent formats
- Time-consuming to maintain

## Recommended: Use Quiver Quant

For $10/month, you get:
- ✅ Current data (updated daily)
- ✅ Clean, consistent JSON format
- ✅ Both House and Senate
- ✅ Historical data
- ✅ Reliable API
- ✅ No scraping needed
- ✅ No maintenance

## Without API Key

If you don't configure an API key, the app will:
1. Try to use GitHub fallback data (from 2020)
2. Show a warning that data is outdated
3. Display a message to configure API key

## Data Comparison

| Source | Cost | Data Age | Reliability | Maintenance |
|--------|------|----------|-------------|-------------|
| Quiver Quant API | $10/mo | Current (2025) | High | None |
| GitHub Repos | Free | Old (2020) | Low | Abandoned |
| Capitol Trades | Free | Current | N/A | No API |
| FMP API | Free tier | Current | Medium | Limited |
| DIY Scraper | Free | Current | Low | High |

## Example: Latest Trades with Quiver

Once configured, you'll see trades like:
- Tommy Tuberville buying Apple (Jan 2026)
- Nancy Pelosi trading Microsoft (Dec 2025)
- Dan Crenshaw selling Tesla (Nov 2025)

Instead of:
- Old trades from 2020
- Outdated politician names
- Missing recent activity

## Support

If you have issues:
1. Check your API key is correct in `.env`
2. Restart the server
3. Check server logs for errors
4. Verify your Quiver subscription is active

## Worth It?

**Yes, if you want:**
- Current trading data
- Reliable updates
- Professional-grade API
- Time savings

**No, if you:**
- Just want to test the UI
- Don't care about data accuracy
- Want to build your own scraper
- Have time to maintain it

## Quick Start

```bash
# 1. Sign up at https://api.quiverquant.com/
# 2. Get your API key
# 3. Add to server/.env:
echo "QUIVER_API_KEY=your_key_here" >> server/.env

# 4. Restart server
cd server
npm run dev

# 5. Test
curl http://localhost:8000/api/politician-trading/all | jq '. | length'
```

You should now see thousands of current trades instead of old 2020 data!
