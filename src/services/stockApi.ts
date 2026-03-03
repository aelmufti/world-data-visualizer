// API pour récupérer les cours en temps réel via notre proxy backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: string
}

// Récupère un cours via notre proxy
export async function fetchStockPrice(symbol: string): Promise<StockQuote | null> {
  try {
    const url = `${API_BASE_URL}/api/quote/${symbol}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error)
    return null
  }
}

// Batch fetch pour plusieurs symboles (plus efficace)
export async function fetchMultipleStocks(symbols: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>()
  
  try {
    const url = `${API_BASE_URL}/api/quotes`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbols }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Convertit l'objet en Map
    Object.entries(data).forEach(([symbol, quote]) => {
      results.set(symbol, quote as StockQuote)
    })
    
    return results
  } catch (error) {
    console.error('Error fetching multiple stocks:', error)
    return results
  }
}

// Fonction principale pour récupérer les cours
export async function fetchStockPriceWithFallback(symbol: string): Promise<StockQuote | null> {
  return fetchStockPrice(symbol)
}
