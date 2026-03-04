import nlp from 'compromise';
import Sentiment from 'sentiment';
import { Company, EventType } from './types.js';

const sentiment = new Sentiment();

const EVENT_KEYWORDS: Record<EventType, string[]> = {
  earnings_beat: ['beat expectations', 'exceeded estimates', 'surpassed forecasts'],
  earnings_miss: ['missed expectations', 'fell short', 'below estimates'],
  merger_acquisition: ['merger', 'acquisition', 'acquires', 'buyout', 'takeover'],
  government_contract: ['government contract', 'federal contract', 'awarded contract'],
  partnership: ['partnership', 'partners with', 'collaboration', 'joint venture'],
  executive_change: ['CEO', 'CFO', 'appoints', 'resigns', 'steps down', 'new chief'],
  layoffs: ['layoffs', 'job cuts', 'workforce reduction', 'downsizing'],
  product_launch: ['launches', 'unveils', 'introduces new', 'releases'],
  regulatory_action: ['FDA', 'SEC', 'regulatory', 'investigation', 'probe'],
  share_buyback: ['buyback', 'share repurchase', 'stock repurchase'],
  dividend_change: ['dividend', 'payout increase', 'dividend cut'],
  analyst_upgrade: ['upgrade', 'raises price target', 'outperform'],
  analyst_downgrade: ['downgrade', 'lowers price target', 'underperform'],
  insider_trading: ['insider', 'executive sold', 'executive bought', 'Form 4'],
  sec_filing: ['8-K', '10-Q', '10-K', 'SEC filing'],
  lawsuit: ['lawsuit', 'litigation', 'sued', 'legal action'],
};

export class NLPProcessor {
  detectCompanies(text: string, companies: Company[]) {
    const doc = nlp(text);
    const orgs = doc.organizations().out('array');
    const detected: Array<{
      companyId: string;
      ticker: string;
      mentionCount: number;
    }> = [];

    for (const org of orgs) {
      for (const company of companies) {
        // Check ticker
        if (org.toUpperCase() === company.ticker) {
          detected.push({
            companyId: company.id,
            ticker: company.ticker,
            mentionCount: this.countOccurrences(text, company.ticker),
          });
          continue;
        }

        // Check official name (fuzzy) - handle both officialName and name fields
        const companyName = (company as any).officialName || (company as any).name;
        if (companyName && this.fuzzyMatch(org, companyName)) {
          detected.push({
            companyId: company.id,
            ticker: company.ticker,
            mentionCount: this.countOccurrences(text, companyName),
          });
          continue;
        }

        // Check aliases if they exist
        const aliases = company.aliases || [];
        for (const alias of aliases) {
          if (alias && this.fuzzyMatch(org, alias)) {
            detected.push({
              companyId: company.id,
              ticker: company.ticker,
              mentionCount: this.countOccurrences(text, alias),
            });
            break;
          }
        }
      }
    }

    return detected;
  }

  analyzeEntitySentiment(text: string, entity: string): number {
    if (!entity || !text) return 0;
    
    const doc = nlp(text);
    const sentences = doc.sentences().out('array') as string[];
    const entitySentences = sentences.filter((s: string) =>
      s.toLowerCase().includes(entity.toLowerCase())
    );

    if (entitySentences.length === 0) return 0;

    const sentiments = entitySentences.map((s: string) => {
      const result = sentiment.analyze(s);
      return result.comparative; // Normalized score
    });

    return sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length;
  }

  classifyEvents(text: string): Array<[EventType, number]> {
    const textLower = text.toLowerCase();
    const detected: Array<[EventType, number]> = [];

    for (const [eventType, keywords] of Object.entries(EVENT_KEYWORDS)) {
      const matches = keywords.filter(kw => textLower.includes(kw)).length;
      if (matches > 0) {
        const confidence = Math.min(matches / keywords.length, 1.0);
        detected.push([eventType as EventType, confidence]);
      }
    }

    return detected;
  }

  process(article: any, companies: Company[]) {
    const text = `${article.title || ''} ${article.body || ''}`;

    // Detect companies
    const detectedCompanies = this.detectCompanies(text, companies);

    // Analyze sentiment for each
    for (const company of detectedCompanies) {
      if (company.ticker) {
        (company as any).entitySentiment = this.analyzeEntitySentiment(text, company.ticker);
      } else {
        (company as any).entitySentiment = 0;
      }
    }

    // Determine primary subject
    if (detectedCompanies.length > 0) {
      const maxMentions = Math.max(...detectedCompanies.map(c => c.mentionCount));
      for (const company of detectedCompanies) {
        (company as any).isPrimarySubject = company.mentionCount === maxMentions;
      }
    }

    // Classify events
    const events = this.classifyEvents(text);

    // Global sentiment
    const rawSentiment = sentiment.analyze(text).comparative;

    return {
      article,
      detectedCompanies,
      events,
      rawSentiment,
    };
  }

  private fuzzyMatch(str1: string, str2: string): boolean {
    if (!str1 || !str2) return false;
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    return s1.includes(s2) || s2.includes(s1) || this.levenshtein(s1, s2) < 3;
  }

  private levenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  private countOccurrences(text: string, search: string): number {
    const regex = new RegExp(search, 'gi');
    return (text.match(regex) || []).length;
  }
}

export const nlpProcessor = new NLPProcessor();
