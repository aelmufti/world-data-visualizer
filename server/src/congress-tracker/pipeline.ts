// Main data pipeline for fetching, parsing, and storing Congress trades
import { EventEmitter } from 'events';
import { congressDb, Trade } from './database.js';
import { pdfParser } from './pdf-parser.js';
import { houseScraper, senateScraper } from './scrapers.js';
import { TRACKED_POLITICIANS, Politician } from './politicians.js';

export interface PipelineResult {
  success: boolean;
  filings: number;
  trades: number;
  alerts: number;
  warnings: string[];
}

export class CongressPipeline extends EventEmitter {
  private isRunning = false;
  private lastPollTime: Date | null = null;

  async initialize(): Promise<void> {
    await congressDb.initTables();
    console.log('✅ Congress tracker pipeline initialized');
  }

  async runPoll(): Promise<PipelineResult> {
    if (this.isRunning) {
      console.log('⏭️  Poll already running, skipping');
      return {
        success: false,
        filings: 0,
        trades: 0,
        alerts: 0,
        warnings: ['Poll already in progress']
      };
    }

    this.isRunning = true;
    const warnings: string[] = [];
    let totalFilings = 0;
    let totalTrades = 0;
    let totalAlerts = 0;

    try {
      console.log('🔄 Starting Congress trade poll...');

      // Check if pdftotext is available
      const hasPdfToText = await pdfParser.checkPdfToText();
      if (!hasPdfToText) {
        warnings.push('pdftotext not found. Install with: brew install poppler');
        return {
          success: false,
          filings: 0,
          trades: 0,
          alerts: 0,
          warnings
        };
      }

      // Scan all politicians in parallel
      const years = [2025, 2026];
      const tasks: Promise<void>[] = [];

      for (const politician of TRACKED_POLITICIANS) {
        for (const year of years) {
          tasks.push(
            this.processPolitician(politician, year)
              .then(result => {
                totalFilings += result.filings;
                totalTrades += result.trades;
                totalAlerts += result.alerts;
                if (result.warning) {
                  warnings.push(result.warning);
                }
              })
              .catch(error => {
                const msg = `${politician.lastName} ${year} failed: ${error.message}`;
                console.error(`❌ ${msg}`);
                warnings.push(msg);
              })
          );
        }
      }

      // Wait for all with timeout protection
      await Promise.allSettled(tasks);

      this.lastPollTime = new Date();
      
      console.log(`✅ Poll complete: ${totalFilings} filings, ${totalTrades} trades, ${totalAlerts} alerts`);

      return {
        success: true,
        filings: totalFilings,
        trades: totalTrades,
        alerts: totalAlerts,
        warnings
      };
    } finally {
      this.isRunning = false;
    }
  }

  private async processPolitician(
    politician: Politician,
    year: number
  ): Promise<{ filings: number; trades: number; alerts: number; warning?: string }> {
    try {
      // Search for filings
      const scraper = politician.chamber === 'house' ? houseScraper : senateScraper;
      const filings = await scraper.searchFilings(politician, year);

      let newFilings = 0;
      let newTrades = 0;
      let newAlerts = 0;

      // Process up to 5 filings concurrently
      const batchSize = 5;
      for (let i = 0; i < filings.length; i += batchSize) {
        const batch = filings.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(filing => this.processFiling(filing.filing_id, filing.pdf_url, politician, year))
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            newFilings += result.value.isNew ? 1 : 0;
            newTrades += result.value.trades;
            newAlerts += result.value.alerts;
          }
        }
      }

      if (newFilings > 0) {
        console.log(`✅ ${politician.lastName} ${year}: ${newFilings} new filings, ${newTrades} trades`);
      }

      return { filings: newFilings, trades: newTrades, alerts: newAlerts };
    } catch (error: any) {
      return {
        filings: 0,
        trades: 0,
        alerts: 0,
        warning: `${politician.lastName} ${year}: ${error.message}`
      };
    }
  }

  private async processFiling(
    filingId: string,
    pdfUrl: string,
    politician: Politician,
    year: number
  ): Promise<{ isNew: boolean; trades: number; alerts: number }> {
    // Check if already processed
    const exists = await congressDb.filingExists(filingId);
    if (exists) {
      return { isNew: false, trades: 0, alerts: 0 };
    }

    try {
      // Download PDF
      const pdfBuffer = await pdfParser.downloadPdf(pdfUrl);

      // Convert to text
      const text = await pdfParser.pdfToText(pdfBuffer);

      // Parse trades
      const parsedTrades = pdfParser.parseTrades(text);

      // Insert filing
      await congressDb.insertFiling({
        filing_id: filingId,
        politician: politician.lastName,
        full_name: politician.fullName,
        party: politician.party,
        state: politician.state,
        chamber: politician.chamber,
        pdf_url: pdfUrl,
        fetched_at: new Date().toISOString(),
        year
      });

      // Insert trades and create alerts
      let tradeCount = 0;
      let alertCount = 0;

      for (const parsedTrade of parsedTrades) {
        const tradeId = `${filingId}-${parsedTrade.ticker}-${parsedTrade.transaction_date}`;
        
        const trade: Trade = {
          id: tradeId,
          filing_id: filingId,
          politician: politician.lastName,
          full_name: politician.fullName,
          party: politician.party,
          state: politician.state,
          chamber: politician.chamber,
          ticker: parsedTrade.ticker,
          asset_name: parsedTrade.asset_name,
          asset_type: parsedTrade.asset_type,
          action: parsedTrade.action,
          transaction_date: parsedTrade.transaction_date,
          notification_date: parsedTrade.notification_date,
          amount_min: parsedTrade.amount_min,
          amount_max: parsedTrade.amount_max,
          amount_label: parsedTrade.amount_label,
          notes: parsedTrade.notes,
          owner: parsedTrade.owner,
          partial: parsedTrade.partial,
          pdf_url: pdfUrl,
          inserted_at: new Date().toISOString()
        };

        await congressDb.insertTrade(trade);
        tradeCount++;

        // Create alert
        const alertId = tradeId;
        await congressDb.insertAlert({
          id: alertId,
          trade_id: tradeId,
          detected_at: new Date().toISOString(),
          read: false
        });
        alertCount++;

        // Emit event for real-time streaming
        this.emit('new-trade', trade);
      }

      return { isNew: true, trades: tradeCount, alerts: alertCount };
    } catch (error: any) {
      console.error(`Failed to process filing ${filingId}: ${error.message}`);
      throw error;
    }
  }

  getLastPollTime(): Date | null {
    return this.lastPollTime;
  }

  isPolling(): boolean {
    return this.isRunning;
  }
}

export const congressPipeline = new CongressPipeline();
