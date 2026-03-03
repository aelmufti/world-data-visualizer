import { Router } from 'express';
import { marketDataService } from './market-data.js';

const router = Router();

/**
 * GET /api/market-data/:sector
 * Get macro indicators for a specific sector
 */
router.get('/market-data/:sector', async (req, res) => {
  try {
    const { sector } = req.params;
    
    const indicators = await marketDataService.getMacroIndicators(sector);
    
    res.json({
      sector,
      indicators,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

/**
 * GET /api/market-data
 * Get macro indicators for all sectors
 */
router.get('/market-data', async (req, res) => {
  try {
    const allIndicators = await marketDataService.getAllMacroIndicators();
    
    res.json({
      data: allIndicators,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching all market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

export default router;
