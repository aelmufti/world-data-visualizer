// Express router for Congress trade tracker API
import express from 'express';
import { congressDb } from './database.js';
import { congressPipeline } from './pipeline.js';
import { congressPoller } from './poller.js';
import { priceService } from './price-service.js';
import { CongressApiService } from './congress-api-service.js';

const router = express.Router();

// Helper to convert BigInt and Dates to JSON-serializable values
function convertBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (obj instanceof Date) return obj.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      const value = obj[key];
      // Check if it's a date-like object (has year, month, day properties)
      if (value && typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
        // DuckDB returns dates as objects with year, month, day
        const year = value.year;
        const month = String(value.month).padStart(2, '0');
        const day = String(value.day).padStart(2, '0');
        converted[key] = `${year}-${month}-${day}`;
      } else {
        converted[key] = convertBigInts(value);
      }
    }
    return converted;
  }
  return obj;
}

// GET /api/congress/trades - Query trades with filters
router.get('/trades', async (req, res) => {
  try {
    const { politician, ticker, action, chamber } = req.query;

    const trades = await congressDb.getTrades({
      politician: politician as string,
      ticker: ticker as string,
      action: action as string,
      chamber: chamber as string
    });

    // Enrich with price data in batches to avoid overwhelming the API
    const batchSize = 10;
    const enriched = [];
    
    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (trade) => {
          try {
            const perf = await priceService.calculateTradePerformance(trade);
            return { ...trade, ...perf };
          } catch (error) {
            // Return trade without performance data if price fetch fails
            return trade;
          }
        })
      );
      
      enriched.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < trades.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    res.json(convertBigInts({ trades: enriched, count: enriched.length }));
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/congress/trades/:lastName - Get all trades for one politician
router.get('/trades/:lastName', async (req, res) => {
  try {
    const { lastName } = req.params;
    const trades = await congressDb.getTradesByPolitician(lastName);

    // Enrich with price data in batches
    const batchSize = 10;
    const enriched = [];
    
    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (trade) => {
          try {
            const perf = await priceService.calculateTradePerformance(trade);
            return { ...trade, ...perf };
          } catch (error) {
            return trade;
          }
        })
      );
      
      enriched.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));
      
      if (i + batchSize < trades.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    res.json(convertBigInts({ politician: lastName, trades: enriched, count: enriched.length }));
  } catch (error: any) {
    console.error('Error fetching politician trades:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/congress/filings - Get all filings
router.get('/filings', async (req, res) => {
  try {
    const filings = await congressDb.getAllFilings();
    res.json(convertBigInts({ filings, count: filings.length }));
  } catch (error: any) {
    console.error('Error fetching filings:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/congress/alerts - Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const { unread } = req.query;
    const unreadOnly = unread === 'true';
    
    const alerts = await congressDb.getAlerts(unreadOnly);
    
    res.json(convertBigInts({ alerts, count: alerts.length }));
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/congress/alerts/:id/read - Mark alert as read
router.patch('/alerts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await congressDb.markAlertRead(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking alert read:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/congress/alerts/read-all - Mark all alerts as read
router.patch('/alerts/read-all', async (req, res) => {
  try {
    await congressDb.markAllAlertsRead();
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking all alerts read:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/congress/alerts/stream - SSE stream for real-time alerts
router.get('/alerts/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onNewTrade = (trade: any) => {
    res.write(`event: new-trade\n`);
    res.write(`data: ${JSON.stringify(trade)}\n\n`);
  };

  congressPipeline.on('new-trade', onNewTrade);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  req.on('close', () => {
    congressPipeline.off('new-trade', onNewTrade);
    clearInterval(heartbeat);
  });
});

// GET /api/congress/politicians - Get tracked politicians with win rates
router.get('/politicians', async (req, res) => {
  try {
    // Get politicians from database
    const apiKey = process.env.CONGRESS_API_KEY;
    let politicians = [];
    
    if (apiKey) {
      const congressApi = new CongressApiService(apiKey);
      politicians = await congressApi.getActivePoliticians();
    }

    const enriched = await Promise.all(
      politicians.map(async (politician) => {
        const winRateData = await priceService.calculatePoliticianWinRate(politician.last_name);
        
        return {
          lastName: politician.last_name,
          fullName: politician.full_name,
          party: politician.party,
          state: politician.state,
          chamber: politician.chamber,
          winRate: winRateData.winRate !== null ? Math.round(winRateData.winRate * 100) / 100 : null,
          totalTrades: winRateData.totalTrades,
          resolvedTrades: winRateData.resolvedTrades
        };
      })
    );

    res.json({ politicians: enriched, count: enriched.length });
  } catch (error: any) {
    console.error('Error fetching politicians:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/congress/status - System status
router.get('/status', async (req, res) => {
  try {
    const stats = await congressDb.getStats();
    const lastPoll = congressPipeline.getLastPollTime();
    const isPolling = congressPoller.isActive(); // Check if poller is scheduled/active
    const hasPdfToText = await (await import('./pdf-parser.js')).pdfParser.checkPdfToText();

    // Get politician count from database
    const apiKey = process.env.CONGRESS_API_KEY;
    let trackedPoliticians = 0;
    
    if (apiKey) {
      const congressApi = new CongressApiService(apiKey);
      const politicians = await congressApi.getActivePoliticians();
      trackedPoliticians = politicians.length;
    }

    res.json({
      lastPollTime: lastPoll?.toISOString() || null,
      isPolling,
      totalFilings: Number(stats.totalFilings),
      totalTrades: Number(stats.totalTrades),
      unreadAlerts: Number(stats.unreadAlerts),
      pdfToTextAvailable: hasPdfToText,
      pdfToTextInstall: hasPdfToText 
        ? 'Installed' 
        : 'Not found. Install with: brew install poppler (macOS) or apt install poppler-utils (Linux)',
      trackedPoliticians
    });
  } catch (error: any) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
