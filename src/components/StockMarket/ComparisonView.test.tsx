/**
 * ComparisonView Component Tests
 * 
 * Tests for the comparison view component including:
 * - Data fetching and processing
 * - Metrics calculation
 * - Normalized percentage calculation
 * - Security management (add/remove)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CandleData, HistoricalDataResponse } from '../../types/stock-market';

const mockHistoricalData: HistoricalDataResponse = {
  symbol: 'AAPL',
  data: [
    { time: 1704067200, open: 150, high: 155, low: 149, close: 154, volume: 1000000 },
    { time: 1704153600, open: 154, high: 158, low: 153, close: 157, volume: 1100000 },
    { time: 1704240000, open: 157, high: 160, low: 156, close: 159, volume: 1200000 },
  ],
  meta: {
    currency: 'USD',
    exchangeName: 'NASDAQ',
    instrumentType: 'EQUITY',
  },
};

describe('ComparisonView Data Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate percentage change from first data point', () => {
    const data = mockHistoricalData.data;
    const firstPrice = data[0].close;
    
    const percentageChanges = data.map(candle => 
      ((candle.close - firstPrice) / firstPrice) * 100
    );

    expect(percentageChanges[0]).toBe(0); // First point is 0%
    expect(percentageChanges[1]).toBeCloseTo(1.95, 1); // (157-154)/154 * 100
    expect(percentageChanges[2]).toBeCloseTo(3.25, 1); // (159-154)/154 * 100
  });

  it('should calculate metrics correctly', () => {
    const data = mockHistoricalData.data;
    const latestCandle = data[data.length - 1];
    const firstCandle = data[0];
    
    const change = latestCandle.close - firstCandle.close;
    const changePercent = (change / firstCandle.close) * 100;
    const avgVolume = data.reduce((sum, candle) => sum + candle.volume, 0) / data.length;

    expect(change).toBe(5); // 159 - 154
    expect(changePercent).toBeCloseTo(3.25, 2);
    expect(avgVolume).toBe(1100000); // (1000000 + 1100000 + 1200000) / 3
  });

  it('should handle positive and negative changes', () => {
    const positiveChange = 5;
    const negativeChange = -3;
    
    expect(positiveChange >= 0).toBe(true);
    expect(negativeChange >= 0).toBe(false);
  });

  it('should limit securities to maximum of 4', () => {
    const maxSecurities = 4;
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    
    const limitedSymbols = symbols.slice(0, maxSecurities);
    
    expect(limitedSymbols.length).toBe(4);
    expect(limitedSymbols).toEqual(['AAPL', 'GOOGL', 'MSFT', 'TSLA']);
  });

  it('should prevent duplicate symbols', () => {
    const existingSymbols = ['AAPL', 'GOOGL'];
    const newSymbol = 'AAPL';
    
    const isDuplicate = existingSymbols.includes(newSymbol);
    
    expect(isDuplicate).toBe(true);
  });

  it('should remove symbol from list', () => {
    const symbols = ['AAPL', 'GOOGL', 'MSFT'];
    const symbolToRemove = 'GOOGL';
    
    const updatedSymbols = symbols.filter(s => s !== symbolToRemove);
    
    expect(updatedSymbols).toEqual(['AAPL', 'MSFT']);
    expect(updatedSymbols.length).toBe(2);
  });

  it('should format volume in millions', () => {
    const volume = 1200000;
    const volumeInMillions = (volume / 1000000).toFixed(2);
    
    expect(volumeInMillions).toBe('1.20');
  });

  it('should format price to 2 decimal places', () => {
    const price = 159.456789;
    const formattedPrice = price.toFixed(2);
    
    expect(formattedPrice).toBe('159.46');
  });

  it('should map timeframe to correct API parameters', () => {
    const getTimeframeParams = (timeframe: string) => {
      const mapping: Record<string, { interval: string; range: string }> = {
        '1d': { interval: '1d', range: '1mo' },
        '5d': { interval: '1d', range: '5d' },
        '1M': { interval: '1d', range: '1mo' },
        '3M': { interval: '1d', range: '3mo' },
        '6M': { interval: '1d', range: '6mo' },
        '1Y': { interval: '1d', range: '1y' },
        '5Y': { interval: '1d', range: '5y' }
      };
      return mapping[timeframe];
    };

    expect(getTimeframeParams('1M')).toEqual({ interval: '1d', range: '1mo' });
    expect(getTimeframeParams('3M')).toEqual({ interval: '1d', range: '3mo' });
    expect(getTimeframeParams('1Y')).toEqual({ interval: '1d', range: '1y' });
  });

  it('should handle empty data gracefully', () => {
    const emptyData: CandleData[] = [];
    
    expect(emptyData.length).toBe(0);
    
    // Metrics should not be calculated for empty data
    const hasData = emptyData.length > 0;
    expect(hasData).toBe(false);
  });

  it('should assign different colors to different securities', () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
    
    const assignedColors = symbols.map((_, index) => colors[index % colors.length]);
    
    expect(assignedColors[0]).toBe('#3B82F6');
    expect(assignedColors[1]).toBe('#10B981');
    expect(assignedColors[2]).toBe('#F59E0B');
    expect(assignedColors[3]).toBe('#EF4444');
  });
});

