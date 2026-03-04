import { getDatabase } from './database.js';

// Secteurs d'analyse
export const SECTORS = {
  TECHNOLOGY: 'technology',
  FINANCE: 'finance',
  HEALTHCARE: 'healthcare',
  ENERGY: 'energy',
  CONSUMER: 'consumer',
  INDUSTRIAL: 'industrial',
  MATERIALS: 'materials',
  REAL_ESTATE: 'real_estate',
  UTILITIES: 'utilities',
  TELECOM: 'telecom',
} as const;

// Mots-clés par secteur pour le scoring
const SECTOR_KEYWORDS: Record<string, string[]> = {
  technology: [
    'AI', 'artificial intelligence', 'software', 'cloud', 'semiconductor', 'chip',
    'tech', 'digital', 'cyber', 'data', 'algorithm', 'platform', 'app', 'application',
    'innovation', 'startup', 'SaaS', 'hardware', 'computing', 'quantum',
    'Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'Tesla', 'Nvidia', 'Intel',
    'iPhone', 'iPad', 'Android', 'Windows', 'AWS', 'Azure', 'OpenAI', 'ChatGPT',
    'machine learning', 'neural network', 'automation', 'API', 'developer',
    'coding', 'programming', 'database', 'server', 'processor', 'GPU', 'CPU',
    'internet', 'web', 'online', 'digital transformation', 'IT', 'technology'
  ],
  finance: [
    'bank', 'financial', 'investment', 'trading', 'stock', 'bond', 'credit',
    'loan', 'mortgage', 'insurance', 'fintech', 'payment', 'crypto', 'bitcoin',
    'blockchain', 'fund', 'asset management', 'wealth', 'capital', 'IPO',
    'JPMorgan', 'Goldman', 'Morgan Stanley', 'Citigroup', 'Wells Fargo', 'BofA',
    'Fed', 'Federal Reserve', 'interest rate', 'inflation', 'recession', 'GDP',
    'earnings', 'revenue', 'profit', 'loss', 'dividend', 'share', 'equity',
    'debt', 'treasury', 'yield', 'market', 'Wall Street', 'S&P', 'Dow', 'Nasdaq',
    'investor', 'portfolio', 'hedge fund', 'private equity', 'venture capital',
    'valuation', 'acquisition', 'merger', 'M&A', 'deal', 'transaction'
  ],
  healthcare: [
    'health', 'medical', 'pharma', 'drug', 'biotech', 'hospital', 'clinical',
    'FDA', 'vaccine', 'treatment', 'therapy', 'patient', 'disease', 'diagnostic',
    'healthcare', 'medicine', 'trial', 'approval', 'doctor', 'surgery',
    'Pfizer', 'Moderna', 'Johnson', 'Merck', 'AstraZeneca', 'Novartis', 'Roche',
    'cancer', 'diabetes', 'Alzheimer', 'COVID', 'virus', 'infection', 'pandemic',
    'prescription', 'pharmaceutical', 'biotechnology', 'gene therapy', 'CRISPR',
    'medical device', 'diagnostic', 'imaging', 'lab', 'research', 'study'
  ],
  energy: [
    'oil', 'gas', 'energy', 'renewable', 'solar', 'wind', 'electric', 'battery',
    'power', 'fuel', 'petroleum', 'coal', 'nuclear', 'grid', 'utility',
    'carbon', 'emission', 'clean energy', 'EV', 'electric vehicle',
    'Exxon', 'Chevron', 'BP', 'Shell', 'TotalEnergies', 'ConocoPhillips',
    'crude', 'barrel', 'OPEC', 'drilling', 'refinery', 'pipeline', 'fracking',
    'natural gas', 'LNG', 'hydrogen', 'biofuel', 'ethanol', 'climate',
    'green energy', 'sustainability', 'decarbonization', 'net zero'
  ],
  consumer: [
    'retail', 'consumer', 'brand', 'product', 'sales', 'store', 'e-commerce',
    'shopping', 'customer', 'market share', 'demand', 'supply chain', 'logistics',
    'restaurant', 'food', 'beverage', 'apparel', 'fashion', 'luxury',
    'Amazon', 'Walmart', 'Target', 'Costco', 'Nike', 'Starbucks', 'McDonald',
    'Coca-Cola', 'Pepsi', 'Procter', 'Unilever', 'Nestle', 'LVMH', 'Gucci',
    'online shopping', 'delivery', 'shipping', 'warehouse', 'inventory',
    'price', 'discount', 'promotion', 'Black Friday', 'holiday sales',
    'consumer spending', 'discretionary', 'staples', 'goods', 'merchandise'
  ],
  industrial: [
    'manufacturing', 'industrial', 'factory', 'production', 'machinery',
    'aerospace', 'defense', 'construction', 'infrastructure', 'equipment',
    'automation', 'robotics', 'supply', 'logistics', 'transportation',
    'Boeing', 'Airbus', 'Lockheed', 'Raytheon', 'Caterpillar', 'Deere', 'GE',
    'aircraft', 'plane', 'jet', 'military', 'weapon', 'contract', 'order',
    'freight', 'cargo', 'shipping', 'port', 'rail', 'truck', 'delivery',
    'building', 'bridge', 'road', 'project', 'engineering', 'contractor'
  ],
  materials: [
    'mining', 'metal', 'steel', 'aluminum', 'copper', 'gold', 'silver',
    'commodity', 'chemical', 'material', 'raw material', 'ore', 'mineral',
    'iron', 'zinc', 'nickel', 'lithium', 'cobalt', 'platinum', 'palladium',
    'precious metal', 'base metal', 'rare earth', 'mining company', 'mine',
    'extraction', 'refining', 'smelting', 'alloy', 'industrial metal'
  ],
  real_estate: [
    'real estate', 'property', 'housing', 'commercial real estate', 'REIT',
    'construction', 'development', 'residential', 'office', 'retail space',
    'apartment', 'home', 'house', 'building', 'mortgage', 'rent', 'lease',
    'landlord', 'tenant', 'vacancy', 'occupancy', 'square foot', 'price per',
    'developer', 'builder', 'zoning', 'permit', 'land', 'site'
  ],
  utilities: [
    'utility', 'water', 'electricity', 'gas utility', 'infrastructure',
    'public service', 'grid', 'transmission', 'distribution',
    'power plant', 'generation', 'renewable energy', 'solar farm', 'wind farm',
    'electric utility', 'water utility', 'sewage', 'waste', 'recycling'
  ],
  telecom: [
    'telecom', 'wireless', '5G', 'network', 'broadband', 'mobile',
    'communication', 'spectrum', 'carrier', 'connectivity',
    'Verizon', 'AT&T', 'T-Mobile', 'Sprint', 'Comcast', 'Charter',
    'phone', 'smartphone', 'cellular', 'fiber', 'cable', 'satellite',
    'internet service', 'ISP', 'bandwidth', 'data plan', 'roaming'
  ]
};

