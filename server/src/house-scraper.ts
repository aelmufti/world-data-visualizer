// Official U.S. House of Representatives Financial Disclosure Scraper
// Source: https://disclosures-clerk.house.gov/
// 100% FREE, OFFICIAL, ALWAYS UP-TO-DATE

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface HouseTrade {
  filingId: string;
  politician: string;
  state: string;
  district: string;
  ticker: string;
  assetName: string;
  assetType: string; // ST (Stock), OP (Option), CS, DO
  action: string; // P (Purchase), S (Sale), E (Exchange)
  partial: boolean;
  transactionDate: string; // YYYY-MM-DD
  notificationDate: string; // YYYY-MM-DD
  amountMin: number;
  amountMax: number;
  owner: string; // SP (Spouse), JT (Joint), DC, D
  notes: string;
}

export class HouseScraper {
  private baseUrl = 'https://disclosures-clerk.house.gov';
  private cacheDir = join(process.cwd(), 'data', 'house-disclosures');
  private cache = new Map<string, { data: HouseTrade[]; timestamp: number }>();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Create cache directory if it doesn't exist
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Search for PTR (Periodic Transaction Report) filings
   */
  async searchFilings(params: {
    lastName?: string;
    state?: string;
    district?: string;
    filingYear?: string;
  }): Promise<Array<{ filingId: string; year: string; pdfPath: string }>> {
    const { lastName = '', state = '', district = '', filingYear = new Date().getFullYear().toString() } = params;

    const formData = `LastName=${encodeURIComponent(lastName)}&State=${encodeURIComponent(state)}&District=${encodeURIComponent(district)}&FilingYear=${filingYear}&submitForm=Submit`;

    const command = `curl -s "${this.baseUrl}/FinancialDisclosure/ViewMemberSearchResult" \\
      -X POST \\
      -H "Content-Type: application/x-www-form-urlencoded" \\
      --data "${formData}"`;

    try {
      const { stdout } = await execAsync(command);
      
      // Extract all href values matching /ptr-pdfs/ (ignore /financial-pdfs/)
      const ptrMatches = stdout.match(/href="([^"]*ptr-pdfs[^"]*)"/g) || [];
      
      const filings = ptrMatches.map(match => {
        // Extract path from: href="public_disc/ptr-pdfs/2024/20024542.pdf"
        const pathMatch = match.match(/href="([^"]*)"/);
        if (!pathMatch) return null;
        
        const pdfPath = pathMatch[1];
        const yearMatch = pdfPath.match(/ptr-pdfs\/(\d{4})\//);
        const idMatch = pdfPath.match(/\/(\d{8})\.pdf/);
        
        if (yearMatch && idMatch) {
          return {
            filingId: idMatch[1],
            year: yearMatch[1],
            pdfPath: pdfPath
          };
        }
        return null;
      }).filter(Boolean) as Array<{ filingId: string; year: string; pdfPath: string }>;
      
      console.log(`📋 Found ${filings.length} PTR filings for ${lastName || 'all members'} (${filingYear})`);
      return filings;
    } catch (error) {
      console.error('Error searching filings:', error);
      return [];
    }
  }

  /**
   * Download and parse a specific PTR filing
   */
  async parseFiling(filingId: string, year: string, pdfPath?: string): Promise<HouseTrade[]> {
    const pdfFile = join(this.cacheDir, `${filingId}.pdf`);
    const txtFile = join(this.cacheDir, `${filingId}.txt`);

    // Check cache
    if (existsSync(txtFile)) {
      console.log(`📄 Using cached filing ${filingId}`);
      const text = readFileSync(txtFile, 'utf-8');
      return this.parseFilingText(text, filingId);
    }

    // Download PDF using the correct year from the URL
    const url = pdfPath 
      ? `${this.baseUrl}/${pdfPath}`
      : `${this.baseUrl}/public_disc/ptr-pdfs/${year}/${filingId}.pdf`;
    
    console.log(`⬇️  Downloading ${url}`);

    try {
      await execAsync(`curl -s "${url}" -o "${pdfFile}"`);
      
      // Convert PDF to text using pdftotext
      await execAsync(`pdftotext "${pdfFile}" "${txtFile}"`);
      
      const text = readFileSync(txtFile, 'utf-8');
      return this.parseFilingText(text, filingId);
    } catch (error) {
      console.error(`Error parsing filing ${filingId}:`, error);
      return [];
    }
  }

