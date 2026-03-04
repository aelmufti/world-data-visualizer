import Fuse from 'fuse.js';
import symbolDatabase from './symbol-database.json' assert { type: 'json' };

export interface SymbolEntry {
  symbol: string;
  name: string;
  exchange: string;
  type: 'stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto';
  sector?: string;
  country: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: 'stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto';
}

export interface SearchOptions {
  query: string;
  limit?: number;
  types?: ('stock' | 'index' | 'etf' | 'bond' | 'trust' | 'commodity' | 'crypto')[];
}

class StockSearchService {
  private fuse: Fuse<SymbolEntry>;

  constructor() {
    // Configure Fuse.js for fuzzy search on symbol and company name
    const fuseOptions = {
      keys: [
        { name: 'symbol', weight: 2 }, // Higher weight for symbol matches
        { name: 'name', weight: 1 }
      ],
      threshold: 0.3, // Lower threshold = more strict matching
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true, // Search anywhere in the string
    };

    this.fuse = new Fuse<SymbolEntry>(symbolDatabase as SymbolEntry[], fuseOptions);
  }

  /**
   * Search for stocks, indexes, or ETFs by symbol or company name
   * @param options Search options including query, limit, and types filter
   * @returns Array of search results
   */
  search(options: SearchOptions): SearchResult[] {
    const { query, limit = 10, types } = options;

    if (!query || query.trim().length === 0) {
      return [];
    }

    // Perform fuzzy search
    let results = this.fuse.search(query);

    // Filter by type if specified
    if (types && types.length > 0) {
      results = results.filter(result => types.includes(result.item.type));
    }

    // Limit results and map to SearchResult format
    return results
      .slice(0, limit)
      .map(result => ({
        symbol: result.item.symbol,
        name: result.item.name,
        exchange: result.item.exchange,
        type: result.item.type
      }));
  }

  /**
   * Get all available symbols (for testing or initialization)
   */
  getAllSymbols(): SymbolEntry[] {
    return symbolDatabase as SymbolEntry[];
  }

  /**
   * Get symbol by exact match
   */
  getSymbol(symbol: string): SymbolEntry | undefined {
    return (symbolDatabase as SymbolEntry[]).find(entry => entry.symbol === symbol);
  }
}

// Export singleton instance
export const searchService = new StockSearchService();
