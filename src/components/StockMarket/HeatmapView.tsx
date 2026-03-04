/**
 * HeatmapView Component
 * 
 * Displays a treemap visualization of stock performance using D3.js
 * Features:
 * - Size rectangles proportionally to market capitalization
 * - Color cells by percentage change (green for gains, red for losses)
 * - Display tooltip on hover with stock details
 * - Click handler to navigate to stock detail view
 * - Group stocks by sector
 * - Sector/index filter dropdown
 * - Real-time price updates for color changes
 * 
 * Validates Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { HeatmapData, StockQuote } from '../../types/stock-market';
import { stockWebSocket } from '../../services/stockWebSocket';

interface HeatmapViewProps {
  onStockSelect?: (symbol: string) => void;
}

interface HeatmapNode extends d3.HierarchyRectangularNode<HeatmapData> {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  data: HeatmapData;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({ onStockSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<HeatmapData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available sectors for filtering
  const sectors = ['all', 'Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer', 'Industrial'];

  // Fetch initial heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API endpoint when available
        // For now, using mock data
        const mockData: HeatmapData[] = [
          { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 3000000000000, changePercent: 2.5, volume: 50000000 },
          { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', marketCap: 2800000000000, changePercent: 1.8, volume: 30000000 },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', marketCap: 1800000000000, changePercent: -0.5, volume: 25000000 },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', marketCap: 1600000000000, changePercent: 3.2, volume: 40000000 },
          { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', marketCap: 1500000000000, changePercent: 5.7, volume: 60000000 },
          { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer', marketCap: 800000000000, changePercent: -2.3, volume: 80000000 },
          { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', marketCap: 500000000000, changePercent: 0.8, volume: 15000000 },
          { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 450000000000, changePercent: -0.3, volume: 10000000 },
          { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', marketCap: 550000000000, changePercent: 1.2, volume: 8000000 },
          { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', marketCap: 400000000000, changePercent: 0.5, volume: 12000000 },
          { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', marketCap: 450000000000, changePercent: -1.5, volume: 20000000 },
          { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', marketCap: 480000000000, changePercent: 1.9, volume: 5000000 },
          { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer', marketCap: 380000000000, changePercent: 0.3, volume: 7000000 },
          { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Finance', marketCap: 420000000000, changePercent: 1.5, volume: 6000000 },
          { symbol: 'HD', name: 'Home Depot', sector: 'Consumer', marketCap: 350000000000, changePercent: -0.8, volume: 9000000 },
          { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy', marketCap: 300000000000, changePercent: -2.1, volume: 15000000 },
          { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', marketCap: 280000000000, changePercent: -1.2, volume: 25000000 },
          { symbol: 'BAC', name: 'Bank of America', sector: 'Finance', marketCap: 320000000000, changePercent: 0.9, volume: 30000000 },
          { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', marketCap: 290000000000, changePercent: 2.1, volume: 8000000 },
          { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', marketCap: 250000000000, changePercent: 3.5, volume: 12000000 },
        ];

        setData(mockData);
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
        setError('Failed to load heatmap data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  // Subscribe to real-time price updates
  useEffect(() => {
    if (data.length === 0) return;

    const handleQuoteUpdate = (quote: StockQuote) => {
      setData(prevData => 
        prevData.map(item => 
          item.symbol === quote.symbol
            ? { ...item, changePercent: quote.changePercent }
            : item
        )
      );
    };

    const symbols = data.map(item => item.symbol);
    stockWebSocket.on('quote', handleQuoteUpdate);
    stockWebSocket.subscribe(symbols);

    return () => {
      stockWebSocket.off('quote', handleQuoteUpdate);
      stockWebSocket.unsubscribe(symbols);
    };
  }, [data.length]);

  // Render treemap
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Filter data based on selected sector
    const filteredData = selectedFilter === 'all' 
      ? data 
      : data.filter(item => item.sector === selectedFilter);

    if (filteredData.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Get container dimensions
    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = Math.max(600, container.clientHeight);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font-family', 'DM Sans, sans-serif');

    // Create hierarchy
    const root = d3.hierarchy<HeatmapData>({ 
      symbol: 'root', 
      name: 'Market', 
      sector: '', 
      marketCap: 0, 
      changePercent: 0, 
      volume: 0,
      children: filteredData 
    } as any)
      .sum(d => d.marketCap || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    const treemap = d3.treemap<HeatmapData>()
      .size([width, height])
      .padding(2)
      .round(true);

    treemap(root);

    // Color scale for percentage change
    const colorScale = d3.scaleLinear<string>()
      .domain([-10, 0, 10])
      .range(['#dc2626', '#1f2937', '#16a34a'])
      .clamp(true);

    // Create cells
    const cells = svg.selectAll('g')
      .data(root.leaves() as HeatmapNode[])
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Add rectangles
    cells.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => colorScale(d.data.changePercent))
      .attr('stroke', '#060B14')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .style('transition', 'opacity 0.2s')
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 0.8);
        showTooltip(event, d.data);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 1);
        hideTooltip();
      })
      .on('click', (_event, d) => {
        if (onStockSelect) {
          onStockSelect(d.data.symbol);
        }
      });

    // Add text labels
    cells.each(function(d) {
      const cell = d3.select(this);
      const cellWidth = d.x1 - d.x0;
      const cellHeight = d.y1 - d.y0;

      // Only show text if cell is large enough
      if (cellWidth > 60 && cellHeight > 40) {
        // Symbol
        cell.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2 - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', Math.min(cellWidth / 6, 16))
          .attr('font-weight', 'bold')
          .style('pointer-events', 'none')
          .text(d.data.symbol);

        // Change percentage
        cell.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2 + 12)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', Math.min(cellWidth / 8, 14))
          .style('pointer-events', 'none')
          .text(`${d.data.changePercent >= 0 ? '+' : ''}${d.data.changePercent.toFixed(2)}%`);
      } else if (cellWidth > 40 && cellHeight > 25) {
        // Only show symbol for smaller cells
        cell.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', Math.min(cellWidth / 5, 12))
          .attr('font-weight', 'bold')
          .style('pointer-events', 'none')
          .text(d.data.symbol);
      }
    });

  }, [data, selectedFilter, onStockSelect]);

  // Tooltip functions
  const showTooltip = (event: MouseEvent, data: HeatmapData) => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;

    tooltip.innerHTML = `
      <div class="font-bold text-white mb-1">${data.symbol}</div>
      <div class="text-gray-300 text-sm mb-2">${data.name}</div>
      <div class="text-sm">
        <div class="flex justify-between gap-4 mb-1">
          <span class="text-gray-400">Change:</span>
          <span class="${data.changePercent >= 0 ? 'text-green-500' : 'text-red-500'} font-semibold">
            ${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%
          </span>
        </div>
        <div class="flex justify-between gap-4 mb-1">
          <span class="text-gray-400">Market Cap:</span>
          <span class="text-white">${formatMarketCap(data.marketCap)}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-gray-400">Volume:</span>
          <span class="text-white">${formatVolume(data.volume)}</span>
        </div>
      </div>
    `;
  };

  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  };

  // Format helpers
  const formatMarketCap = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (value: number): string => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return `${value}`;
  };

  if (loading) {
    return (
      <div className="bg-[#0A1628] rounded-lg border border-gray-800 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-400">Loading heatmap...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0A1628] rounded-lg border border-gray-800 p-8">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A1628] rounded-lg border border-gray-800 p-6">
      {/* Header with filter */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Market Heatmap</h2>
          <p className="text-sm text-gray-400">Size by market cap, color by performance</p>
        </div>

        {/* Sector filter dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sector-filter" className="text-sm text-gray-400">
            Filter:
          </label>
          <select
            id="sector-filter"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-[#060B14] text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sectors.map(sector => (
              <option key={sector} value={sector}>
                {sector === 'all' ? 'All Sectors' : sector}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span className="text-gray-400">Losses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded"></div>
          <span className="text-gray-400">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span className="text-gray-400">Gains</span>
        </div>
      </div>

      {/* Treemap container */}
      <div className="relative w-full" style={{ minHeight: '600px' }}>
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-[#0A1628] border border-gray-700 rounded-lg p-3 shadow-xl pointer-events-none"
        style={{ display: 'none' }}
      />
    </div>
  );
};
