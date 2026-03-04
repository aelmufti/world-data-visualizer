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

interface HeatmapNode {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  data: any;
  value?: number;
  children?: HeatmapNode[];
}

// Preset configurations for different market views
const PRESETS: Record<string, { symbols: string[]; name: string }> = {
  'sp500': {
    name: 'S&P 500 Top 50',
    symbols: [
      // Technology (10)
      'AAPL', 'MSFT', 'NVDA', 'AVGO', 'ORCL', 'CSCO', 'ADBE', 'CRM', 'ACN', 'AMD',
      // Communication (5)
      'GOOGL', 'META', 'NFLX', 'DIS', 'CMCSA',
      // Consumer Cyclical (5)
      'AMZN', 'TSLA', 'HD', 'MCD', 'NKE',
      // Consumer Defensive (5)
      'WMT', 'PG', 'COST', 'KO', 'PEP',
      // Healthcare (7)
      'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT',
      // Financial (8)
      'BRK-B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'MS', 'GS',
      // Industrial (4)
      'CAT', 'BA', 'HON', 'UNP',
      // Energy (3)
      'XOM', 'CVX', 'COP',
      // Materials (2)
      'LIN', 'APD',
      // Real Estate (1)
      'AMT'
    ]
  },
  'indices': {
    name: 'Market Indices',
    symbols: [
      '^GSPC', '^IXIC', '^DJI', '^RUT', '^VIX',
      '^FCHI', '^GDAXI', '^FTSE', '^N225', '000001.SS',
      '^STOXX50E', '^AXJO', '^BVSP', '^MXX', '^KS11'
    ]
  },
  'cac40': {
    name: 'CAC 40',
    symbols: [
      // Luxury & Consumer
      'MC.PA', 'OR.PA', 'RMS.PA', 'KER.PA', 'PP.PA',
      // Energy & Utilities
      'TTE.PA', 'ENGI.PA', 'EDF.PA',
      // Industrials
      'AIR.PA', 'SAF.PA', 'SGO.PA', 'VIE.PA', 'BOL.PA',
      // Technology & Telecom
      'CAP.PA', 'DSY.PA', 'STM.PA', 'ORA.PA',
      // Finance & Insurance
      'BNP.PA', 'ACA.PA', 'GLE.PA', 'SAN.PA',
      // Healthcare & Pharma
      'SAN.PA', 'EL.PA',
      // Retail & Services
      'CA.PA', 'BN.PA', 'DG.PA', 'PUB.PA',
      // Materials & Construction
      'AI.PA', 'CS.PA', 'ML.PA', 'URW.PA',
      // Food & Beverage
      'BN.PA', 'DG.PA',
      // Automotive
      'RNO.PA', 'STLA.PA'
    ]
  },
  'sector-etf': {
    name: 'Sector ETFs',
    symbols: [
      'XLK', 'XLF', 'XLV', 'XLE', 'XLY', 'XLP', 'XLI', 'XLB',
      'XLU', 'XLRE', 'XLC', 'VGT', 'VFH', 'VHT', 'VDE',
      'IYW', 'IYF', 'IYH', 'IYE', 'IYC'
    ]
  },
  'tech-etf': {
    name: 'Technology ETFs',
    symbols: [
      'QQQ', 'VGT', 'XLK', 'SOXX', 'SMH', 'ARKK', 'ARKW',
      'IGV', 'QTEC', 'IYW', 'HACK', 'FINX', 'CLOU', 'SKYY'
    ]
  },
  'commodity-etf': {
    name: 'Commodity ETFs',
    symbols: [
      'GLD', 'SLV', 'USO', 'UNG', 'DBA', 'DBC', 'PDBC',
      'GSG', 'BCI', 'COMT', 'GCC', 'CPER', 'URA', 'PALL'
    ]
  },
  'crypto-etf': {
    name: 'Crypto & Digital Assets',
    symbols: [
      'BTC-USD', 'ETH-USD', 'BITO', 'BITI', 'GBTC', 'ETHE',
      'COIN', 'MARA', 'RIOT', 'CLSK', 'HUT', 'BITF'
    ]
  }
};

