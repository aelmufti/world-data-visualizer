export interface Company {
  id: string;
  ticker: string;
  officialName: string;
  aliases: string[];
  exchange: 'NYSE' | 'NASDAQ' | 'OTHER';
  sector?: string;
  createdAt: Date;
}

export interface Article {
  id: string;
  url: string;
  title: string;
  body: string;
  publishedAt: Date;
  ingestedAt: Date;
  sourceDomain: string;
  language: string;
  rawSentiment: number;
}

export interface ArticleMention {
  id: string;
  articleId: string;
  companyId: string;
  ticker: string;
  mentionCount: number;
  entitySentiment: number;
  isPrimarySubject: boolean;
  eventTags: string[];
}

export interface Event {
  id: string;
  articleId: string;
  companyId: string;
  ticker: string;
  eventType: EventType;
  confidence: number;
  detectedAt: Date;
}

export type EventType =
  | 'earnings_beat'
  | 'earnings_miss'
  | 'merger_acquisition'
  | 'government_contract'
  | 'partnership'
  | 'executive_change'
  | 'layoffs'
  | 'product_launch'
  | 'regulatory_action'
  | 'share_buyback'
  | 'dividend_change'
  | 'analyst_upgrade'
  | 'analyst_downgrade'
  | 'insider_trading'
  | 'sec_filing'
  | 'lawsuit';

export interface APIKey {
  id: string;
  key: string;
  plan: 'free' | 'pro' | 'enterprise';
  rateLimit: number;
  maxWebsockets: number;
  createdAt: Date;
  isActive: boolean;
}
