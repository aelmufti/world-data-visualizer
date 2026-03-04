import { describe, it, expect } from 'vitest';
import { searchService } from './search-service.js';

describe('StockSearchService', () => {
  describe('search', () => {
    it('should return empty array for empty query', () => {
      const results = searchService.search({ query: '' });
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', () => {
      const results = searchService.search({ query: '   ' });
      expect(results).toEqual([]);
    });

    it('should find stocks by exact symbol match', () => {
      const results = searchService.search({ query: 'AAPL' });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe('AAPL');
      expect(results[0].name).toBe('Apple Inc.');
      expect(results[0].type).toBe('stock');
    });

    it('should find stocks by partial symbol match', () => {
      const results = searchService.search({ query: 'AAP' });
      expect(results.length).toBeGreaterThan(0);
      const appleResult = results.find(r => r.symbol === 'AAPL');
      expect(appleResult).toBeDefined();
    });

    it('should find stocks by company name', () => {
      const results = searchService.search({ query: 'Apple' });
      expect(results.length).toBeGreaterThan(0);
      const appleResult = results.find(r => r.symbol === 'AAPL');
      expect(appleResult).toBeDefined();
      expect(appleResult?.name).toContain('Apple');
    });

    it('should find stocks by partial company name', () => {
      const results = searchService.search({ query: 'Micro' });
      expect(results.length).toBeGreaterThan(0);
      const microsoftResult = results.find(r => r.symbol === 'MSFT');
      expect(microsoftResult).toBeDefined();
    });

    it('should be case-insensitive', () => {
      const upperResults = searchService.search({ query: 'APPLE' });
      const lowerResults = searchService.search({ query: 'apple' });
      const mixedResults = searchService.search({ query: 'ApPlE' });
      
      expect(upperResults.length).toBeGreaterThan(0);
      expect(lowerResults.length).toBeGreaterThan(0);
      expect(mixedResults.length).toBeGreaterThan(0);
      
      // All should find Apple
      expect(upperResults.some(r => r.symbol === 'AAPL')).toBe(true);
      expect(lowerResults.some(r => r.symbol === 'AAPL')).toBe(true);
      expect(mixedResults.some(r => r.symbol === 'AAPL')).toBe(true);
    });

    it('should respect limit parameter', () => {
      const results = searchService.search({ query: 'a', limit: 5 });
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should default to 10 results when limit not specified', () => {
      const results = searchService.search({ query: 'a' });
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should filter by stock type', () => {
      const results = searchService.search({ 
        query: 'S&P', 
        types: ['stock'] 
      });
      
      // Should not include S&P 500 index
      const indexResult = results.find(r => r.symbol === '^GSPC');
      expect(indexResult).toBeUndefined();
    });

    it('should filter by index type', () => {
      const results = searchService.search({ 
        query: 'S&P', 
        types: ['index'] 
      });
      
      // Should include S&P 500 index
      const indexResult = results.find(r => r.symbol === '^GSPC');
      expect(indexResult).toBeDefined();
      expect(indexResult?.type).toBe('index');
    });

    it('should filter by etf type', () => {
      const results = searchService.search({ 
        query: 'SPY', 
        types: ['etf'] 
      });
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.type).toBe('etf');
      });
    });

    it('should filter by multiple types', () => {
      const results = searchService.search({ 
        query: 'S&P', 
        types: ['index', 'etf'] 
      });
      
      results.forEach(result => {
        expect(['index', 'etf']).toContain(result.type);
      });
    });

    it('should find US stocks', () => {
      const results = searchService.search({ query: 'Apple' });
      const appleResult = results.find(r => r.symbol === 'AAPL');
      expect(appleResult).toBeDefined();
      expect(appleResult?.exchange).toBe('NASDAQ');
    });

    it('should find European stocks', () => {
      const results = searchService.search({ query: 'LVMH' });
      expect(results.length).toBeGreaterThan(0);
      const lvmhResult = results.find(r => r.symbol === 'MC.PA');
      expect(lvmhResult).toBeDefined();
      expect(lvmhResult?.exchange).toBe('Euronext Paris');
    });

    it('should find Asian stocks', () => {
      const results = searchService.search({ query: 'Toyota' });
      expect(results.length).toBeGreaterThan(0);
      const toyotaResult = results.find(r => r.symbol === '7203.T');
      expect(toyotaResult).toBeDefined();
      expect(toyotaResult?.exchange).toBe('TSE');
    });

    it('should return results with all required fields', () => {
      const results = searchService.search({ query: 'Apple' });
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('exchange');
        expect(result).toHaveProperty('type');
        expect(typeof result.symbol).toBe('string');
        expect(typeof result.name).toBe('string');
        expect(typeof result.exchange).toBe('string');
        expect(['stock', 'index', 'etf']).toContain(result.type);
      });
    });
  });

  describe('getAllSymbols', () => {
    it('should return all symbols from database', () => {
      const symbols = searchService.getAllSymbols();
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols.every(s => s.symbol && s.name && s.exchange && s.type)).toBe(true);
    });
  });

  describe('getSymbol', () => {
    it('should return symbol by exact match', () => {
      const symbol = searchService.getSymbol('AAPL');
      expect(symbol).toBeDefined();
      expect(symbol?.symbol).toBe('AAPL');
      expect(symbol?.name).toBe('Apple Inc.');
    });

    it('should return undefined for non-existent symbol', () => {
      const symbol = searchService.getSymbol('NONEXISTENT');
      expect(symbol).toBeUndefined();
    });

    it('should be case-sensitive for exact match', () => {
      const symbol = searchService.getSymbol('aapl');
      expect(symbol).toBeUndefined();
    });
  });
});
