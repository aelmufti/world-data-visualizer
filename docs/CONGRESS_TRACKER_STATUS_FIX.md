# Congress Tracker Status Fix

## Issue

The Overview tab was showing "Congress Tracker ● Idle" even though the polling system was running correctly.

## Root Cause

The `isPolling()` method in `CongressPipeline` was checking `this.isRunning`, which is only `true` during the brief moments when a poll is actively executing (fetching and processing data). Since polls run every 60 minutes and complete in seconds, the status appeared as "Idle" 99% of the time.

## Solution

### 1. Added `isActive()` method to CongressPoller

**File**: `server/src/congress-tracker/poller.ts`

```typescript
isActive(): boolean {
  return this.intervalId !== null;
}
```

This checks if the poller is scheduled (has an active interval), not if it's currently executing.

### 2. Updated Status Endpoint

**File**: `server/src/congress-tracker/endpoints.ts`

Changed from:
```typescript
const isPolling = congressPipeline.isPolling(); // Only true during execution
```

To:
```typescript
const isPolling = congressPoller.isActive(); // True if scheduled
```

### 3. Updated Overview Tab Display

**File**: `src/components/OverviewTab.tsx`

Changed status labels from:
- "● Polling" / "● Idle"

To:
- "● Active" / "● Stopped"

This better reflects the actual state: the poller is either active (scheduled to run every 60 minutes) or stopped.

## Status Meanings

- **● Active** (Green): The poller is running and will check for new trades every 60 minutes
- **● Stopped** (Gray): The poller has been stopped and is not scheduled to run

## How It Works

1. Server starts → `congressPoller.start()` is called
2. Poller runs immediately, then schedules itself to run every 60 minutes
3. `isActive()` returns `true` as long as the interval is scheduled
4. Status endpoint returns `isPolling: true`
5. Frontend displays "● Active"

## Testing

To verify the fix:

1. Start the server: `npm run dev` (in server directory)
2. Check console for: `🗳️  Starting Congress trade poller (60 min interval)`
3. Navigate to `/overview` in the app
4. Status should show "Congress Tracker ● Active" (green)

## Related Files

- `server/src/congress-tracker/poller.ts` - Poller implementation
- `server/src/congress-tracker/endpoints.ts` - Status endpoint
- `server/src/congress-tracker/pipeline.ts` - Pipeline execution
- `src/components/OverviewTab.tsx` - Frontend display
- `src/services/congressTrackerService.ts` - Frontend service
