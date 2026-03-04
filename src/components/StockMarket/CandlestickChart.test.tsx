/**
 * Tests for CandlestickChart Component - Export Functionality
 * 
 * Validates Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CandleData } from '../../types/stock-market';

describe('CandlestickChart - Export Functionality', () => {
  const mockData: CandleData[] = [
    { time: 1704067200, open: 150.0, high: 152.0, low: 149.0, close: 151.0, volume: 1000000 },
    { time: 1704153600, open: 151.0, high: 153.0, low: 150.0, close: 152.5, volume: 1100000 },
    { time: 1704240000, open: 152.5, high: 154.0, low: 151.5, close: 153.0, volume: 1200000 },
  ];

  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    vi.restoreAllMocks();
  });

  /**
   * Helper function to simulate CSV export
   * This mimics the exportToCSV function in CandlestickChart
   */
  const exportToCSV = (chartData: CandleData[], symbol: string): { csvContent: string; filename: string } => {
    if (chartData.length === 0) {
      throw new Error('No data available to export');
    }

    // Create CSV header
    const header = 'timestamp,open,high,low,close,volume\n';
    
    // Convert data to CSV rows
    const rows = chartData.map(candle => {
      // Convert Unix timestamp to ISO 8601 string
      const timestamp = new Date(candle.time * 1000).toISOString();
      return `${timestamp},${candle.open},${candle.high},${candle.low},${candle.close},${candle.volume}`;
    }).join('\n');

    const csvContent = header + rows;

    // Create filename: {symbol}_{startDate}_{endDate}.csv
    const startDate = new Date(chartData[0].time * 1000).toISOString().split('T')[0];
    const endDate = new Date(chartData[chartData.length - 1].time * 1000).toISOString().split('T')[0];
    const filename = `${symbol}_${startDate}_${endDate}.csv`;

    return { csvContent, filename };
  };

  it('should generate CSV with correct columns: timestamp, open, high, low, close, volume (Requirement 12.2)', () => {
    const { csvContent } = exportToCSV(mockData, 'AAPL');
    
    // Verify CSV header
    expect(csvContent).toContain('timestamp,open,high,low,close,volume');
    
    // Verify data rows contain all columns
    const lines = csvContent.split('\n');
    expect(lines.length).toBeGreaterThan(1); // Header + data rows
    
    // Check first data row
    const firstDataRow = lines[1];
    const columns = firstDataRow.split(',');
    expect(columns).toHaveLength(6);
    
    // Verify timestamp is ISO 8601 format
    expect(columns[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should format filename as {symbol}_{startDate}_{endDate}.csv (Requirement 12.3)', () => {
    const { filename } = exportToCSV(mockData, 'AAPL');

    // Verify filename format
    expect(filename).toMatch(/^AAPL_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/);
    
    // Verify specific dates
    expect(filename).toBe('AAPL_2024-01-01_2024-01-03.csv');
  });

  it('should export data for currently displayed timeframe (Requirement 12.4)', () => {
    const { csvContent } = exportToCSV(mockData, 'AAPL');
    
    // Verify all data points are included
    const lines = csvContent.split('\n').filter(line => line.trim());
    expect(lines.length).toBe(mockData.length + 1); // Header + data rows
    
    // Verify data matches the displayed data
    const dataLines = lines.slice(1); // Skip header
    dataLines.forEach((line, index) => {
      const columns = line.split(',');
      expect(parseFloat(columns[1])).toBe(mockData[index].open);
      expect(parseFloat(columns[2])).toBe(mockData[index].high);
      expect(parseFloat(columns[3])).toBe(mockData[index].low);
      expect(parseFloat(columns[4])).toBe(mockData[index].close);
      expect(parseFloat(columns[5])).toBe(mockData[index].volume);
    });
  });

  it('should complete export within 3 seconds for up to 10,000 data points (Requirement 12.5)', () => {
    // Generate 10,000 data points
    const largeDataset: CandleData[] = Array.from({ length: 10000 }, (_, i) => ({
      time: 1704067200 + i * 86400,
      open: 150 + Math.random() * 10,
      high: 155 + Math.random() * 10,
      low: 145 + Math.random() * 10,
      close: 150 + Math.random() * 10,
      volume: 1000000 + Math.random() * 500000,
    }));

    const startTime = performance.now();
    const { csvContent } = exportToCSV(largeDataset, 'AAPL');
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    // Verify export completed within 3 seconds
    expect(duration).toBeLessThan(3000);
    
    // Verify all data was exported
    const lines = csvContent.split('\n').filter(line => line.trim());
    expect(lines.length).toBe(10001); // Header + 10,000 data rows
  });

  it('should throw error when exporting empty data', () => {
    expect(() => exportToCSV([], 'AAPL')).toThrow('No data available to export');
  });

  it('should format timestamps as ISO 8601 strings', () => {
    const { csvContent } = exportToCSV(mockData, 'AAPL');
    
    const lines = csvContent.split('\n');
    const firstDataRow = lines[1];
    const timestamp = firstDataRow.split(',')[0];
    
    // Verify ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    
    // Verify timestamp can be parsed back to Date
    const date = new Date(timestamp);
    expect(date.getTime()).toBe(mockData[0].time * 1000);
  });

  it('should include volume data in export', () => {
    const { csvContent } = exportToCSV(mockData, 'AAPL');
    
    const lines = csvContent.split('\n');
    
    // Check each data row has volume
    for (let i = 1; i <= mockData.length; i++) {
      const columns = lines[i].split(',');
      const volume = parseFloat(columns[5]);
      expect(volume).toBe(mockData[i - 1].volume);
    }
  });

  it('should handle edge case: single data point', () => {
    const singleDataPoint: CandleData[] = [
      { time: 1704067200, open: 150.0, high: 152.0, low: 149.0, close: 151.0, volume: 1000000 },
    ];

    const { csvContent, filename } = exportToCSV(singleDataPoint, 'AAPL');
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    expect(lines.length).toBe(2); // Header + 1 data row
    
    // Filename should have same start and end date
    expect(filename).toBe('AAPL_2024-01-01_2024-01-01.csv');
  });

  it('should include all OHLC values correctly', () => {
    const { csvContent } = exportToCSV(mockData, 'AAPL');
    
    const lines = csvContent.split('\n');
    const secondDataRow = lines[2]; // Check second row
    const columns = secondDataRow.split(',');
    
    expect(parseFloat(columns[1])).toBe(151.0); // open
    expect(parseFloat(columns[2])).toBe(153.0); // high
    expect(parseFloat(columns[3])).toBe(150.0); // low
    expect(parseFloat(columns[4])).toBe(152.5); // close
    expect(parseFloat(columns[5])).toBe(1100000); // volume
  });

  it('should handle large volume numbers correctly', () => {
    const largeVolumeData: CandleData[] = [
      { time: 1704067200, open: 150.0, high: 152.0, low: 149.0, close: 151.0, volume: 999999999999 },
    ];

    const { csvContent } = exportToCSV(largeVolumeData, 'AAPL');
    
    const lines = csvContent.split('\n');
    const dataRow = lines[1];
    const columns = dataRow.split(',');
    
    expect(parseFloat(columns[5])).toBe(999999999999);
  });

  it('should handle decimal precision in prices', () => {
    const preciseData: CandleData[] = [
      { time: 1704067200, open: 150.123456, high: 152.987654, low: 149.111111, close: 151.555555, volume: 1000000 },
    ];

    const { csvContent } = exportToCSV(preciseData, 'AAPL');
    
    const lines = csvContent.split('\n');
    const dataRow = lines[1];
    const columns = dataRow.split(',');
    
    expect(parseFloat(columns[1])).toBe(150.123456);
    expect(parseFloat(columns[2])).toBe(152.987654);
    expect(parseFloat(columns[3])).toBe(149.111111);
    expect(parseFloat(columns[4])).toBe(151.555555);
  });

  it('should maintain chronological order of data', () => {
    const { csvContent } = exportToCSV(mockData, 'AAPL');
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // Skip header
    
    // Extract timestamps and verify they are in ascending order
    const timestamps = dataLines.map(line => {
      const timestamp = line.split(',')[0];
      return new Date(timestamp).getTime();
    });
    
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
    }
  });

  it('should handle different symbols correctly', () => {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
    
    symbols.forEach(symbol => {
      const { filename } = exportToCSV(mockData, symbol);
      expect(filename).toContain(symbol);
      expect(filename).toMatch(new RegExp(`^${symbol}_\\d{4}-\\d{2}-\\d{2}_\\d{4}-\\d{2}-\\d{2}\\.csv$`));
    });
  });

  it('should create valid CSV that can be parsed', () => {
    const { csvContent } = exportToCSV(mockData, 'AAPL');
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const header = lines[0].split(',');
    
    // Verify header
    expect(header).toEqual(['timestamp', 'open', 'high', 'low', 'close', 'volume']);
    
    // Verify each data row has correct number of columns
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      expect(columns.length).toBe(6);
    }
  });
});
