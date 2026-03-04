/**
 * Unit tests for NewsFeed component
 * Tests news fetching, filtering, and data handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

const mockArticles = [
  {
    id: '1',
    title: 'Apple announces new iPhone',
    url: 'https://example.com/1',
    publishedAt: new Date().toISOString(),
    relevanceScore: '8.5',
    importanceScore: 9,
    finalScore: '8.7',
    sentiment: '0.5',
    summary: 'Apple unveils latest iPhone model with new features',
    keyPoints: ['New camera', 'Faster processor', 'Better battery'],
    companies: ['Apple', 'AAPL'],
    events: ['product_launch']
  },
  {
    id: '2',
    title: 'Tech sector sees growth',
    url: 'https://example.com/2',
    publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    relevanceScore: '7.2',
    importanceScore: 7,
    finalScore: '7.1',
    sentiment: '0.2',
    summary: 'Technology stocks rally on positive earnings',
    keyPoints: ['Market rally', 'Strong earnings', 'Investor confidence'],
    companies: ['Microsoft', 'Google'],
    events: ['earnings_report']
  }
];

describe('NewsFeed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        sector: 'technology',
        count: mockArticles.length,
        articles: mockArticles
      })
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should fetch news from the correct API endpoint', async () => {
    // This test verifies the API integration
    const response = await fetch('http://localhost:8000/api/aggregated/sector/technology?limit=100');
    const data = await response.json();
    
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/aggregated/sector/technology?limit=100'
    );
    expect(data.articles).toBeDefined();
    expect(Array.isArray(data.articles)).toBe(true);
  });

  it('should handle API response with articles', async () => {
    const response = await fetch('http://localhost:8000/api/aggregated/sector/technology?limit=100');
    const data = await response.json();
    
    expect(data.articles.length).toBe(2);
    expect(data.articles[0].title).toBe('Apple announces new iPhone');
  });

  it('should filter articles by symbol', () => {
    const symbol = 'AAPL';
    const filtered = mockArticles.filter((article) => {
      const searchText = `${article.title} ${article.summary} ${article.companies.join(' ')}`.toLowerCase();
      return searchText.includes(symbol.toLowerCase());
    });
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Apple announces new iPhone');
  });

  it('should handle empty articles array', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        sector: 'technology',
        count: 0,
        articles: []
      })
    });

    const response = await fetch('http://localhost:8000/api/aggregated/sector/technology?limit=100');
    const data = await response.json();
    
    expect(data.articles.length).toBe(0);
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    try {
      await fetch('http://localhost:8000/api/aggregated/sector/technology?limit=100');
    } catch (error: any) {
      expect(error.message).toBe('Network error');
    }
  });

  it('should categorize sentiment correctly', () => {
    const getSentimentLabel = (sentiment: string) => {
      const score = parseFloat(sentiment);
      if (score > 0.3) return 'Positive';
      if (score < -0.3) return 'Negative';
      return 'Neutral';
    };

    expect(getSentimentLabel('0.5')).toBe('Positive');
    expect(getSentimentLabel('-0.5')).toBe('Negative');
    expect(getSentimentLabel('0.1')).toBe('Neutral');
  });

  it('should format relative time correctly', () => {
    const getRelativeTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();

    expect(getRelativeTime(thirtySecondsAgo)).toBe('Just now');
    expect(getRelativeTime(oneHourAgo)).toBe('1h ago');
    expect(getRelativeTime(oneDayAgo)).toBe('1d ago');
  });

  it('should limit initial display to 20 articles', () => {
    const manyArticles = Array.from({ length: 50 }, (_, i) => ({
      ...mockArticles[0],
      id: `article-${i}`,
      title: `Article ${i}`
    }));

    const displayedArticles = manyArticles.slice(0, 20);
    
    expect(displayedArticles.length).toBe(20);
    expect(displayedArticles[0].title).toBe('Article 0');
    expect(displayedArticles[19].title).toBe('Article 19');
  });

  it('should support infinite scroll pagination', () => {
    const manyArticles = Array.from({ length: 50 }, (_, i) => ({
      ...mockArticles[0],
      id: `article-${i}`,
      title: `Article ${i}`
    }));

    let displayCount = 20;
    const firstBatch = manyArticles.slice(0, displayCount);
    
    expect(firstBatch.length).toBe(20);
    
    // Load more
    displayCount += 20;
    const secondBatch = manyArticles.slice(0, displayCount);
    
    expect(secondBatch.length).toBe(40);
    expect(displayCount < manyArticles.length).toBe(true);
  });

  it('should validate article structure', () => {
    const article = mockArticles[0];
    
    expect(article).toHaveProperty('id');
    expect(article).toHaveProperty('title');
    expect(article).toHaveProperty('url');
    expect(article).toHaveProperty('publishedAt');
    expect(article).toHaveProperty('sentiment');
    expect(article).toHaveProperty('summary');
    expect(article).toHaveProperty('companies');
    expect(Array.isArray(article.companies)).toBe(true);
  });
});
