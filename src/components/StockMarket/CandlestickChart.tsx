/**
 * CandlestickChart Component
 * 
 * Interactive financial chart displaying OHLC candlestick data with volume bars.
 * Features:
 * - Multiple timeframe support (1m to 5Y)
 * - Real-time candle updates
 * - Zoom and pan controls
 * - Crosshair with OHLC tooltip
 * - Color-coded candles (green: close > open, red: close < open)
 * - Volume bars below price chart
 */

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  CrosshairMode,
  ColorType,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts';
import type { CandlestickChartProps, Timeframe, CandleData } from '../../types/stock-market';
import { stockDataService } from '../../services/stockDataService';

const TIMEFRAME_OPTIONS: Timeframe[] = ['1m', '5m', '15m', '1h', '1d', '5d', '1M', '3M', '6M', '1Y', '5Y'];

// Map timeframe to API interval and range
const getTimeframeParams = (timeframe: Timeframe): { interval: string; range: string } => {
  const mapping: Record<Timeframe, { interval: string; range: string }> = {
    '1m': { interval: '1m', range: '1d' },
    '5m': { interval: '5m', range: '1d' },
    '15m': { interval: '15m', range: '5d' },
    '1h': { interval: '1h', range: '5d' },
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

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  timeframe,
  data: initialData,
  onTimeframeChange,
  realTimeUpdate = false
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<CandleData[]>(initialData);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: '#060B14' },
        textColor: '#D1D5DB',
      },
      grid: {
        vertLines: { color: '#1F2937' },
        horzLines: { color: '#1F2937' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Create volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#6B7280',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Fetch historical data when symbol or timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;

      setLoading(true);
      setError(null);

      try {
        const params = getTimeframeParams(timeframe);
        const response = await stockDataService.fetchHistoricalData({
          symbol,
          interval: params.interval as any,
          range: params.range as any,
        });

        setChartData(response.data);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError('Failed to load chart data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe]);

  // Update chart data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || chartData.length === 0) {
      return;
    }

    // Convert CandleData to lightweight-charts format
    const candleData: CandlestickData[] = chartData.map(candle => ({
      time: candle.time as any,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData: HistogramData[] = chartData.map(candle => ({
      time: candle.time as any,
      value: candle.volume,
      color: candle.close >= candle.open ? '#10B98180' : '#EF444480',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

  // Real-time updates (if enabled)
  useEffect(() => {
    if (!realTimeUpdate || !candleSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    // TODO: Subscribe to WebSocket updates and update current candle
    // This will be implemented when WebSocket integration is complete
    
  }, [realTimeUpdate, symbol]);

  /**
   * Export chart data to CSV file
   * Generates CSV with columns: timestamp, open, high, low, close, volume
   * Filename format: {symbol}_{startDate}_{endDate}.csv
   */
  const exportToCSV = () => {
    if (chartData.length === 0) {
      setError('No data available to export');
      return;
    }

    setExporting(true);
    setError(null);
    setExportSuccess(false);

    try {
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

      // Create Blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);

      // Show success message
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-[#0A1628] rounded-lg border border-gray-800 p-4">
      {/* Header with timeframe selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">{symbol}</h3>
          {loading && (
            <span className="text-xs text-gray-400">Loading...</span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Export button */}
          <button
            onClick={exportToCSV}
            disabled={exporting || chartData.length === 0}
            className={`px-2.5 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
              exporting || chartData.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title="Export chart data to CSV"
          >
            <svg 
              className="w-3.5 h-3.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export CSV'}</span>
            <span className="sm:hidden">CSV</span>
          </button>

          {/* Timeframe selector */}
          <div className="flex flex-wrap gap-1 bg-[#060B14] rounded-lg p-1">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success message */}
      {exportSuccess && (
        <div className="mb-3 p-2.5 bg-green-900/20 border border-green-800 rounded text-green-400 text-xs">
          Data exported successfully!
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2.5 bg-red-900/20 border border-red-800 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Chart container */}
      <div ref={chartContainerRef} className="w-full" />

      {/* Chart info */}
      <div className="mt-3 text-xs text-gray-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="text-[10px] sm:text-xs">
          Zoom: Scroll | Pan: Drag | Reset: Double click
        </div>
        <div className="text-[10px] sm:text-xs">
          {chartData.length} points
        </div>
      </div>
    </div>
  );
};
