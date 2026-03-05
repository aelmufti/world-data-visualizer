// DuckDB schema and database operations for Congress & Senate trade tracking
import { getDatabase } from '../database.js';

export interface Filing {
  filing_id: string;
  politician: string;
  full_name: string;
  party: string;
  state: string;
  chamber: 'house' | 'senate';
  pdf_url: string;
  fetched_at: string;
  year: number;
}

export interface Trade {
  id: string;
  filing_id: string;
  politician: string;
  full_name: string;
  party: string;
  state: string;
  chamber: 'house' | 'senate';
  ticker: string;
  asset_name: string;
  asset_type: string;
  action: string;
  transaction_date: string;
  notification_date: string;
  amount_min: number;
  amount_max: number;
  amount_label: string;
  notes: string;
  owner: string;
  partial: boolean;
  pdf_url: string;
  inserted_at: string;
}

export interface Alert {
  id: string;
  trade_id: string;
  detected_at: string;
  read: boolean;
}

export interface PriceCache {
  ticker: string;
  price_date: string;
  close_price: number | null;
  fetched_at: string;
}

export class CongressDatabase {
  async initTables(): Promise<void> {
    const db = getDatabase();

    await db.exec(`
      CREATE TABLE IF NOT EXISTS politicians (
        bioguide_id VARCHAR PRIMARY KEY,
        last_name VARCHAR,
        full_name VARCHAR,
        party VARCHAR,
        state VARCHAR,
        chamber VARCHAR,
        district VARCHAR,
        is_active BOOLEAN DEFAULT true,
        last_updated TIMESTAMP
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS filings (
        filing_id VARCHAR PRIMARY KEY,
        politician VARCHAR,
        full_name VARCHAR,
        party VARCHAR,
        state VARCHAR,
        chamber VARCHAR,
        pdf_url VARCHAR,
        fetched_at TIMESTAMP,
        year INTEGER
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id VARCHAR PRIMARY KEY,
        filing_id VARCHAR,
        politician VARCHAR,
        full_name VARCHAR,
        party VARCHAR,
        state VARCHAR,
        chamber VARCHAR,
        ticker VARCHAR,
        asset_name VARCHAR,
        asset_type VARCHAR,
        action VARCHAR,
        transaction_date DATE,
        notification_date DATE,
        amount_min BIGINT,
        amount_max BIGINT,
        amount_label VARCHAR,
        notes VARCHAR,
        owner VARCHAR,
        partial BOOLEAN,
        pdf_url VARCHAR,
        inserted_at TIMESTAMP
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR PRIMARY KEY,
        trade_id VARCHAR,
        detected_at TIMESTAMP,
        read BOOLEAN DEFAULT false
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS price_cache (
        ticker VARCHAR,
        price_date DATE,
        close_price DOUBLE,
        fetched_at TIMESTAMP,
        PRIMARY KEY (ticker, price_date)
      );
    `);

    console.log('✅ Congress tracker tables initialized');
  }

  async filingExists(filingId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.all(
      'SELECT filing_id FROM filings WHERE filing_id = ? LIMIT 1',
      filingId
    );
    return result.length > 0;
  }

