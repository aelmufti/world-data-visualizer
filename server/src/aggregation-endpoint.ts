import { Router } from 'express';
import { newsAggregator, SECTORS } from './aggregator-duckdb.js';

const router = Router();

// Middleware pour vérifier l'API key (à ajouter)
const verifyApiKey = (req: any, res: any, next: any) => {
  // Simplifié pour l'instant
  next();
};

/**
 * GET /api/aggregated/sector/:sector
 * Récupère les articles agrégés et scorés pour un secteur
 */
router.get('/sector/:sector', verifyApiKey, async (req, res) => {
  try {
    const { sector } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!Object.values(SECTORS).includes(sector as any)) {
      return res.status(400).json({ error: 'Invalid sector' });
    }
    
    const articles = await newsAggregator.aggregateForSector(sector, limit);
    
    res.json({
      sector,
      count: articles.length,
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt.toISOString(),
        relevanceScore: a.relevanceScore.toFixed(2),
        importanceScore: a.importanceScore,
        finalScore: a.finalScore.toFixed(2),
        sentiment: a.sentiment.toFixed(2),
        summary: a.summary,
        keyPoints: a.keyPoints,
        companies: a.companies,
        events: a.events,
      }))
    });
  } catch (error: any) {
    console.error('Error aggregating sector:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/aggregated/all
 * Récupère les top articles pour tous les secteurs
 */
router.get('/all', verifyApiKey, async (req, res) => {
  try {
    const topPerSector = parseInt(req.query.topPerSector as string) || 10;
    
    const allSectors = await newsAggregator.aggregateAllSectors(topPerSector);
    
    res.json({
      sectors: Object.keys(allSectors),
      data: allSectors,
    });
  } catch (error: any) {
    console.error('Error aggregating all sectors:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/aggregated/top
 * Récupère les articles les plus importants globalement
 */
router.get('/top', verifyApiKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const topArticles = await newsAggregator.getTopArticles(limit);
    
    res.json({
      count: topArticles.length,
      articles: topArticles.map(a => ({
        id: a.id,
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt.toISOString(),
        sector: a.sector,
        relevanceScore: a.relevanceScore.toFixed(2),
        importanceScore: a.importanceScore,
        finalScore: a.finalScore.toFixed(2),
        sentiment: a.sentiment.toFixed(2),
        summary: a.summary,
        keyPoints: a.keyPoints,
        companies: a.companies,
        events: a.events,
      }))
    });
  } catch (error: any) {
    console.error('Error getting top articles:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
