# Congress Tracker Scraping Issue Analysis

## Problem Identified

The system is failing to retrieve 2026 trades because:

1. ✅ **Names Fixed**: Politician last names are now correct ("Pelosi" instead of "Pelosi, Nancy")
2. ❌ **Too Many Politicians**: Tracking 2,689 politicians (including historical members)
3. ❌ **Most Are Inactive**: The vast majority don't have current filings
4. ❌ **Scraper Overload**: Trying to scrape 2,689 × 2 years = 5,378 searches per poll

## Current Status

- **Politicians in DB**: 2,689
- **Active Current Members**: ~535
- **Historical/Inactive**: ~2,154
- **2026 Trades Found**: 2 (from old hardcoded list)
- **Poll Result**: 0 new filings, 0 new trades

## Root Cause

The Congress.gov API returns ALL members who served during the 119th Congress, including:
- Current serving members (535)
- Members who left office
- Members who served briefly
- Historical members

The scrapers are trying to fetch filings for all 2,689, and most fail because:
- They're no longer in office
- Their disclosure pages don't exist
- They haven't filed recently

## Solution Needed

We need to filter to ONLY currently serving members. Options:

### Option 1: Use Congress API Terms Data
Check the `terms` field from the API to see if they're currently serving.

### Option 2: Manual Curated List
Maintain a list of known active traders (like the old hardcoded list).

### Option 3: Filter by Recent Activity
Only track politicians who have filed in the last 6-12 months.

### Option 4: Limit Poll Scope
Instead of polling all 2,689, focus on:
- Top 50-100 known active traders
- Members with recent filing history
- Specific committees (Finance, etc.)

## Immediate Fix

The quickest solution is to:
1. Identify currently serving members from the Congress API
2. Mark only those as `is_active = true`
3. Poll only active members

## Next Steps

1. Update `congress-api-service.ts` to check if member is currently serving
2. Filter out historical/inactive members during sync
3. Re-sync with proper filtering
4. Re-run poll with ~535 members instead of 2,689

This will make the system:
- ✅ Faster (535 vs 2,689 politicians)
- ✅ More accurate (only current members)
- ✅ More reliable (fewer failed requests)
- ✅ Find actual 2026 trades

## Expected Outcome

After fixing:
- Politicians: ~535 (current members only)
- Poll time: ~15-30 minutes (vs current timeout)
- Success rate: Much higher
- 2026 trades: Should find dozens to hundreds
