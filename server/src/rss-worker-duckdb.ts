import axios from 'axios';
import { initDatabase, getDatabase, collections } from './database.js';
import { nlpProcessor } from './nlp.js';
import { Company } from './types.js';
import { parseStringPromise } from 'xml2js';
import { randomUUID } from 'crypto';

const RSS_SOURCES = [
  { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', domain: 'reuters.com' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', domain: 'finance.yahoo.com' },
  { name: 'MarketWatch', url: 'https://www.marketwatch.com/rss/topstories', domain: 'marketwatch.com' },
  { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', domain: 'seekingalpha.com' },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', domain: 'cnbc.com' },
  { name: 'Bloomberg', url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml', domain: 'bloomberg.com' },
  { name: 'Financial Times', url: 'https://www.ft.com/?format=rss', domain: 'ft.com' },
  { name: 'The Wall Street Journal', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', domain: 'wsj.com' },
  { name: 'Barrons', url: 'https://feeds.a.dj.com/rss/RSSBarronsOnline.xml', domain: 'barrons.com' },
  { name: 'Investor\'s Business Daily', url: 'https://www.investors.com/feed/', domain: 'investors.com' },
  { name: 'Forbes Markets', url: 'https://www.forbes.com/markets/feed/', domain: 'forbes.com' },
  { name: 'Business Insider', url: 'https://markets.businessinsider.com/rss/news', domain: 'businessinsider.com' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', domain: 'techcrunch.com' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', domain: 'theverge.com' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', domain: 'arstechnica.com' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', domain: 'venturebeat.com' },
  { name: 'BioPharma Dive', url: 'https://www.biopharmadive.com/feeds/news/', domain: 'biopharmadive.com' },
  { name: 'FiercePharma', url: 'https://www.fiercepharma.com/rss/xml', domain: 'fiercepharma.com' },
  { name: 'Oil Price', url: 'https://oilprice.com/rss/main', domain: 'oilprice.com' },
  { name: 'Renewable Energy World', url: 'https://www.renewableenergyworld.com/feed/', domain: 'renewableenergyworld.com' }
];

class RSSWorker {
  private lastIngestedAt: Date;
  private db: any;

  constructor() {
    this.lastIngestedAt = new Date(Date.now() - 60 * 60 * 1000);
  }

  async init() {
    await initDatabase();
    this.db = getDatabase();
  }

  async fetchRSSFeed(source: typeof RSS_SOURCES[0]) {
    try {
      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FinancialNewsBot/1.0)' }
      });

      const parsed = await parseStringPromise(response.data);
      const items = parsed.rss?.channel?.[0]?.item || parsed.feed?.entry || [];

      const articles = items.map((item: any) => {
        const title = item.title?.[0]?._ || item.title?.[0] || '';
        const description = item.description?.[0] || item.summary?.[0] || '';
        const link = item.link?.[0]?._ || item.link?.[0] || item.id?.[0] || '';
        const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();

        return {
          title: typeof title === 'string' ? title : title._ || '',
          body: typeof description === 'string' ? description : description._ || '',
          url: typeof link === 'string' ? link : link.href || '',
          publishedAt: new Date(pubDate),
          sourceDomain: source.domain,
          language: 'en'
        };
      });

      console.log(`📰 Fetched ${articles.length} articles from ${source.name}`);
      return articles;
    } catch (error: any) {
      console.error(`❌ Error fetching ${source.name}:`, error.message);
      return [];
    }
  }

  async fetchAllFeeds() {
    const allArticles = [];
    
    for (const source of RSS_SOURCES) {
      const articles = await this.fetchRSSFeed(source);
      allArticles.push(...articles);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return allArticles;
  }

  async alreadyInDb(url: string): Promise<boolean> {
    const result = await this.db.all(`
      SELECT id FROM ${collections.articles} WHERE url = ? LIMIT 1
    `, url);
    return result.length > 0;
  }

  async getCompanies(): Promise<Company[]> {
    const companies = await this.db.all(`SELECT * FROM ${collections.companies} LIMIT 100`);
    return companies as Company[];
  }

  async processArticle(articleData: any) {
    try {
      if (!articleData.url || !articleData.title) return;
      if (await this.alreadyInDb(articleData.url)) return;

      const companies = await this.getCompanies();
      const result = nlpProcessor.process(articleData, companies);

      const articleId = randomUUID();
      
      await this.db.run(`
        INSERT INTO ${collections.articles}
        (id, url, title, body, published_at, ingested_at, source_domain, raw_sentiment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, articleId, articleData.url, articleData.title, articleData.body,
         articleData.publishedAt.toISOString(), new Date().toISOString(),
         articleData.sourceDomain, result.rawSentiment);

      for (const company of result.detectedCompanies) {
        const mentionId = randomUUID();
        await this.db.run(`
          INSERT INTO ${collections.mentions}
          (id, article_id, company_id, ticker, mention_count, entity_sentiment, is_primary_subject, event_tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, mentionId, articleId, (company as any).companyId, company.ticker,
           company.mentionCount, (company as any).entitySentiment,
           (company as any).isPrimarySubject, result.events.map(e => e[0]));
      }

      for (const [eventType, confidence] of result.events) {
        for (const company of result.detectedCompanies) {
          if ((company as any).isPrimarySubject) {
            const eventId = randomUUID();
            await this.db.run(`
              INSERT INTO ${collections.events}
              (id, article_id, company_id, ticker, event_type, confidence, detected_at, article_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, eventId, articleId, (company as any).companyId, company.ticker,
               eventType, confidence, new Date().toISOString(), articleData.url);
          }
        }
      }

      const latency = (Date.now() - articleData.publishedAt.getTime()) / 1000;
      const companiesStr = result.detectedCompanies.length > 0 
        ? result.detectedCompanies.map(c => c.ticker).join(', ')
        : 'no companies';
      console.log(`✅ ${articleData.title.substring(0, 60)}... [${companiesStr}] - ${latency.toFixed(0)}s`);
    } catch (error: any) {
      console.error('Error processing article:', error.message);
    }
  }

  async run() {
    await this.init();
    console.log('🚀 Starting RSS ingestion worker...');
    console.log(`📡 Monitoring ${RSS_SOURCES.length} RSS feeds`);

    while (true) {
      try {
        const articles = await this.fetchAllFeeds();
        console.log(`📊 Total articles fetched: ${articles.length}`);

        for (const article of articles) {
          await this.processArticle(article);
        }

        this.lastIngestedAt = new Date();
      } catch (error: any) {
        console.error('Error in worker loop:', error.message);
      }

      console.log('⏳ Waiting 1 minute before next poll...');
      await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000));
    }
  }
}

const worker = new RSSWorker();
worker.run();
