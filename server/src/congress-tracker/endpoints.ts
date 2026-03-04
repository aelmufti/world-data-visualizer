// Express router for Congress trade tracker API
import express from 'express';
import { congressDb } from './database.js';
import { congressPipeline } from './pipeline.js';
import { priceService } from './price-service.js';
import { TRACKED_POLITICIANS, getPoliticianByLastName } from './politicians.js';

const router = express.Router();

// Helper to convert BigInt to Number for JSON serialization
function convertBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigInts(obj[key]);
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

    // Optionally enrich with price data
    const enriched = await Promise.all(
      trades.map(async (trade) => {
        const perf = await priceService.calculateTradePerformance(trade);
        return { ...trade, ...perf };
      })
    );

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

    // Enrich with price data
    const enriched = await Promise.all(
      trades.map(async (trade) => {
        const perf = await priceService.calculateTradePerformance(trade);
        return { ...trade, ...perf };
      })
    );

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
    const enriched = await Promise.all(
      TRACKED_POLITICIANS.map(async (politician) => {
        const winRateData = await priceService.calculatePoliticianWinRate(politician.lastName);
        
        return {
          lastName: politician.lastName,
          fullName: politician.fullName,
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
    const isPolling = congressPipeline.isPolling();
    const hasPdfToText = await (await import('./pdf-parser.js')).pdfParser.checkPdfToText();

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
      trackedPoliticians: TRACKED_POLITICIANS.length
    });
  } catch (error: any) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