  /**
   * Parse the text content of a PTR filing
   */
  private parseFilingText(text: string, filingId: string): HouseTrade[] {
    const trades: HouseTrade[] = [];

    // Extract politician info
    const nameMatch = text.match(/Name:\s*Hon\.\s*([^\n]+)/);
    const stateMatch = text.match(/State\/District:\s*([A-Z]{2})(\d+)/);
    
    const politician = nameMatch ? nameMatch[1].trim() : 'Unknown';
    const state = stateMatch ? stateMatch[1] : '';
    const district = stateMatch ? stateMatch[2] : '';

    // Split into lines for processing
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Look for ticker pattern: (TICKER) [TYPE]
      const tickerMatch = line.match(/\(([A-Z]{1,5})\)\s*\[([A-Z]{2,3})\]/);
      
      if (tickerMatch) {
        const ticker = tickerMatch[1];
        const assetType = tickerMatch[2]; // ST, OP, CS, DO
        
        // Extract asset name (everything before the ticker)
        const assetNameMatch = line.match(/^(.+?)\s*\(/);
        const assetName = assetNameMatch ? assetNameMatch[1].trim() : '';
        
        // Look backwards for owner (SP, JT, DC, D)
        let owner = '';
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          if (lines[j].match(/^(SP|JT|DC|D)$/)) {
            owner = lines[j];
            break;
          }
        }
        
        // Look backwards for action (P, S, E, S (partial))
        let action = '';
        let partial = false;
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          if (lines[j] === 'P') {
            action = 'P';
            break;
          } else if (lines[j] === 'S') {
            action = 'S';
            break;
          } else if (lines[j] === 'E') {
            action = 'E';
            break;
          } else if (lines[j].includes('S (partial)')) {
            action = 'S';
            partial = true;
            break;
          }
        }
        
        // Look forward for dates (MM/DD/YYYY MM/DD/YYYY)
        let transactionDate = '';
        let notificationDate = '';
        for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
          const dateMatch = lines[j].match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})/);
          if (dateMatch) {
            transactionDate = this.formatDate(dateMatch[1]);
            notificationDate = this.formatDate(dateMatch[2]);
            break;
          }
        }
        
        // Look forward for amounts ($X,XXX,XXX - $X,XXX,XXX or $X.XX)
        let amountMin = 0;
        let amountMax = 0;
        for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
          const amountMatch = lines[j].match(/\$([0-9,]+(?:\.\d{2})?)\s*-?\s*\$?([0-9,]+(?:\.\d{2})?)?/);
          if (amountMatch) {
            amountMin = this.parseAmount(amountMatch[1]);
            amountMax = amountMatch[2] ? this.parseAmount(amountMatch[2]) : amountMin;
            break;
          }
        }
        
        // Look forward for notes (lines starting with ": ")
        let notes = '';
        for (let j = i + 1; j < Math.min(lines.length, i + 20); j++) {
          if (lines[j].startsWith(': ')) {
            notes = lines[j].substring(2).trim();
            break;
          } else if (lines[j].startsWith(':')) {
            notes = lines[j].substring(1).trim();
            break;
          }
        }
        
        // Only add if we have minimum required data
        if (ticker && action && transactionDate) {
          trades.push({
            filingId,
            politician,
            state,
            district,
            ticker,
            assetName,
            assetType,
            action,
            partial,
            transactionDate,
            notificationDate,
            amountMin,
            amountMax,
            owner,
            notes,
          });
        }
      }
      
      i++;
    }

    console.log(`✅ Parsed ${trades.length} trades from filing ${filingId}`);
    return trades;
  }

  /**
   * Convert MM/DD/YYYY to YYYY-MM-DD
   */
  private formatDate(date: string): string {
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  /**
   * Parse amount string to integer
   */
  private parseAmount(amount: string): number {
    return parseInt(amount.replace(/[,$]/g, ''));
  }

  /**
   * Get recent trades for a specific politician with caching
   */
  async getPoliticianTrades(lastName: string, year?: string): Promise<HouseTrade[]> {
    const cacheKey = `${lastName}_${year || new Date().getFullYear()}`;
    
    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`💾 Using cached data for ${cacheKey}`);
      return cached.data;
    }

    const filings = await this.searchFilings({ 
      lastName, 
      filingYear: year || new Date().getFullYear().toString() 
    });

    const allTrades: HouseTrade[] = [];
    
    // Parse all filings (not just first 5)
    for (const filing of filings) {
      const trades = await this.parseFiling(filing.filingId, filing.year, filing.pdfPath);
      allTrades.push(...trades);
    }

    // Cache the results
    this.cache.set(cacheKey, { data: allTrades, timestamp: Date.now() });

    return allTrades;
  }

  /**
   * Get all recent trades from all members
   */
  async getAllRecentTrades(year?: string): Promise<HouseTrade[]> {
    const cacheKey = `all_${year || new Date().getFullYear()}`;
    
    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`💾 Using cached data for ${cacheKey}`);
      return cached.data;
    }

    // Get filings from current year
    const filings = await this.searchFilings({ 
      filingYear: year || new Date().getFullYear().toString() 
    });

    const allTrades: HouseTrade[] = [];
    
    // Parse up to 50 most recent filings
    for (const filing of filings.slice(0, 50)) {
      const trades = await this.parseFiling(filing.filingId, filing.year, filing.pdfPath);
      allTrades.push(...trades);
    }

    // Cache the results
    this.cache.set(cacheKey, { data: allTrades, timestamp: Date.now() });

    return allTrades;
  }
}

// Export singleton instance
export const houseScraper = new HouseScraper();
