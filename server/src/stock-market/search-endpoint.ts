import { Router, Request, Response } from 'express';
import { searchService } from './search-service.js';

const router = Router();

/**
 * GET /api/stock/search
 * Search for stocks, indexes, or ETFs by symbol or company name
 * 
 * Query parameters:
 * - q: Search query (required)
 * - limit: Maximum number of results (default: 10)
 * - types: Comma-separated list of types to filter (stock, index, etf, bond, trust, commodity, crypto)
 * 
 * Example: /api/stock/search?q=apple&limit=5&types=stock,etf
 */
router.get('/stock/search', (req: Request, res: Response) => {
  try {
    const { q, limit, types } = req.query;

    // Validate query parameter
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    // Parse limit parameter
    const parsedLimit = limit ? parseInt(limit as string, 10) : 10;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        error: 'Limit must be a number between 1 and 100'
      });
    }

    // Parse types parameter
    let parsedTypes: ('stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto')[] | undefined;
    if (types && typeof types === 'string') {
      const typeArray = types.split(',').map(t => t.trim().toLowerCase());
      const validTypes = ['stock', 'index', 'etf', 'bond', 'trust', 'commodity', 'crypto'];
      
      // Validate all types are valid
      const invalidTypes = typeArray.filter(t => !validTypes.includes(t));
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          error: `Invalid types: ${invalidTypes.join(', ')}. Valid types are: ${validTypes.join(', ')}`
        });
      }
      
      parsedTypes = typeArray as ('stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto')[];
    }

    // Perform search
    const results = searchService.search({
      query: q,
      limit: parsedLimit,
      types: parsedTypes
    });

    // Return results
    res.json({
      query: q,
      results
    });
  } catch (error: any) {
    console.error('Stock search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
