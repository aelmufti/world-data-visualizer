import { Router } from 'express';
import { marketDataService } from './market-data-service.js';

const router = Router();

/**
 * GET /api/quote/:symbol
 * Get real-time quote for a single stock symbol
 */
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const quote = await marketDataService.fetchQuote(symbol.toUpperCase());
    
    if (!quote) {
      return res.status(404).json({ error: 'Stock symbol not found' });
    }

    res.json(quote);
  } catch (error: any) {
    console.error(`Error fetching quote for ${req.params.symbol}:`, error);
    res.status(500).json({ error: 'Failed to fetch stock quote' });
  }
});

/**
 * GET /api/quotes?symbols=AAPL,GOOGL,MSFT
 * Get real-time quotes for multiple stock symbols
 */
router.get('/quotes', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols as string;
    
    if (!symbolsParam) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    
    if (symbols.length === 0) {
      return res.status(400).json({ error: 'At least one symbol is required' });
    }

    if (symbols.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 symbols allowed per request' });
    }

    const quotesMap = await marketDataService.fetchBatchQuotes(symbols);
    const quotes = Array.from(quotesMap.values());

    res.json(quotes);
  } catch (error: any) {
    console.error('Error fetching batch quotes:', error);
    res.status(500).json({ error: 'Failed to fetch stock quotes' });
  }
});

export default router;
