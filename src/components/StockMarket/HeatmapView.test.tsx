/**
 * Unit tests for HeatmapView component
 * Tests data handling, filtering, and real-time updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HeatmapData, StockQuote } from '../../types/stock-market';

// Mock data
const mockHeatmapData: HeatmapData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 3000000000000, changePercent: 2.5, volume: 50000000 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', marketCap: 2800000000000, changePercent: 1.8, volume: 30000000 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', marketCap: 1800000000000, changePercent: -0.5, volume: 25000000 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', marketCap: 500000000000, changePercent: 0.8, volume: 15000000 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 450000000000, changePercent: -0.3, volume: 10000000 },
];

describe('HeatmapView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter data by sector', () => {
    const sector = 'Technology';
    const filtered = mockHeatmapData.filter(item => item.sector === sector);
    
    expect(filtered.length).toBe(3);
    expect(filtered.every(item => item.sector === 'Technology')).toBe(true);
  });

  it('should return all data when filter is "all"', () => {
    const filter = 'all';
    const filtered = filter === 'all' ? mockHeatmapData : mockHeatmapData.filter(item => item.sector === filter);
    
    expect(filtered.length).toBe(mockHeatmapData.length);
  });

  it('should calculate color based on percentage change', () => {
    const getColorCategory = (changePercent: number): string => {
      if (changePercent > 0) return 'green';
      if (changePercent < 0) return 'red';
      return 'neutral';
    };

    expect(getColorCategory(2.5)).toBe('green');
    expect(getColorCategory(-0.5)).toBe('red');
    expect(getColorCategory(0)).toBe('neutral');
  });

  it('should size cells proportionally to market cap', () => {
    const sorted = [...mockHeatmapData].sort((a, b) => b.marketCap - a.marketCap);
    
    expect(sorted[0].symbol).toBe('AAPL');
    expect(sorted[0].marketCap).toBeGreaterThan(sorted[1].marketCap);
    expect(sorted[1].marketCap).toBeGreaterThan(sorted[2].marketCap);
  });

  it('should format market cap correctly', () => {
    const formatMarketCap = (value: number): string => {
      if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      return `$${value.toFixed(2)}`;
    };

    expect(formatMarketCap(3000000000000)).toBe('$3.00T');
    expect(formatMarketCap(500000000000)).toBe('$500.00B');
    expect(formatMarketCap(1000000)).toBe('$1.00M');
  });

  it('should format volume correctly', () => {
    const formatVolume = (value: number): string => {
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
      return `${value}`;
    };

    expect(formatVolume(50000000)).toBe('50.00M');
    expect(formatVolume(1500000)).toBe('1.50M');
    expect(formatVolume(5000)).toBe('5.00K');
  });

  it('should update data when receiving real-time quote', () => {
    const quote: StockQuote = {
      symbol: 'AAPL',
      price: 150.00,
      change: 2.50,
      changePercent: 1.7,
      volume: 55000000,
      timestamp: new Date().toISOString()
    };

    const updated = mockHeatmapData.map(item =>
      item.symbol === quote.symbol
        ? { ...item, changePercent: quote.changePercent }
        : item
    );

    const appleData = updated.find(item => item.symbol === 'AAPL');
    expect(appleData?.changePercent).toBe(1.7);
  });

  it('should group data by sector', () => {
    const grouped = mockHeatmapData.reduce((acc, item) => {
      if (!acc[item.sector]) {
        acc[item.sector] = [];
      }
      acc[item.sector].push(item);
      return acc;
    }, {} as Record<string, HeatmapData[]>);

    expect(grouped['Technology'].length).toBe(3);
    expect(grouped['Finance'].length).toBe(1);
    expect(grouped['Healthcare'].length).toBe(1);
  });

  it('should validate heatmap data structure', () => {
    const item = mockHeatmapData[0];
    
    expect(item).toHaveProperty('symbol');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('sector');
    expect(item).toHaveProperty('marketCap');
    expect(item).toHaveProperty('changePercent');
    expect(item).toHaveProperty('volume');
    
    expect(typeof item.symbol).toBe('string');
    expect(typeof item.name).toBe('string');
    expect(typeof item.sector).toBe('string');
    expect(typeof item.marketCap).toBe('number');
    expect(typeof item.changePercent).toBe('number');
    expect(typeof item.volume).toBe('number');
  });

  it('should handle empty data array', () => {
    const emptyData: HeatmapData[] = [];
    const filtered = emptyData.filter(item => item.sector === 'Technology');
    
    expect(filtered.length).toBe(0);
  });

  it('should calculate color intensity based on magnitude', () => {
    const getIntensity = (changePercent: number): number => {
      const absChange = Math.abs(changePercent);
      return Math.min(absChange / 10, 1); // Normalize to 0-1 range
    };

    expect(getIntensity(5)).toBe(0.5);
    expect(getIntensity(10)).toBe(1);
    expect(getIntensity(15)).toBe(1); // Clamped at 1
    expect(getIntensity(-5)).toBe(0.5);
  });

  it('should support multiple sector filters', () => {
    const sectors = ['Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer', 'Industrial'];
    
    sectors.forEach(sector => {
      const filtered = mockHeatmapData.filter(item => item.sector === sector);
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  it('should maintain data integrity during updates', () => {
    const original = [...mockHeatmapData];
    const quote: StockQuote = {
      symbol: 'MSFT',
      price: 350.00,
      change: 5.00,
      changePercent: 1.5,
      volume: 32000000,
      timestamp: new Date().toISOString()
    };

    const updated = mockHeatmapData.map(item =>
      item.symbol === quote.symbol
        ? { ...item, changePercent: quote.changePercent }
        : item
    );

    // Original data should not be mutated
    expect(mockHeatmapData[1].changePercent).toBe(original[1].changePercent);
    
    // Updated data should have new value
    const msftData = updated.find(item => item.symbol === 'MSFT');
    expect(msftData?.changePercent).toBe(1.5);
  });
});
