import { Router } from 'express';
import { getDatabase, collections } from './database.js';

const router = Router();

/**
 * GET /api/companies/search?q=apple
 * Search for companies by name or ticker
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const searchTerm = q.toLowerCase();
    const db = getDatabase();
    
    const companies = await db.all(`
      SELECT * FROM ${collections.companies}
      WHERE LOWER(ticker) LIKE ? OR LOWER(name) LIKE ?
      LIMIT 20
    `, `%${searchTerm}%`, `%${searchTerm}%`);

    res.json({ companies, count: companies.length });
  } catch (error: any) {
    console.error('Error searching companies:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/companies/:ticker
 * Get company details and statistics
 */
router.get('/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const db = getDatabase();
    
    // Get company info
    const companies = await db.all(`
      SELECT * FROM ${collections.companies}
      WHERE UPPER(ticker) = ?
      LIMIT 1
    `, ticker.toUpperCase());

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = companies[0];

    // Get statistics
    const stats = await getCompanyStats(db, company.id, ticker.toUpperCase());

    res.json({
      company,
      stats
    });
  } catch (error: any) {
    console.error('Error getting company:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/companies/:ticker/news
 * Get news articles mentioning the company
 */
router.get('/:ticker/news', async (req, res) => {
  try {
    const { ticker } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const since = req.query.since as string;
    
    const db = getDatabase();

    // Build query
    let whereClause = 'WHERE m.ticker = ?';
    const params: any[] = [ticker.toUpperCase()];

    if (since) {
      whereClause += ' AND a.published_at >= ?';
      params.push(new Date(since).toISOString());
    }

    const articles = await db.all(`
      SELECT 
        a.id,
        a.title,
        a.url,
        a.published_at,
        a.source_domain,
        a.raw_sentiment,
        m.mention_count,
        m.entity_sentiment,
        m.is_primary_subject,
        m.event_tags
      FROM ${collections.articles} a
      JOIN ${collections.mentions} m ON a.id = m.article_id
      ${whereClause}
      ORDER BY a.published_at DESC
      LIMIT ?
    `, ...params, limit);

    res.json({
      ticker: ticker.toUpperCase(),
      articles,
      count: articles.length
    });
  } catch (error: any) {
    console.error('Error getting company news:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/companies/:ticker/events
 * Get events related to the company
 */
router.get('/:ticker/events', async (req, res) => {
  try {
    const { ticker } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const eventType = req.query.event_type as string;
    
    const db = getDatabase();

    let whereClause = 'WHERE e.ticker = ?';
    const params: any[] = [ticker.toUpperCase()];

    if (eventType) {
      whereClause += ' AND e.event_type = ?';
      params.push(eventType);
    }

    const events = await db.all(`
      SELECT 
        e.id,
        e.event_type,
        e.confidence,
        e.detected_at,
        e.article_url,
        a.title as article_title
      FROM ${collections.events} e
      LEFT JOIN ${collections.articles} a ON e.article_id = a.id
      ${whereClause}
      ORDER BY e.detected_at DESC
      LIMIT ?
    `, ...params, limit);

    res.json({
      ticker: ticker.toUpperCase(),
      events,
      count: events.length
    });
  } catch (error: any) {
    console.error('Error getting company events:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/companies/:ticker/sentiment
 * Get sentiment analysis over time
 */
router.get('/:ticker/sentiment', async (req, res) => {
  try {
    const { ticker } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    const db = getDatabase();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sentimentData = await db.all(`
      SELECT 
        DATE(a.published_at) as date,
        AVG(m.entity_sentiment) as avg_sentiment,
        COUNT(*) as mention_count,
        AVG(a.raw_sentiment) as avg_article_sentiment
      FROM ${collections.articles} a
      JOIN ${collections.mentions} m ON a.id = m.article_id
      WHERE m.ticker = ? AND a.published_at >= ?
      GROUP BY DATE(a.published_at)
      ORDER BY date DESC
    `, ticker.toUpperCase(), since.toISOString());

    res.json({
      ticker: ticker.toUpperCase(),
      days,
      data: sentimentData
    });
  } catch (error: any) {
    console.error('Error getting sentiment data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/companies/trending
 * Get most mentioned companies
 */
router.get('/trending/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const hours = parseInt(req.query.hours as string) || 24;
    
    const db = getDatabase();
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const trending = await db.all(`
      SELECT 
        m.ticker,
        c.name as company_name,
        COUNT(*) as mention_count,
        AVG(m.entity_sentiment) as avg_sentiment,
        SUM(CASE WHEN m.is_primary_subject THEN 1 ELSE 0 END) as primary_mentions
      FROM ${collections.mentions} m
      JOIN ${collections.articles} a ON m.article_id = a.id
      LEFT JOIN ${collections.companies} c ON m.company_id = c.id
      WHERE a.published_at >= ?
      GROUP BY m.ticker, c.name
      ORDER BY mention_count DESC
      LIMIT ?
    `, since.toISOString(), limit);

    res.json({
      hours,
      trending,
      count: trending.length
    });
  } catch (error: any) {
    console.error('Error getting trending companies:', error);
    res.status(500).json({ error: error.message });
  }
});

async function getCompanyStats(db: any, companyId: string, ticker: string) {
  // Total mentions
  const mentionResult = await db.all(`
    SELECT COUNT(*) as count FROM ${collections.mentions}
    WHERE company_id = ?
  `, companyId);
  const totalMentions = mentionResult[0]?.count || 0;

  // Mentions in last 24h
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const mentions24h = await db.all(`
    SELECT COUNT(*) as count FROM ${collections.mentions} m
    JOIN ${collections.articles} a ON m.article_id = a.id
    WHERE m.company_id = ? AND a.published_at >= ?
  `, companyId, since24h.toISOString());
  const mentions24hCount = mentions24h[0]?.count || 0;

  // Average sentiment
  const sentimentResult = await db.all(`
    SELECT AVG(entity_sentiment) as avg_sentiment FROM ${collections.mentions}
    WHERE company_id = ?
  `, companyId);
  const avgSentiment = sentimentResult[0]?.avg_sentiment || 0;

  // Recent events
  const recentEvents = await db.all(`
    SELECT event_type, COUNT(*) as count
    FROM ${collections.events}
    WHERE company_id = ?
    GROUP BY event_type
    ORDER BY count DESC
  `, companyId);

  // Latest article
  const latestArticle = await db.all(`
    SELECT a.title, a.published_at, a.url
    FROM ${collections.articles} a
    JOIN ${collections.mentions} m ON a.id = m.article_id
    WHERE m.company_id = ?
    ORDER BY a.published_at DESC
    LIMIT 1
  `, companyId);

  return {
    totalMentions,
    mentions24h: mentions24hCount,
    avgSentiment,
    recentEvents,
    latestArticle: latestArticle[0] || null
  };
}

export default router;
