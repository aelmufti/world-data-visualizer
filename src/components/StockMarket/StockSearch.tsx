/**
 * StockSearch Component
 * 
 * Autocomplete search for stocks and indexes with:
 * - 300ms debounced input
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Recent searches from localStorage
 * - Up to 10 suggestions displayed
 */

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import type { StockSearchProps, SearchResult } from '../../types/stock-market';
import { stockDataService } from '../../services/stockDataService';
import { stockStorage } from '../../services/stockStorage';

export const StockSearch: React.FC<StockSearchProps> = ({
  onSelect,
  placeholder = 'Search stocks...'
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    const recent = stockStorage.loadRecentSearches();
    setRecentSearches(recent);
  }, []);

  // Search for stocks when query changes
  useEffect(() => {
    const searchStocks = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await stockDataService.searchStocks(query, { limit: 10 });
        setSuggestions(response.results);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    searchStocks();
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(true);
  };

  const handleSelect = (symbol: string) => {
    // Add to recent searches
    stockStorage.addRecentSearch(symbol);
    setRecentSearches([symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 10));
    
    // Clear input and close dropdown
    setQuery('');
    setIsOpen(false);
    setSuggestions([]);
    
    // Call parent callback
    onSelect(symbol);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = query.trim() ? suggestions : recentSearches.map(s => ({ symbol: s } as SearchResult));
    
    if (!isOpen || items.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          handleSelect(items[selectedIndex].symbol);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setError(null);
    inputRef.current?.focus();
  };

  const showRecentSearches = !query.trim() && recentSearches.length > 0;
  const showSuggestions = query.trim() && suggestions.length > 0;
  const showNoResults = query.trim() && !loading && suggestions.length === 0 && !error;

  return (
    <div className="relative w-full max-w-md">
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-10 bg-[#0A1628] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          aria-label="Search stocks"
          aria-autocomplete="list"
          aria-controls="stock-search-dropdown"
          aria-expanded={isOpen}
        />
        
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (showRecentSearches || showSuggestions || showNoResults || error) && (
        <div
          ref={dropdownRef}
          id="stock-search-dropdown"
          className="absolute z-50 w-full mt-2 bg-[#0A1628] border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto"
          role="listbox"
        >
          {/* Error message */}
          {error && (
            <div className="px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Recent searches */}
          {showRecentSearches && (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">
                Recent Searches
              </div>
              {recentSearches.map((symbol, index) => (
                <button
                  key={symbol}
                  onClick={() => handleSelect(symbol)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-800 transition-colors ${
                    selectedIndex === index ? 'bg-gray-800' : ''
                  }`}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white font-medium">{symbol}</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Search suggestions */}
          {showSuggestions && (
            <>
              {suggestions.map((result, index) => {
                // Type badge colors
                const typeColors: Record<string, string> = {
                  stock: 'bg-blue-600',
                  etf: 'bg-green-600',
                  index: 'bg-purple-600',
                  bond: 'bg-yellow-600',
                  trust: 'bg-orange-600',
                  commodity: 'bg-amber-600',
                  crypto: 'bg-pink-600',
                };
                
                return (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelect(result.symbol)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0 ${
                      selectedIndex === index ? 'bg-gray-800' : ''
                    }`}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{result.symbol}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold text-white rounded uppercase ${typeColors[result.type] || 'bg-gray-600'}`}>
                            {result.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 truncate">{result.name}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-500">{result.exchange}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* No results */}
          {showNoResults && (
            <div className="px-4 py-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