export const HeatmapView: React.FC<HeatmapViewProps> = ({ onStockSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<HeatmapData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedPreset, setSelectedPreset] = useState<string>('sp500');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available sectors for filtering
  const sectors = [
    'all', 'Technology', 'Communication', 'Consumer Cyclical', 'Consumer Defensive',
    'Healthcare', 'Financial', 'Industrial', 'Energy', 'Materials', 'Real Estate', 'Utilities'
  ];

  // Fetch initial heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get symbols from selected preset
        const preset = PRESETS[selectedPreset];
        if (!preset) {
          setError('Invalid preset selected');
          setLoading(false);
          return;
        }
        const symbols = preset.symbols;

        // Fetch real quotes from API with batching (max 50 symbols per request)
        const BATCH_SIZE = 50;
        const allQuotes: any[] = [];
        
        for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
          const batch = symbols.slice(i, i + BATCH_SIZE);
          const response = await fetch(`/api/quotes?symbols=${batch.join(',')}`);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const quotes = await response.json();
          allQuotes.push(...quotes);
        }

        // Auto-detect sector based on symbol patterns and known mappings
        const detectSector = (symbol: string): string => {
          // Indices
          if (symbol.startsWith('^') || symbol.match(/^\d{6}\.(SS|SZ)$/)) return 'Index';
          
          // Crypto
          if (symbol.endsWith('-USD') || ['COIN', 'MARA', 'RIOT', 'CLSK', 'HUT', 'BITF', 'GBTC', 'ETHE', 'BITO', 'BITI'].includes(symbol)) {
            return 'Crypto';
          }
          
          // French stocks (CAC 40)
          if (symbol.endsWith('.PA')) {
            const frenchSectors: Record<string, string> = {
              // Luxury & Consumer
              'MC.PA': 'Consumer Cyclical', 'OR.PA': 'Consumer Cyclical', 'RMS.PA': 'Consumer Cyclical',
              'KER.PA': 'Consumer Cyclical', 'PP.PA': 'Consumer Cyclical',
              // Energy & Utilities
              'TTE.PA': 'Energy', 'ENGI.PA': 'Utilities', 'EDF.PA': 'Utilities',
              // Industrials
              'AIR.PA': 'Industrial', 'SAF.PA': 'Industrial', 'SGO.PA': 'Materials',
              'VIE.PA': 'Industrial', 'BOL.PA': 'Industrial',
              // Technology & Telecom
              'CAP.PA': 'Technology', 'DSY.PA': 'Technology', 'STM.PA': 'Technology',
              'ORA.PA': 'Communication',
              // Finance & Insurance
              'BNP.PA': 'Financial', 'ACA.PA': 'Financial', 'GLE.PA': 'Financial',
              // Healthcare & Pharma
              'SAN.PA': 'Healthcare', 'EL.PA': 'Healthcare',
              // Retail & Services
              'CA.PA': 'Consumer Defensive', 'BN.PA': 'Consumer Defensive',
              'DG.PA': 'Consumer Defensive', 'PUB.PA': 'Communication',
              // Materials & Construction
              'AI.PA': 'Materials', 'CS.PA': 'Materials', 'ML.PA': 'Materials',
              'URW.PA': 'Real Estate',
              // Automotive
              'RNO.PA': 'Consumer Cyclical', 'STLA.PA': 'Consumer Cyclical'
            };
            return frenchSectors[symbol] || 'Other';
          }
          
          // ETFs (common patterns)
          if (['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'VEA', 'VWO', 'AGG', 'BND'].includes(symbol)) {
            return 'ETF';
          }
          if (symbol.startsWith('XL') || symbol.startsWith('IY') || symbol.startsWith('VG') || symbol.startsWith('VF') || symbol.startsWith('VH') || symbol.startsWith('VD')) {
            return 'ETF';
          }
          if (['GLD', 'SLV', 'USO', 'UNG', 'DBA', 'DBC', 'PDBC', 'GSG', 'BCI', 'COMT', 'GCC', 'CPER', 'URA', 'PALL'].includes(symbol)) {
            return 'Commodity ETF';
          }
          if (['SOXX', 'SMH', 'ARKK', 'ARKW', 'IGV', 'QTEC', 'HACK', 'FINX', 'CLOU', 'SKYY'].includes(symbol)) {
            return 'Tech ETF';
          }
          
          // Comprehensive stock sector mapping
          const stockSectors: Record<string, string> = {
            // Technology
            'AAPL': 'Technology', 'MSFT': 'Technology', 'NVDA': 'Technology', 'AVGO': 'Technology',
            'ORCL': 'Technology', 'CSCO': 'Technology', 'ADBE': 'Technology', 'CRM': 'Technology',
            'ACN': 'Technology', 'AMD': 'Technology', 'IBM': 'Technology', 'INTC': 'Technology',
            'QCOM': 'Technology', 'TXN': 'Technology', 'AMAT': 'Technology', 'NOW': 'Technology',
            'INTU': 'Technology', 'PANW': 'Technology', 'SNPS': 'Technology', 'CDNS': 'Technology',
            
            // Communication Services
            'GOOGL': 'Communication', 'META': 'Communication', 'NFLX': 'Communication', 'DIS': 'Communication',
            'CMCSA': 'Communication', 'T': 'Communication', 'VZ': 'Communication', 'TMUS': 'Communication',
            'CHTR': 'Communication', 'EA': 'Communication', 'ATVI': 'Communication',
            
            // Consumer Cyclical
            'AMZN': 'Consumer Cyclical', 'TSLA': 'Consumer Cyclical', 'HD': 'Consumer Cyclical', 
            'MCD': 'Consumer Cyclical', 'NKE': 'Consumer Cyclical', 'SBUX': 'Consumer Cyclical',
            'TGT': 'Consumer Cyclical', 'LOW': 'Consumer Cyclical', 'TJX': 'Consumer Cyclical',
            'BKNG': 'Consumer Cyclical', 'GM': 'Consumer Cyclical', 'F': 'Consumer Cyclical',
            
            // Consumer Defensive
            'WMT': 'Consumer Defensive', 'PG': 'Consumer Defensive', 'COST': 'Consumer Defensive',
            'KO': 'Consumer Defensive', 'PEP': 'Consumer Defensive', 'PM': 'Consumer Defensive',
            'MO': 'Consumer Defensive', 'MDLZ': 'Consumer Defensive', 'CL': 'Consumer Defensive',
            'KMB': 'Consumer Defensive', 'GIS': 'Consumer Defensive', 'K': 'Consumer Defensive',
            
            // Healthcare
            'UNH': 'Healthcare', 'JNJ': 'Healthcare', 'LLY': 'Healthcare', 'ABBV': 'Healthcare',
            'MRK': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare', 'DHR': 'Healthcare',
            'PFE': 'Healthcare', 'BMY': 'Healthcare', 'AMGN': 'Healthcare', 'GILD': 'Healthcare',
            'CVS': 'Healthcare', 'CI': 'Healthcare', 'ISRG': 'Healthcare', 'VRTX': 'Healthcare',
            
            // Financial Services
            'BRK-B': 'Financial', 'JPM': 'Financial', 'V': 'Financial', 'MA': 'Financial',
            'BAC': 'Financial', 'WFC': 'Financial', 'MS': 'Financial', 'GS': 'Financial',
            'SPGI': 'Financial', 'BLK': 'Financial', 'C': 'Financial', 'AXP': 'Financial',
            'SCHW': 'Financial', 'CB': 'Financial', 'PGR': 'Financial', 'MMC': 'Financial',
            
            // Industrial
            'CAT': 'Industrial', 'BA': 'Industrial', 'HON': 'Industrial', 'UNP': 'Industrial',
            'RTX': 'Industrial', 'LMT': 'Industrial', 'DE': 'Industrial', 'UPS': 'Industrial',
            'GE': 'Industrial', 'MMM': 'Industrial', 'FDX': 'Industrial', 'NSC': 'Industrial',
            
            // Energy
            'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'SLB': 'Energy',
            'EOG': 'Energy', 'MPC': 'Energy', 'PSX': 'Energy', 'VLO': 'Energy',
            'OXY': 'Energy', 'HAL': 'Energy', 'KMI': 'Energy', 'WMB': 'Energy',
            
            // Materials
            'LIN': 'Materials', 'APD': 'Materials', 'SHW': 'Materials', 'FCX': 'Materials',
            'NEM': 'Materials', 'DOW': 'Materials', 'DD': 'Materials', 'ECL': 'Materials',
            
            // Real Estate
            'AMT': 'Real Estate', 'PLD': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate',
            'PSA': 'Real Estate', 'SPG': 'Real Estate', 'O': 'Real Estate', 'WELL': 'Real Estate',
            
            // Utilities
            'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities', 'D': 'Utilities',
            'AEP': 'Utilities', 'EXC': 'Utilities', 'SRE': 'Utilities', 'XEL': 'Utilities'
          };
          
          return stockSectors[symbol] || 'Other';
        };

        // Generate display names
        const generateName = (symbol: string): string => {
          const names: Record<string, string> = {
            // French CAC 40
            'MC.PA': 'LVMH', 'OR.PA': "L'Oréal", 'RMS.PA': 'Hermès', 'KER.PA': 'Kering',
            'PP.PA': 'Publicis', 'TTE.PA': 'TotalEnergies', 'ENGI.PA': 'Engie', 'EDF.PA': 'EDF',
            'AIR.PA': 'Airbus', 'SAF.PA': 'Safran', 'SGO.PA': 'Saint-Gobain', 'VIE.PA': 'Veolia',
            'BOL.PA': 'Bolloré', 'CAP.PA': 'Capgemini', 'DSY.PA': 'Dassault Systèmes',
            'STM.PA': 'STMicroelectronics', 'ORA.PA': 'Orange', 'BNP.PA': 'BNP Paribas',
            'ACA.PA': 'Crédit Agricole', 'GLE.PA': 'Société Générale', 'SAN.PA': 'Sanofi',
            'EL.PA': 'EssilorLuxottica', 'CA.PA': 'Carrefour', 'BN.PA': 'Danone',
            'DG.PA': 'Vinci', 'PUB.PA': 'Publicis', 'AI.PA': 'Air Liquide',
            'CS.PA': 'AXA', 'ML.PA': 'Michelin', 'URW.PA': 'Unibail-Rodamco',
            'RNO.PA': 'Renault', 'STLA.PA': 'Stellantis',
            
            // Stocks
            'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corp.', 'GOOGL': 'Alphabet Inc.',
            'AMZN': 'Amazon.com Inc.', 'NVDA': 'NVIDIA Corp.', 'TSLA': 'Tesla Inc.',
            'META': 'Meta Platforms', 'BRK-B': 'Berkshire Hathaway', 'JPM': 'JPMorgan Chase',
            'JNJ': 'Johnson & Johnson', 'V': 'Visa Inc.', 'WMT': 'Walmart Inc.',
            'XOM': 'Exxon Mobil', 'UNH': 'UnitedHealth Group', 'PG': 'Procter & Gamble',
            'MA': 'Mastercard Inc.', 'HD': 'Home Depot', 'CVX': 'Chevron Corp.',
            'PFE': 'Pfizer Inc.', 'BAC': 'Bank of America', 'ABBV': 'AbbVie Inc.',
            'CRM': 'Salesforce Inc.', 'COST': 'Costco', 'MRK': 'Merck & Co.',
            'AVGO': 'Broadcom Inc.', 'PEP': 'PepsiCo', 'TMO': 'Thermo Fisher',
            'CSCO': 'Cisco Systems', 'ACN': 'Accenture', 'LLY': 'Eli Lilly',
            'ADBE': 'Adobe Inc.', 'NKE': 'Nike Inc.',
            // Indices
            '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ', '^DJI': 'Dow Jones', '^RUT': 'Russell 2000',
            '^VIX': 'VIX', '^FCHI': 'CAC 40', '^GDAXI': 'DAX', '^FTSE': 'FTSE 100',
            '^N225': 'Nikkei 225', '000001.SS': 'Shanghai Composite', '^STOXX50E': 'Euro Stoxx 50',
            '^AXJO': 'ASX 200', '^BVSP': 'Bovespa', '^MXX': 'IPC Mexico', '^KS11': 'KOSPI',
            // ETFs
            'QQQ': 'Nasdaq 100 ETF', 'SPY': 'S&P 500 ETF', 'XLK': 'Technology ETF',
            'XLF': 'Financial ETF', 'XLV': 'Healthcare ETF', 'XLE': 'Energy ETF',
            'XLY': 'Consumer Disc ETF', 'XLP': 'Consumer Staples ETF', 'XLI': 'Industrial ETF',
            'XLB': 'Materials ETF', 'XLU': 'Utilities ETF', 'XLRE': 'Real Estate ETF',
            'XLC': 'Communication ETF', 'VGT': 'Vanguard Tech ETF', 'GLD': 'Gold ETF',
            'SLV': 'Silver ETF', 'USO': 'Oil ETF', 'UNG': 'Natural Gas ETF',
            // Crypto
            'BTC-USD': 'Bitcoin', 'ETH-USD': 'Ethereum', 'COIN': 'Coinbase',
            'MARA': 'Marathon Digital', 'RIOT': 'Riot Platforms'
          };
          
          return names[symbol] || symbol;
        };

        const heatmapData: HeatmapData[] = allQuotes.map((quote: any) => ({
          symbol: quote.symbol,
          name: generateName(quote.symbol),
          sector: detectSector(quote.symbol),
          marketCap: quote.marketCap || Math.abs(quote.price * 1000000000), // Estimate if not available
          changePercent: quote.changePercent,
          volume: quote.volume || 0
        }));

        setData(heatmapData);
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
        setError('Failed to load heatmap data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [selectedPreset]);

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

  // Render hierarchical treemap (Finviz style)
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Filter data based on selected sector
    const filteredData = selectedFilter === 'all' 
      ? data 
      : data.filter(item => item.sector === selectedFilter);

    if (filteredData.length === 0) return;

    // Group data by sector
    const sectorGroups = new Map<string, HeatmapData[]>();
    filteredData.forEach(item => {
      const sector = item.sector || 'Other';
      if (!sectorGroups.has(sector)) {
        sectorGroups.set(sector, []);
      }
      sectorGroups.get(sector)!.push(item);
    });

    // Create hierarchical structure
    const hierarchyData = {
      name: 'Market',
      children: Array.from(sectorGroups.entries()).map(([sector, stocks]) => ({
        name: sector,
        children: stocks
      }))
    };

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
    const root = d3.hierarchy(hierarchyData)
      .sum(d => (d as any).marketCap || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout with padding for sector groups
    const treemap = d3.treemap()
      .size([width, height])
      .paddingOuter(4)
      .paddingTop(20)
      .paddingInner(2)
      .round(true);

    treemap(root);

    // Color scale for percentage change
    const colorScale = d3.scaleLinear<string>()
      .domain([-5, 0, 5])
      .range(['#dc2626', '#374151', '#16a34a'])
      .clamp(true);

    // Sector colors for borders
    const sectorColors: Record<string, string> = {
      'Technology': '#3b82f6',
      'Finance': '#10b981',
      'Healthcare': '#ef4444',
      'Energy': '#f59e0b',
      'Consumer': '#8b5cf6',
      'Industrial': '#6366f1',
      'Index': '#06b6d4',
      'ETF': '#ec4899',
      'Crypto': '#f97316',
      'Commodity ETF': '#eab308',
      'Tech ETF': '#0ea5e9',
      'Other': '#64748b'
    };

    // Draw sector groups
    const sectors = svg.selectAll('.sector')
      .data((root.children || []) as any as HeatmapNode[])
      .join('g')
      .attr('class', 'sector');

    // Sector background rectangles
    sectors.append('rect')
      .attr('x', (d: HeatmapNode) => d.x0)
      .attr('y', (d: HeatmapNode) => d.y0)
      .attr('width', (d: HeatmapNode) => d.x1 - d.x0)
      .attr('height', (d: HeatmapNode) => d.y1 - d.y0)
      .attr('fill', 'none')
      .attr('stroke', (d: HeatmapNode) => sectorColors[(d.data as any).name] || '#64748b')
      .attr('stroke-width', 3)
      .attr('rx', 6);

    // Sector labels
    sectors.append('text')
      .attr('x', (d: HeatmapNode) => d.x0 + 6)
      .attr('y', (d: HeatmapNode) => d.y0 + 14)
      .attr('fill', (d: HeatmapNode) => sectorColors[(d.data as any).name] || '#64748b')
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text((d: HeatmapNode) => (d.data as any).name);

    // Draw stock cells
    const leaves = root.leaves() as any as HeatmapNode[];
    const cells = svg.selectAll('.cell')
      .data(leaves)
      .join('g')
      .attr('class', 'cell')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Stock rectangles
    cells.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('fill', d => colorScale(d.data.changePercent))
      .attr('stroke', '#060B14')
      .attr('stroke-width', 1)
      .attr('rx', 3)
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

    // Stock labels
    cells.each(function(d) {
      const cell = d3.select(this);
      const cellWidth = d.x1 - d.x0;
      const cellHeight = d.y1 - d.y0;

      // Only show text if cell is large enough
      if (cellWidth > 50 && cellHeight > 35) {
        // Symbol
        cell.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2 - 6)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', Math.min(cellWidth / 5, 14))
          .attr('font-weight', 'bold')
          .style('pointer-events', 'none')
          .text(d.data.symbol);

        // Change percentage
        cell.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2 + 10)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', Math.min(cellWidth / 7, 12))
          .style('pointer-events', 'none')
          .text(`${d.data.changePercent >= 0 ? '+' : ''}${d.data.changePercent.toFixed(2)}%`);
      } else if (cellWidth > 35 && cellHeight > 20) {
        // Only show symbol for smaller cells
        cell.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', Math.min(cellWidth / 4, 11))
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
      {/* Header with controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
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

        {/* Preset selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-400">View:</label>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setSelectedPreset(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedPreset === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#060B14] text-gray-300 hover:bg-gray-800'
              }`}
            >
              {preset.name}
            </button>
          ))}
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