  async insertFiling(filing: Filing): Promise<void> {
    const db = getDatabase();
    await db.run(
      `INSERT OR IGNORE INTO filings 
       (filing_id, politician, full_name, party, state, chamber, pdf_url, fetched_at, year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      filing.filing_id,
      filing.politician,
      filing.full_name,
      filing.party,
      filing.state,
      filing.chamber,
      filing.pdf_url,
      filing.fetched_at,
      filing.year
    );
  }

  async insertTrade(trade: Trade): Promise<void> {
    const db = getDatabase();
    await db.run(
      `INSERT OR IGNORE INTO trades 
       (id, filing_id, politician, full_name, party, state, chamber, ticker, asset_name, 
        asset_type, action, transaction_date, notification_date, amount_min, amount_max, 
        amount_label, notes, owner, partial, pdf_url, inserted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      trade.id,
      trade.filing_id,
      trade.politician,
      trade.full_name,
      trade.party,
      trade.state,
      trade.chamber,
      trade.ticker,
      trade.asset_name,
      trade.asset_type,
      trade.action,
      trade.transaction_date,
      trade.notification_date,
      trade.amount_min,
      trade.amount_max,
      trade.amount_label,
      trade.notes,
      trade.owner,
      trade.partial,
      trade.pdf_url,
      trade.inserted_at
    );
  }

  async insertAlert(alert: Alert): Promise<void> {
    const db = getDatabase();
    await db.run(
      'INSERT OR IGNORE INTO alerts (id, trade_id, detected_at, read) VALUES (?, ?, ?, ?)',
      alert.id,
      alert.trade_id,
      alert.detected_at,
      alert.read
    );
  }

  async getTrades(filters: {
    politician?: string;
    ticker?: string;
    action?: string;
    chamber?: string;
  }): Promise<Trade[]> {
    const db = getDatabase();
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filters.politician) {
      whereClauses.push('LOWER(politician) LIKE ?');
      params.push(`%${filters.politician.toLowerCase()}%`);
    }
    if (filters.ticker) {
      whereClauses.push('UPPER(ticker) = ?');
      params.push(filters.ticker.toUpperCase());
    }
    if (filters.action) {
      whereClauses.push('action = ?');
      params.push(filters.action);
    }
    if (filters.chamber) {
      whereClauses.push('chamber = ?');
      params.push(filters.chamber);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    return await db.all(
      `SELECT * FROM trades ${whereClause} ORDER BY transaction_date DESC LIMIT 500`,
      ...params
    );
  }

  async getTradesByPolitician(lastName: string): Promise<Trade[]> {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM trades WHERE LOWER(politician) LIKE ? ORDER BY transaction_date DESC',
      `%${lastName.toLowerCase()}%`
    );
  }

  async getAllFilings(): Promise<Filing[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM filings ORDER BY fetched_at DESC');
  }

  async getAlerts(unreadOnly: boolean = false): Promise<any[]> {
    const db = getDatabase();
    const whereClause = unreadOnly ? 'WHERE alerts.read = false' : '';
    
    return await db.all(`
      SELECT 
        alerts.id,
        alerts.trade_id,
        alerts.detected_at,
        alerts.read,
        trades.*
      FROM alerts
      JOIN trades ON alerts.trade_id = trades.id
      ${whereClause}
      ORDER BY alerts.detected_at DESC
      LIMIT 100
    `);
  }

  async markAlertRead(alertId: string): Promise<void> {
    const db = getDatabase();
    await db.run('UPDATE alerts SET read = true WHERE id = ?', alertId);
  }

  async markAllAlertsRead(): Promise<void> {
    const db = getDatabase();
    await db.run('UPDATE alerts SET read = true');
  }

  async getUnreadAlertCount(): Promise<number> {
    const db = getDatabase();
    const result = await db.all('SELECT COUNT(*) as count FROM alerts WHERE read = false');
    return result[0]?.count || 0;
  }

  async getCachedPrice(ticker: string, date: string): Promise<number | null | undefined> {
    const db = getDatabase();
    const result = await db.all(
      'SELECT close_price FROM price_cache WHERE ticker = ? AND price_date = ? LIMIT 1',
      ticker,
      date
    );
    return result[0]?.close_price;
  }

  async setCachedPrice(ticker: string, date: string, price: number | null): Promise<void> {
    const db = getDatabase();
    await db.run(
      `INSERT OR REPLACE INTO price_cache (ticker, price_date, close_price, fetched_at)
       VALUES (?, ?, ?, ?)`,
      ticker,
      date,
      price,
      new Date().toISOString()
    );
  }

  async getStats(): Promise<{ totalFilings: number; totalTrades: number; unreadAlerts: number }> {
    const db = getDatabase();
    
    const filings = await db.all('SELECT COUNT(*) as count FROM filings');
    const trades = await db.all('SELECT COUNT(*) as count FROM trades');
    const alerts = await this.getUnreadAlertCount();

    return {
      totalFilings: filings[0]?.count || 0,
      totalTrades: trades[0]?.count || 0,
      unreadAlerts: alerts
    };
  }
}

export const congressDb = new CongressDatabase();
