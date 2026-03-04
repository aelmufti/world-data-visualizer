import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { getDatabase, collections } from './database.js';
import { newsAggregator, ScoredArticle, SECTORS } from './aggregator-duckdb.js';

interface TopNewsState {
  [sector: string]: {
    articles: ScoredArticle[];
    lastUpdate: Date;
  };
}

interface ClientSubscription {
  ws: WebSocket;
  sector: string;
}

export class NewsWebSocketServer {
  private wss: WebSocketServer;
  private clientSubscriptions: Map<WebSocket, string> = new Map();
  private topNewsState: TopNewsState = {};
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer, path: string = '/news-updates') {
    // Initialize state for all sectors
    Object.values(SECTORS).forEach(sector => {
      this.topNewsState[sector] = {
        articles: [],
        lastUpdate: new Date()
      };
    });

    this.wss = new WebSocketServer({ 
      server, 
      path,
      verifyClient: (info) => {
        // Add CORS and origin verification if needed
        return true;
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('📰 News client connected');

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error parsing client message:', error);
        }
      });

      ws.on('close', () => {
        console.log('📰 News client disconnected');
        this.clientSubscriptions.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('News WebSocket error:', error);
        this.clientSubscriptions.delete(ws);
      });
    });

    // Start periodic updates
    this.startPeriodicUpdates();
  }

  private handleClientMessage(ws: WebSocket, data: any) {
    if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    } else if (data.type === 'subscribe') {
      const sector = data.sector || 'technology';
      this.clientSubscriptions.set(ws, sector);
      console.log(`📰 Client subscribed to sector: ${sector}`);
      // Send current top news for this sector immediately
      this.sendTopNewsForSector(ws, sector);
    } else if (data.type === 'unsubscribe') {
      this.clientSubscriptions.delete(ws);
    }
  }

  private async sendTopNewsForSector(ws: WebSocket, sector: string) {
    try {
      const sectorState = this.topNewsState[sector];
      if (!sectorState) return;

      const message = JSON.stringify({
        type: 'top_news',
        data: {
          sector,
          articles: sectorState.articles.map(a => ({
            id: a.id,
            title: a.title,
            url: a.url,
            publishedAt: a.publishedAt.toISOString(),
            sector: a.sector,
            relevanceScore: parseFloat(a.relevanceScore.toFixed(2)),
            importanceScore: a.importanceScore,
            finalScore: parseFloat(a.finalScore.toFixed(2)),
            sentiment: parseFloat(a.sentiment.toFixed(2)),
            summary: a.summary,
            keyPoints: a.keyPoints,
            companies: a.companies,
            events: a.events,
          })),
          lastUpdate: sectorState.lastUpdate.toISOString()
        }
      });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    } catch (error) {
      console.error('Error sending top news:', error);
    }
  }

  private broadcastToSector(sector: string, message: string) {
    this.clientSubscriptions.forEach((clientSector, client) => {
      if (clientSector === sector && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private async updateTopNews() {
    try {
      // Update top news for each sector
      for (const sector of Object.values(SECTORS)) {
        await this.updateTopNewsForSector(sector);
      }
    } catch (error) {
      console.error('Error updating top news:', error);
    }
  }

  private async updateTopNewsForSector(sector: string) {
    try {
      // Use the aggregator to get top articles for this sector
      const topArticles = await newsAggregator.aggregateForSector(sector, 5);

      if (topArticles.length === 0) {
        return;
      }

      // Check for breaking news (new article in top 5)
      const oldState = this.topNewsState[sector];
      const breakingNews = oldState ? this.detectBreakingNews(topArticles, oldState.articles) : [];
      
      // Update state
      this.topNewsState[sector] = {
        articles: topArticles,
        lastUpdate: new Date()
      };

      // Broadcast update to clients subscribed to this sector
      this.broadcastToSector(sector, JSON.stringify({
        type: 'top_news',
        data: {
          sector,
          articles: topArticles.map(a => ({
            id: a.id,
            title: a.title,
            url: a.url,
            publishedAt: a.publishedAt.toISOString(),
            sector: a.sector,
            relevanceScore: parseFloat(a.relevanceScore.toFixed(2)),
            importanceScore: a.importanceScore,
            finalScore: parseFloat(a.finalScore.toFixed(2)),
            sentiment: parseFloat(a.sentiment.toFixed(2)),
            summary: a.summary,
            keyPoints: a.keyPoints,
            companies: a.companies,
            events: a.events,
          })),
          lastUpdate: this.topNewsState[sector].lastUpdate.toISOString()
        }
      }));

      // Send breaking news notification if any
      if (breakingNews.length > 0) {
        this.broadcastToSector(sector, JSON.stringify({
          type: 'breaking_news',
          data: {
            sector,
            articles: breakingNews.map(a => ({
              id: a.id,
              title: a.title,
              url: a.url,
              publishedAt: a.publishedAt.toISOString(),
              finalScore: parseFloat(a.finalScore.toFixed(2)),
              companies: a.companies,
              events: a.events,
            })),
            timestamp: new Date().toISOString()
          }
        }));
        console.log(`📰 Breaking news in ${sector}: ${breakingNews.length} articles`);
      }
    } catch (error) {
      console.error(`Error updating top news for sector ${sector}:`, error);
    }
  }

  private detectBreakingNews(newTopArticles: ScoredArticle[], oldTopArticles: ScoredArticle[]): ScoredArticle[] {
    const oldIds = new Set(oldTopArticles.map(a => a.id));
    return newTopArticles.filter(article => !oldIds.has(article.id));
  }

  private calculateImportanceScore(events: string[]): number {
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

    if (events.length === 0) return 3;
    const scores = events.map(event => EVENT_IMPORTANCE[event] || 3);
    return Math.max(...scores);
  }

  private startPeriodicUpdates() {
    // Update every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateTopNews();
    }, 30 * 1000);

    // Initial update
    this.updateTopNews();
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.wss.close();
  }
}
