import axios from 'axios';
import { db, collections } from './firebase.js';
import { nlpProcessor } from './nlp.js';
import { Company } from './types.js';
import { parseStringPromise } from 'xml2js';

// Sources RSS gratuites pour les news financières
const RSS_SOURCES = [
  {
    name: 'Reuters Business',
    url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
    domain: 'reuters.com'
  },
  {
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com/news/rssindex',
    domain: 'finance.yahoo.com'
  },
  {
    name: 'MarketWatch',
    url: 'https://www.marketwatch.com/rss/topstories',
    domain: 'marketwatch.com'
  },
  {
    name: 'Seeking Alpha',
    url: 'https://seekingalpha.com/feed.xml',
    domain: 'seekingalpha.com'
  },
  {
    name: 'CNBC',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    domain: 'cnbc.com'
  },
  {
    name: 'Bloomberg',
    url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml',
    domain: 'bloomberg.com'
  }
];

class RSSWorker {
  private lastIngestedAt: Date;

  constructor() {
    this.lastIngestedAt = new Date(Date.now() - 60 * 60 * 1000);
  }

  async fetchRSSFeed(source: typeof RSS_SOURCES[0]) {
    try {
      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinancialNewsBot/1.0)'
        }
      });

      const parsed = await parseStringPromise(response.data);
      const items = parsed.rss?.channel?.[0]?.item || parsed.feed?.entry || [];

      const articles = items.map((item: any) => {
        // Handle both RSS and Atom formats
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
      
      // Wait a bit between requests to be polite
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return allArticles;
  }

  async alreadyInDb(url: string): Promise<boolean> {
    const snapshot = await db.collection(collections.articles)
      .where('url', '==', url)
      .limit(1)
      .get();
    return !snapshot.empty;
  }

  async getCompanies(): Promise<Company[]> {
    const snapshot = await db.collection(collections.companies).limit(100).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];
  }

  async processArticle(articleData: any) {
    try {
      if (!articleData.url || !articleData.title) {
        return;
      }

      if (await this.alreadyInDb(articleData.url)) {
        return;
      }

      const companies = await this.getCompanies();
      const result = nlpProcessor.process(articleData, companies);

      if (result.detectedCompanies.length === 0) {
        console.log(`⏭️  No companies detected: ${articleData.title.substring(0, 50)}...`);
        return;
      }

      // Save article
      const articleRef = await db.collection(collections.articles).add({
        url: articleData.url,
        title: articleData.title,
        body: articleData.body,
        publishedAt: articleData.publishedAt,
        ingestedAt: new Date(),
        sourceDomain: articleData.sourceDomain,
        language: articleData.language || 'en',
        rawSentiment: result.rawSentiment,
      });

      // Save mentions
      for (const company of result.detectedCompanies) {
        await db.collection(collections.mentions).add({
          articleId: articleRef.id,
          companyId: (company as any).companyId,
          ticker: company.ticker,
          mentionCount: company.mentionCount,
          entitySentiment: (company as any).entitySentiment,
          isPrimarySubject: (company as any).isPrimarySubject,
          eventTags: result.events.map(e => e[0]),
        });
      }

      // Save events
      for (const [eventType, confidence] of result.events) {
        for (const company of result.detectedCompanies) {
          if ((company as any).isPrimarySubject) {
            await db.collection(collections.events).add({
              articleId: articleRef.id,
              companyId: (company as any).companyId,
              ticker: company.ticker,
              eventType,
              confidence,
              detectedAt: new Date(),
              articleUrl: articleData.url,
            });
          }
        }
      }

      const latency = (Date.now() - articleData.publishedAt.getTime()) / 1000;
      console.log(`✅ Processed: ${articleData.title.substring(0, 50)}... (${result.detectedCompanies.map(c => c.ticker).join(', ')}) - ${latency.toFixed(0)}s latency`);
    } catch (error: any) {
      console.error('Error processing article:', error.message);
    }
  }

  async run() {
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

      // Wait 5 minutes before next poll
      console.log('⏳ Waiting 5 minutes before next poll...');
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
  }
}

const worker = new RSSWorker();
worker.run();
