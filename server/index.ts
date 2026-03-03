import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { NewsAggregator } from './aggregator/NewsAggregator.js'
import { loadConfiguration, validateConfiguration, logActiveSourcesAtStartup } from './aggregator/ConfigLoader.js'

// Charge les variables d'environnement
dotenv.config()

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Load and validate configuration
const config = loadConfiguration()
const warnings = validateConfiguration(config)

// Log warnings if any
warnings.forEach(warning => {
  console.warn(`[Config Warning] ${warning}`)
})

// Log active sources at startup (Requirement 7.5)
logActiveSourcesAtStartup(config)

// Initialize NewsAggregator
const newsAggregator = new NewsAggregator(config)

// Valid sectors whitelist (Requirement 5.1)
const VALID_SECTORS = [
  'Énergie',
  'Technologie',
  'Santé',
  'Télécoms',
  'Industrie',
  'Services Publics'
]

// Proxy pour Yahoo Finance
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0]
      const meta = result.meta
      
      const currentPrice = meta.regularMarketPrice
      const previousClose = meta.chartPreviousClose
      const change = currentPrice - previousClose
      const changePercent = (change / previousClose) * 100
      
      res.json({
        symbol: meta.symbol,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
      })
    } else {
      res.status(404).json({ error: 'Quote not found' })
    }
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error)
    res.status(500).json({ error: 'Failed to fetch quote' })
  }
})

// Batch endpoint pour plusieurs symboles
app.post('/api/quotes', async (req, res) => {
  const { symbols } = req.body
  
  if (!Array.isArray(symbols)) {
    return res.status(400).json({ error: 'symbols must be an array' })
  }
  
  try {
    const quotes = {}
    
    // Fetch en parallèle
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
          const response = await fetch(url)
          const data = await response.json()
          
          if (data.chart?.result?.[0]) {
            const result = data.chart.result[0]
            const meta = result.meta
            
            const currentPrice = meta.regularMarketPrice
            const previousClose = meta.chartPreviousClose
            const change = currentPrice - previousClose
            const changePercent = (change / previousClose) * 100
            
            quotes[symbol] = {
              symbol: meta.symbol,
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
            }
          }
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error)
        }
      })
    )
    
    res.json(quotes)
  } catch (error) {
    console.error('Error fetching quotes:', error)
    res.status(500).json({ error: 'Failed to fetch quotes' })
  }
})

/**
 * New multi-source news aggregation endpoint
 * 
 * GET /api/news/:sector
 * 
 * Fetches news articles from multiple sources in parallel, scores them for relevance,
 * deduplicates, filters, and returns the most relevant articles for the sector.
 * 
 * Requirements: 10.1, 10.2, 10.3, 5.1
 */
app.get('/api/news/:sector', async (req, res) => {
  const { sector } = req.params
  
  try {
    // Validate sector parameter (Requirement 5.1)
    if (!VALID_SECTORS.includes(sector)) {
      return res.status(400).json({
        error: `Invalid sector. Valid sectors are: ${VALID_SECTORS.join(', ')}`
      })
    }
    
    // Call NewsAggregator to fetch and aggregate news
    const result = await newsAggregator.aggregateNews(sector)
    
    // Return JSON response (Requirements 10.1, 10.2, 10.3)
    res.json(result)
    
  } catch (error) {
    // Handle errors with 500 status (Requirement 10.1)
    console.error(`Error aggregating news for sector ${sector}:`, error)
    res.status(500).json({
      articles: [],
      metadata: {
        timestamp: new Date().toISOString(),
        totalArticles: 0,
        sourcesUsed: [],
        cacheStatus: 'miss'
      },
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`)
})
