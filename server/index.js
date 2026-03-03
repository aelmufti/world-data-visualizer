import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Charge les variables d'environnement
dotenv.config()

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

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

// Endpoint pour rechercher des actualités récentes
app.get('/api/news/:sector', async (req, res) => {
  const { sector } = req.params
  const newsApiKey = process.env.NEWS_API_KEY
  
  try {
    // Mapping des secteurs vers des mots-clés de recherche
    const sectorKeywords = {
      'Énergie': 'energy oil gas renewable',
      'Technologie': 'technology AI tech software',
      'Santé': 'healthcare pharma medical biotech',
      'Télécoms': 'telecom 5G telecommunications',
      'Industrie': 'industry manufacturing aerospace defense',
      'Services Publics': 'utilities electricity power infrastructure'
    }
    
    const keywords = sectorKeywords[sector] || sector
    
    // Essaie d'abord NewsAPI si la clé est configurée
    if (newsApiKey && newsApiKey !== 'your_newsapi_key_here' && newsApiKey.trim() !== '') {
      try {
        console.log(`Fetching from NewsAPI for sector: ${sector}`)
        // Récupère uniquement les actualités d'aujourd'hui
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISO = today.toISOString().split('T')[0]
        
        const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keywords)}&language=en&sortBy=publishedAt&from=${todayISO}&pageSize=10&apiKey=${newsApiKey}`
        const newsResponse = await fetch(newsUrl)
        const newsData = await newsResponse.json()
        
        if (newsData.status === 'ok' && newsData.articles && newsData.articles.length > 0) {
          // Filtre pour ne garder que les actualités d'aujourd'hui
          const todayStart = new Date()
          todayStart.setHours(0, 0, 0, 0)
          
          const todayArticles = newsData.articles.filter(article => {
            const publishedDate = new Date(article.publishedAt)
            return publishedDate >= todayStart
          })
          
          const news = todayArticles.slice(0, 4).map(article => {
            const publishedDate = new Date(article.publishedAt)
            const now = new Date()
            const diffMs = now - publishedDate
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            
            let dateStr
            if (diffHours < 1) {
              const diffMins = Math.floor(diffMs / (1000 * 60))
              dateStr = `Il y a ${diffMins} min`
            } else {
              dateStr = `Il y a ${diffHours}h`
            }
            
            return {
              title: article.title,
              snippet: article.description || article.content?.substring(0, 150) || '',
              date: dateStr,
              source: article.source.name,
              url: article.url,
              publishedAt: article.publishedAt
            }
          })
          
          console.log(`✓ NewsAPI returned ${news.length} articles from today`)
          return res.json({ news, timestamp: new Date().toISOString(), source: 'NewsAPI' })
        } else {
          console.log('NewsAPI returned no articles or error:', newsData.message)
        }
      } catch (error) {
        console.error('NewsAPI error:', error.message)
      }
    } else {
      console.log('NewsAPI key not configured, using fallback')
    }
    
    // Fallback 1: Utilise Bing News Search (pas de clé nécessaire)
    try {
      console.log(`Fetching from Bing News for sector: ${sector}`)
      const bingUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(keywords + ' finance')}&format=rss`
      const bingResponse = await fetch(bingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      const bingText = await bingResponse.text()
      
      // Parse RSS
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      const titleRegex = /<title>(.*?)<\/title>/
      const descRegex = /<description>(.*?)<\/description>/
      const dateRegex = /<pubDate>(.*?)<\/pubDate>/
      
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      const news = []
      let match
      
      while ((match = itemRegex.exec(bingText)) !== null && news.length < 4) {
        const item = match[1]
        const titleMatch = titleRegex.exec(item)
        const descMatch = descRegex.exec(item)
        const dateMatch = dateRegex.exec(item)
        
        if (titleMatch && dateMatch) {
          const publishedDate = new Date(dateMatch[1])
          
          // Ne garde que les actualités d'aujourd'hui
          if (publishedDate < todayStart) continue
          
          const now = new Date()
          const diffMs = now - publishedDate
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          
          let dateStr
          if (diffHours < 1) {
            const diffMins = Math.floor(diffMs / (1000 * 60))
            dateStr = `Il y a ${diffMins} min`
          } else {
            dateStr = `Il y a ${diffHours}h`
          }
          
          news.push({
            title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ''),
            snippet: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').substring(0, 150) : '',
            date: dateStr,
            source: 'Bing News'
          })
        }
      }
      
      if (news.length > 0) {
        console.log(`✓ Bing News returned ${news.length} articles from today`)
        return res.json({ news, timestamp: new Date().toISOString(), source: 'Bing News' })
      }
    } catch (error) {
      console.error('Bing News error:', error.message)
    }
    
    // Fallback 2: Google News RSS
    try {
      console.log(`Fetching from Google News for sector: ${sector}`)
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keywords + ' finance')}&hl=fr&gl=FR&ceid=FR:fr`
      const rssResponse = await fetch(rssUrl)
      const rssText = await rssResponse.text()
      
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/
      const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/
      const dateRegex = /<pubDate>(.*?)<\/pubDate>/
      
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      const news = []
      let match
      
      while ((match = itemRegex.exec(rssText)) !== null && news.length < 4) {
        const item = match[1]
        const titleMatch = titleRegex.exec(item)
        const descMatch = descRegex.exec(item)
        const dateMatch = dateRegex.exec(item)
        
        if (titleMatch && dateMatch) {
          const publishedDate = new Date(dateMatch[1])
          
          // Ne garde que les actualités d'aujourd'hui
          if (publishedDate < todayStart) continue
          
          const now = new Date()
          const diffMs = now - publishedDate
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          
          let dateStr
          if (diffHours < 1) {
            const diffMins = Math.floor(diffMs / (1000 * 60))
            dateStr = `Il y a ${diffMins} min`
          } else {
            dateStr = `Il y a ${diffHours}h`
          }
          
          news.push({
            title: titleMatch[1].replace(/ - .*$/, ''),
            snippet: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').substring(0, 150) : '',
            date: dateStr,
            source: 'Google News'
          })
        }
      }
      
      if (news.length > 0) {
        console.log(`✓ Google News returned ${news.length} articles from today`)
        return res.json({ news, timestamp: new Date().toISOString(), source: 'Google News RSS' })
      }
    } catch (error) {
      console.error('Google News error:', error.message)
    }
    
    // Si tout échoue, retourne des actualités génériques
    console.log('All news sources failed, returning empty')
    res.json({ 
      news: [], 
      timestamp: new Date().toISOString(), 
      source: 'None',
      error: 'Unable to fetch news from any source'
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    res.json({ news: [], timestamp: new Date().toISOString(), error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`)
})
