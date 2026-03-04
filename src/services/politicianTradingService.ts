// Service for fetching politician trading data from House/Senate Stock Watcher APIs

export interface PoliticianTrade {
  transaction_date: string
  disclosure_date: string
  ticker: string
  asset_description: string
  type: string // 'purchase' | 'sale' | 'exchange'
  amount: string
  representative: string
  district?: string
  ptr_link?: string
  cap_gains_over_200_usd?: boolean
}

export interface PoliticianStats {
  name: string
  totalTrades: number
  recentTrades: number
  mostTradedStock: string
}

class PoliticianTradingService {
  private baseUrl = 'http://localhost:8000/api/politician-trading'
  
  private cache: {
    house: PoliticianTrade[] | null
    senate: PoliticianTrade[] | null
    lastFetch: number
  } = {
    house: null,
    senate: null,
    lastFetch: 0
  }

  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async fetchHouseTrades(): Promise<PoliticianTrade[]> {
    try {
      const response = await fetch(`${this.baseUrl}/house`)
      if (!response.ok) throw new Error('Failed to fetch House trades')
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching House trades:', error)
      return []
    }
  }

  async fetchSenateTrades(): Promise<PoliticianTrade[]> {
    try {
      const response = await fetch(`${this.baseUrl}/senate`)
      if (!response.ok) throw new Error('Failed to fetch Senate trades')
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching Senate trades:', error)
      return []
    }
  }

  async getAllTrades(forceRefresh = false): Promise<PoliticianTrade[]> {
    const now = Date.now()
    
    if (!forceRefresh && this.cache.house && this.cache.senate && (now - this.cache.lastFetch) < this.CACHE_DURATION) {
      return [...this.cache.house, ...this.cache.senate]
    }

    try {
      const response = await fetch(`${this.baseUrl}/all`)
      if (!response.ok) throw new Error('Failed to fetch all trades')
      const data = await response.json()
      
      // Handle both old format (array) and new format (object with trades array)
      const trades = Array.isArray(data) ? data : (data.trades || [])
      
      // Split back into house and senate for cache
      this.cache.house = trades.filter((t: PoliticianTrade) => !t.district?.includes('Senate'))
      this.cache.senate = trades.filter((t: PoliticianTrade) => t.district?.includes('Senate'))
      this.cache.lastFetch = now

      return trades
    } catch (error) {
      console.error('Error fetching all trades:', error)
      return []
    }
  }

  async getTradesByPolitician(name: string): Promise<PoliticianTrade[]> {
    const allTrades = await this.getAllTrades()
    return allTrades.filter(trade => 
      trade.representative.toLowerCase().includes(name.toLowerCase())
    ).sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )
  }

  async getRecentTrades(limit = 50): Promise<PoliticianTrade[]> {
    const allTrades = await this.getAllTrades()
    return allTrades
      .sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      )
      .slice(0, limit)
  }

  async getFeaturedTrades(): Promise<{ trades: any[]; politicians: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/featured`)
      if (!response.ok) throw new Error('Failed to fetch featured trades')
      const data = await response.json()
      
      return {
        trades: data.trades || [],
        politicians: data.politicians || []
      }
    } catch (error) {
      console.error('Error fetching featured trades:', error)
      return { trades: [], politicians: [] }
    }
  }

  async getTopTraders(limit = 10): Promise<PoliticianStats[]> {
    const allTrades = await this.getAllTrades()
    const traderMap = new Map<string, PoliticianTrade[]>()

    allTrades.forEach(trade => {
      const existing = traderMap.get(trade.representative) || []
      traderMap.set(trade.representative, [...existing, trade])
    })

    const stats: PoliticianStats[] = []
    traderMap.forEach((trades, name) => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentTrades = trades.filter(t => 
        new Date(t.transaction_date) >= thirtyDaysAgo
      )

      const tickerCounts = new Map<string, number>()
      trades.forEach(t => {
        if (t.ticker) {
          tickerCounts.set(t.ticker, (tickerCounts.get(t.ticker) || 0) + 1)
        }
      })

      let mostTradedStock = 'N/A'
      let maxCount = 0
      tickerCounts.forEach((count, ticker) => {
        if (count > maxCount) {
          maxCount = count
          mostTradedStock = ticker
        }
      })

      stats.push({
        name,
        totalTrades: trades.length,
        recentTrades: recentTrades.length,
        mostTradedStock
      })
    })

    return stats
      .sort((a, b) => b.recentTrades - a.recentTrades)
      .slice(0, limit)
  }

  parseAmount(amount: string): { min: number; max: number; display: string } {
    // Parse ranges like "$1,001 - $15,000" or "$15,001 - $50,000"
    const match = amount.match(/\$([0-9,]+)\s*-\s*\$([0-9,]+)/)
    if (match) {
      const min = parseInt(match[1].replace(/,/g, ''))
      const max = parseInt(match[2].replace(/,/g, ''))
      return { min, max, display: amount }
    }
    return { min: 0, max: 0, display: amount }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }
}

export const politicianTradingService = new PoliticianTradingService()
