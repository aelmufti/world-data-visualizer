/**
 * Market Status API Endpoint
 * 
 * Provides market status information for US, EU, and ASIA markets
 */

import { Router, Request, Response } from 'express';
import { marketHoursService } from './market-hours-service.js';

const router = Router();

/**
 * GET /api/stock/market-status/:market
 * 
 * Get current market status and next event for a specific market
 * 
 * Parameters:
 * - market: Market identifier (US, EU, ASIA)
 * 
 * Returns:
 * - market: Market identifier
 * - isOpen: Whether market is currently open
 * - session: Current session type (regular, pre-market, after-hours, closed)
 * - nextEvent: Next market event (open or close) with time and countdown
 */
router.get('/stock/market-status/:market', (req: Request, res: Response) => {
  const { market } = req.params;

  // Validate market parameter
  const validMarkets = ['US', 'EU', 'ASIA'];
  if (!validMarkets.includes(market.toUpperCase())) {
    return res.status(400).json({
      error: 'Invalid market parameter',
      message: `Market must be one of: ${validMarkets.join(', ')}`,
    });
  }

  const marketId = market.toUpperCase();

  try {
    // Get market status
    const status = marketHoursService.getMarketStatus(marketId);
    
    // Get next market event
    const nextEvent = marketHoursService.getNextMarketEvent(marketId);

    if (!nextEvent) {
      return res.status(500).json({
        error: 'Failed to calculate next market event',
      });
    }

    // Return combined response
    res.json({
      market: marketId,
      isOpen: status.isOpen,
      session: status.session,
      nextEvent: {
        type: nextEvent.type,
        time: nextEvent.time.toISOString(),
        countdown: nextEvent.countdown,
      },
    });
  } catch (error) {
    console.error(`Error fetching market status for ${marketId}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch market status',
    });
  }
});

/**
 * GET /api/stock/market-status
 * 
 * Get current status for all markets
 * 
 * Returns array of market statuses
 */
router.get('/stock/market-status', (req: Request, res: Response) => {
  const markets = ['US', 'EU', 'ASIA'];

  try {
    const statuses = markets.map(market => {
      const status = marketHoursService.getMarketStatus(market);
      const nextEvent = marketHoursService.getNextMarketEvent(market);

      return {
        market,
        isOpen: status.isOpen,
        session: status.session,
        nextEvent: nextEvent ? {
          type: nextEvent.type,
          time: nextEvent.time.toISOString(),
          countdown: nextEvent.countdown,
        } : null,
      };
    });

    res.json({ markets: statuses });
  } catch (error) {
    console.error('Error fetching market statuses:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch market statuses',
    });
  }
});

export default router;
