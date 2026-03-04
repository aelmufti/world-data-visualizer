// PDF parsing utilities for PTR (Periodic Transaction Report) filings
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export interface ParsedTrade {
  ticker: string;
  asset_name: string;
  asset_type: string; // 'Stock', 'Option', 'Other'
  action: string; // 'Purchase', 'Sale', 'Sale (Partial)', 'Exchange'
  transaction_date: string; // YYYY-MM-DD
  notification_date: string; // YYYY-MM-DD
  amount_min: number;
  amount_max: number;
  amount_label: string;
  notes: string;
  owner: string; // 'Self', 'Spouse', 'Joint', 'Dependent Child'
  partial: boolean;
}

export class PDFParser {
  async checkPdfToText(): Promise<boolean> {
    try {
      await execAsync('which pdftotext');
      return true;
    } catch {
      return false;
    }
  }

  async downloadPdf(url: string, timeout: number = 15000): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async pdfToText(pdfBuffer: Buffer): Promise<string> {
    const tempPdfPath = join(tmpdir(), `ptr-${Date.now()}.pdf`);
    const tempTxtPath = join(tmpdir(), `ptr-${Date.now()}.txt`);

    try {
      // Write PDF to temp file
      writeFileSync(tempPdfPath, pdfBuffer);

      // Convert to text
      await execAsync(`pdftotext "${tempPdfPath}" "${tempTxtPath}"`);

      // Read text
      const { readFileSync } = await import('fs');
      const text = readFileSync(tempTxtPath, 'utf-8');

      return text;
    } finally {
      // Cleanup
      if (existsSync(tempPdfPath)) unlinkSync(tempPdfPath);
      if (existsSync(tempTxtPath)) unlinkSync(tempTxtPath);
    }
  }

  parseTrades(text: string): ParsedTrade[] {
    const trades: ParsedTrade[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for ticker pattern: (TICKER) [ST] or (TICKER) [OP]
      const tickerMatch = line.match(/\(([A-Z]{1,5})\)\s*\[([A-Z]{2,3})\]/);
      
      if (tickerMatch) {
        const ticker = tickerMatch[1];
        const assetTypeCode = tickerMatch[2];
        
        // Map asset type
        let asset_type = 'Other';
        if (assetTypeCode === 'ST') asset_type = 'Stock';
        else if (assetTypeCode === 'OP') asset_type = 'Option';

        // Extract asset name (before ticker)
        const assetNameMatch = line.match(/^(.+?)\s*\(/);
        const asset_name = assetNameMatch ? assetNameMatch[1].trim() : '';

        // Look for action code in nearby lines
        let action = '';
        let partial = false;
        for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 5); j++) {
          const actionLine = lines[j].trim();
          if (actionLine === 'P') {
            action = 'Purchase';
            break;
          } else if (actionLine === 'S') {
            action = 'Sale';
            break;
          } else if (actionLine.includes('S (partial)')) {
            action = 'Sale (Partial)';
            partial = true;
            break;
          } else if (actionLine === 'E') {
            action = 'Exchange';
            break;
          }
        }

        // Look for owner code
        let owner = 'Self';
        for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 5); j++) {
          const ownerLine = lines[j].trim();
          if (ownerLine === 'SP') {
            owner = 'Spouse';
            break;
          } else if (ownerLine === 'JT') {
            owner = 'Joint';
            break;
          } else if (ownerLine === 'DC') {
            owner = 'Dependent Child';
            break;
          }
        }

        // Look for dates (MM/DD/YYYY MM/DD/YYYY)
        let transaction_date = '';
        let notification_date = '';
        for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
          const dateMatch = lines[j].match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})/);
          if (dateMatch) {
            transaction_date = this.formatDate(dateMatch[1]);
            notification_date = this.formatDate(dateMatch[2]);
            break;
          }
        }

        // Look for amounts
        let amount_min = 0;
        let amount_max = 0;
        let amount_label = '';
        for (let j = i + 1; j < Math.min(lines.length, i + 20); j++) {
          const amountMatch = lines[j].match(/\$([0-9,]+)\s+\$([0-9,]+)/);
          if (amountMatch) {
            amount_min = this.parseAmount(amountMatch[1]);
            amount_max = this.parseAmount(amountMatch[2]);
            amount_label = this.formatAmountLabel(amount_min, amount_max);
            break;
          }
          // Single amount
          const singleMatch = lines[j].match(/\$([0-9,]+)/);
          if (singleMatch && !lines[j].includes('$1,000')) {
            amount_min = this.parseAmount(singleMatch[1]);
            amount_max = amount_min;
            amount_label = this.formatAmountLabel(amount_min, amount_max);
            break;
          }
        }

        // Look for notes
        let notes = '';
        for (let j = i + 1; j < Math.min(lines.length, i + 25); j++) {
          const noteLine = lines[j].trim();
          if (noteLine.startsWith(': ') && !noteLine.startsWith(': New')) {
            notes = noteLine.substring(2).trim();
            break;
          } else if (noteLine.startsWith(':') && noteLine.length > 1) {
            notes = noteLine.substring(1).trim();
            break;
          }
        }

        // Only add if we have minimum required data
        if (ticker && action && transaction_date) {
          trades.push({
            ticker,
            asset_name,
            asset_type,
            action,
            transaction_date,
            notification_date,
            amount_min,
            amount_max,
            amount_label,
            notes,
            owner,
            partial
          });
        }
      }
    }

    return trades;
  }

  private formatDate(date: string): string {
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  private parseAmount(amount: string): number {
    return parseInt(amount.replace(/[,$]/g, ''), 10);
  }

  private formatAmountLabel(min: number, max: number): string {
    const format = (n: number) => {
      if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
      return `$${n}`;
    };

    if (min === max) return format(min);
    return `${format(min)} – ${format(max)}`;
  }
}

export const pdfParser = new PDFParser();
