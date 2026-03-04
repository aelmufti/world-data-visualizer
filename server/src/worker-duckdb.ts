import axios from 'axios';
import { initDatabase, getDatabase, collections } from './database.js';
import { nlpProcessor } from './nlp.js';
import { Company } from './types.js';
import { randomUUID } from 'crypto';

class IngestionWorker {
  private lastIngestedAt: Date;
  private db: any;

  constructor() {
    this.lastIngestedAt = new Date(Date.now() - 60 * 60 * 1000);
  }

  async init() {
    await initDatabase();
    this.db = getDatabase();
  }

  async fetchNewArticles() {
    try {
      const response = await axios.get(process.env.NEWS_SOURCE_API_URL!, {
        params: { since: this.lastIngestedAt.toISOString() },
        headers: { Authorization: `Bearer ${process.env.NEWS_SOURCE_API_KEY}` },
        timeout: 30000,
      });
      return response.data.articles || [];
    } catch (error: any) {
      console.error('Error fetching articles:', error.message);
      return [];
    }
  }

  async alreadyInDb(url: string): Promise<boolean> {
    const result = await this.db.all(`
      SELECT id FROM ${collections.articles} WHERE url = ? LIMIT 1
    `, url);
    return result.length > 0;
  }

  async getCompanies(): Promise<Company[]> {
    const companies = await this.db.all(`SELECT * FROM ${collections.companies}`);
    return companies as Company[];
  }

  async processArticle(articleData: any) {
    try {
      if (await this.alreadyInDb(articleData.url)) {
        console.log(`Article already in DB: ${articleData.url}`);
        return;
      }

      const companies = await this.getCompanies();
      const result = nlpProcessor.process(articleData, companies);

      if (result.detectedCompanies.length === 0) {
        console.log(`No companies detected: ${articleData.url}`);
        return;
      }

      const articleId = randomUUID();
      
      await this.db.run(`
        INSERT INTO ${collections.articles} 
        (id, url, title, body, published_at, ingested_at, source_domain, raw_sentiment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, articleId, articleData.url, articleData.title, articleData.body,
         new Date(articleData.publishedAt).toISOString(), new Date().toISOString(),
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

      const latency = (Date.now() - new Date(articleData.publishedAt).getTime()) / 1000;
      console.log(`✅ Processed article ${articleId} with latency ${latency.toFixed(2)}s`);
    } catch (error: any) {
      console.error('Error processing article:', error.message);
    }
  }

  async run() {
    await this.init();
    console.log('🚀 Starting ingestion worker...');

    while (true) {
      try {
        const articles = await this.fetchNewArticles();
        console.log(`📰 Fetched ${articles.length} new articles`);

        for (const article of articles) {
          await this.processArticle(article);
        }

        if (articles.length > 0) {
          this.lastIngestedAt = new Date();
        }
      } catch (error: any) {
        console.error('Error in worker loop:', error.message);
      }

      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
}

const worker = new IngestionWorker();
worker.run();