// Importance des événements
const EVENT_IMPORTANCE: Record<string, number> = {
  earnings_beat: 8,
  earnings_miss: 8,
  merger_acquisition: 10,
  government_contract: 7,
  partnership: 6,
  executive_change: 5,
  layoffs: 7,
  product_launch: 6,
  regulatory_action: 9,
  share_buyback: 5,
  dividend_change: 4,
  analyst_upgrade: 6,
  analyst_downgrade: 6,
  insider_trading: 4,
  sec_filing: 3,
  lawsuit: 7,
};

export interface ScoredArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: Date;
  sector: string;
  relevanceScore: number;
  importanceScore: number;
  finalScore: number;
  sentiment: number;
  summary: string;
  keyPoints: string[];
  companies: string[];
  events: string[];
}

export class NewsAggregator {
  scoreSectorRelevance(title: string, body: string, sector: string): number {
    const keywords = SECTOR_KEYWORDS[sector] || [];
    
    let titleMatches = 0;
    let leadMatches = 0;
    let bodyMatches = 0;
    
    const words = body.split(/\s+/);
    const lead = words.slice(0, 150).join(' ');
    const rest = words.slice(150).join(' ');
    
    const titleLower = title.toLowerCase();
    const leadLower = lead.toLowerCase();
    const restLower = rest.toLowerCase();
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      if (regex.test(titleLower)) titleMatches++;
      if (regex.test(leadLower)) leadMatches++;
      if (regex.test(restLower)) bodyMatches++;
    }
    
