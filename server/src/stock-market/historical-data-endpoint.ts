import { Router, Request, Response } from 'express';
import {
  historicalDataService,
  Interval,
  Range,
} from './historical-data-service.js';

const router = Router();

/**
 * Valid intervals for historical data
 */
const VALID_INTERVALS: Interval[] = ['1m', '5m', '15m', '1h', '1d'];

/**
 * Valid ranges for historical data
 */
const VALID_RANGES: Range[] = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'];

/**
 * GET /api/stock/history/:symbol
 * 
 * Fetch historical OHLCV data for a stock symbol
 * 
 * Query Parameters:
 * - interval: Time interval for candles (1m, 5m, 15m, 1h, 1d)
 * - range: Date range for historical data (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y)
 * 
 * Response:
 * {
 *   symbol: string,
 *   data: CandleData[],
 *   meta: {
 *     currency: string,
 *     exchangeName: string,
 *     instrumentType: string
 *   }
 * }
 */
router.get('/stock/history/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { interval, range } = req.query;

    // Validate symbol
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        error: 'Invalid symbol parameter',
      });
    }

    // Validate interval
    if (!interval || typeof interval !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid interval parameter',
        validIntervals: VALID_INTERVALS,
      });
    }

    if (!VALID_INTERVALS.includes(interval as Interval)) {
      return res.status(400).json({
        error: `Invalid interval: ${interval}`,
        validIntervals: VALID_INTERVALS,
      });
    }

    // Validate range
    if (!range || typeof range !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid range parameter',
        validRanges: VALID_RANGES,
      });
    }

    if (!VALID_RANGES.includes(range as Range)) {
      return res.status(400).json({
        error: `Invalid range: ${range}`,
        validRanges: VALID_RANGES,
      });
    }

    // Fetch historical data
    const historicalData = await historicalDataService.fetchHistoricalData(
      symbol.toUpperCase(),
      interval as Interval,
      range as Range
    );

    if (!historicalData) {
      return res.status(404).json({
        error: `No historical data found for symbol: ${symbol}`,
      });
    }

    // Return successful response
    res.json(historicalData);
  } catch (error: any) {
    console.error('[HistoricalDataEndpoint] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch historical data',
      message: error.message,
    });
  }
});

/**
 * GET /api/stock/history/cache/stats
 * 
 * Get cache statistics (for debugging/monitoring)
 */
router.get('/stock/history/cache/stats', (req: Request, res: Response) => {
  const stats = historicalDataService.getCacheStats();
  res.json(stats);
});

export default router;
