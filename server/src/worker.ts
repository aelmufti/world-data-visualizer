import axios from 'axios';
import { db, collections } from './firebase.js';
import { nlpProcessor } from './nlp.js';
import { Company } from './types.js';

class IngestionWorker {
  private lastIngestedAt: Date;

  constructor() {
    this.lastIngestedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
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
    const snapshot = await db.collection(collections.articles)
      .where('url', '==', url)
      .limit(1)
      .get();
    return !snapshot.empty;
  }

  async getCompanies(): Promise<Company[]> {
    const snapshot = await db.collection(collections.companies).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];
  }

  async processArticle(articleData: any) {
    try {
      // Check if already processed
      if (await this.alreadyInDb(articleData.url)) {
        console.log(`Article already in DB: ${articleData.url}`);
        return;
      }

      // Get companies
      const companies = await this.getCompanies();

      // Process through NLP
      const result = nlpProcessor.process(articleData, companies);

      if (result.detectedCompanies.length === 0) {
        console.log(`No companies detected: ${articleData.url}`);
        return;
      }

      // Save article
      const articleRef = await db.collection(collections.articles).add({
        url: articleData.url,
        title: articleData.title,
        body: articleData.body,
        publishedAt: new Date(articleData.publishedAt),
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

      const latency = (Date.now() - new Date(articleData.publishedAt).getTime()) / 1000;
      console.log(`✅ Processed article ${articleRef.id} with latency ${latency.toFixed(2)}s`);
    } catch (error: any) {
      console.error('Error processing article:', error.message);
    }
  }

  async run() {
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

      // Wait 15 seconds
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
}

const worker = new IngestionWorker();
worker.run();
