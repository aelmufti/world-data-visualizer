import { useState, useEffect, useCallback } from 'react'
import { fetchMultipleStocks, type StockQuote } from '../services/stockApi'

export function useStockPrices(symbols: string[], refreshInterval = 60000) {
  const [prices, setPrices] = useState<Map<string, StockQuote>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    if (symbols.length === 0) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Utilise le batch endpoint pour récupérer tous les cours en une seule requête
      const quotes = await fetchMultipleStocks(symbols)
      setPrices(quotes)
    } catch (err) {
      setError('Erreur lors de la récupération des cours')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [symbols])

  useEffect(() => {
    fetchPrices()
    
    // Rafraîchissement automatique
    const interval = setInterval(fetchPrices, refreshInterval)
    
    return () => clearInterval(interval)
  }, [fetchPrices, refreshInterval])

  return { prices, loading, error, refetch: fetchPrices }
}