    const weightedMatches = (titleMatches * 2.0) + (leadMatches * 1.5) + (bodyMatches * 1.0);
    const score = 10 * (1 - Math.exp(-weightedMatches * 0.4));
    
    return score;
  }

  calculateImportanceScore(events: string[]): number {
    if (events.length === 0) return 3;
    const scores = events.map(event => EVENT_IMPORTANCE[event] || 3);
    return Math.max(...scores);
  }

  generateSummary(title: string, body: string): string {
    const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 2).join('. ').trim();
    return summary.substring(0, 200) + (summary.length > 200 ? '...' : '');
  }

  extractKeyPoints(text: string): string[] {
    const points: string[] = [];
    
    const numberPatterns = [
      /\$[\d,]+\.?\d*\s*(billion|million|trillion)/gi,
      /[\d,]+\.?\d*%/g,
      /revenue.*\$[\d,]+/gi,
      /profit.*\$[\d,]+/gi,
    ];
    
    for (const pattern of numberPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        points.push(...matches.slice(0, 2));
      }
    }
    
    const importantKeywords = ['announced', 'launched', 'acquired', 'reported', 'increased', 'decreased'];
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (importantKeywords.some(kw => sentence.toLowerCase().includes(kw))) {
        points.push(sentence.trim());
        if (points.length >= 5) break;
      }
    }
    
    return points.slice(0, 5);
  }

  async aggregateForSector(sector: string, limit: number = 20): Promise<ScoredArticle[]> {
    const db = getDatabase();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const articles = await db.all(`
      SELECT * FROM articles 
      WHERE published_at >= ? 
      ORDER BY published_at DESC 
      LIMIT 200
    `, since.toISOString());

    const scoredArticles: ScoredArticle[] = [];

    for (const article of articles) {
      const relevanceScore = this.scoreSectorRelevance(article.title, article.body || '', sector);
      
      if (relevanceScore < 1.0) continue;
      
      const mentions = await db.all(`
        SELECT * FROM article_mentions WHERE article_id = ?
      `, article.id);
      
      const companies = mentions.map(m => m.ticker);
      const eventTags = mentions.flatMap(m => m.event_tags || []);
      
      const importanceScore = this.calculateImportanceScore(eventTags);
      const sentimentScore = ((article.raw_sentiment + 1) / 2) * 10;
      
      let baseScore = (relevanceScore * 0.6) + (importanceScore * 0.3) + (sentimentScore * 0.1);
      
      const ageInHours = (Date.now() - new Date(article.published_at).getTime()) / 3600000;
      const decayFactor = Math.exp(-0.15 * ageInHours);
      const finalScore = baseScore * decayFactor;
      
      scoredArticles.push({
        id: article.id,
        title: article.title,
        url: article.url,
        publishedAt: new Date(article.published_at),
        sector,
        relevanceScore,
        importanceScore,
        finalScore,
        sentiment: article.raw_sentiment,
        summary: this.generateSummary(article.title, article.body || ''),
        keyPoints: this.extractKeyPoints(`${article.title} ${article.body || ''}`),
        companies,
        events: eventTags,
      });
    }

    scoredArticles.sort((a, b) => b.finalScore - a.finalScore);
    return scoredArticles.slice(0, limit);
  }

  async aggregateAllSectors(topPerSector: number = 10): Promise<Record<string, ScoredArticle[]>> {
    const result: Record<string, ScoredArticle[]> = {};
    
    for (const [key, sector] of Object.entries(SECTORS)) {
      console.log(`📊 Aggregating for sector: ${sector}`);
      result[sector] = await this.aggregateForSector(sector, topPerSector);
    }
    
    return result;
  }

  async getTopArticles(limit: number = 50): Promise<ScoredArticle[]> {
    const allSectors = await this.aggregateAllSectors(20);
    const allArticles = Object.values(allSectors).flat();
    const uniqueArticles = Array.from(
      new Map(allArticles.map(a => [a.id, a])).values()
    );
    
    uniqueArticles.sort((a, b) => b.finalScore - a.finalScore);
    return uniqueArticles.slice(0, limit);
  }
}

export const newsAggregator = new NewsAggregator();
