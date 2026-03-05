// Script to fix missing dates in congress_trades table
// Uses filing_id (YYYYMMDD format) as fallback date

import { initDatabase, getDatabase } from '../database.js';
import { congressDb } from './database.js';

async function fixMissingDates() {
  console.log('🔧 Fixing missing dates in congress_trades...');

  try {
    // Initialize main database first
    await initDatabase();
    
    // Initialize congress tables
    await congressDb.initTables();
    
    // Get database instance
    const db = getDatabase();
    
    // Get all trades with empty or null dates
    const trades = await db.all(`
      SELECT id, filing_id, transaction_date, notification_date
      FROM trades
      WHERE transaction_date IS NULL 
         OR notification_date IS NULL
    `);

    console.log(`Found ${trades.length} trades with missing dates`);

    let fixed = 0;

    for (const trade of trades) {
      // Extract date from filing_id (format: YYYYMMDD)
      if (trade.filing_id && /^\d{8}/.test(trade.filing_id)) {
        const year = trade.filing_id.substring(0, 4);
        const month = trade.filing_id.substring(4, 6);
        const day = trade.filing_id.substring(6, 8);
        const fallbackDate = `${year}-${month}-${day}`;

        const updates: string[] = [];
        const params: any = { id: trade.id };

        if (!trade.transaction_date) {
          updates.push('transaction_date = $transaction_date');
          params.transaction_date = fallbackDate;
        }

        if (!trade.notification_date) {
          updates.push('notification_date = $notification_date');
          params.notification_date = fallbackDate;
        }

        if (updates.length > 0) {
          await db.run(
            `UPDATE trades SET ${updates.join(', ')} WHERE id = $id`,
            params
          );
          fixed++;
          console.log(`✅ Fixed trade ${trade.id}: ${fallbackDate}`);
        }
      } else {
        console.log(`⚠️  Cannot extract date from filing_id: ${trade.filing_id}`);
      }
    }

    console.log(`\n✅ Fixed ${fixed} trades`);
    
    // Show summary
    const summary = await db.all(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN transaction_date IS NULL THEN 1 ELSE 0 END) as missing_transaction,
        SUM(CASE WHEN notification_date IS NULL THEN 1 ELSE 0 END) as missing_notification
      FROM trades
    `);

    console.log('\n📊 Summary:');
    console.log(`Total trades: ${summary[0].total}`);
    console.log(`Missing transaction_date: ${summary[0].missing_transaction}`);
    console.log(`Missing notification_date: ${summary[0].missing_notification}`);

  } catch (error) {
    console.error('❌ Error fixing dates:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMissingDates()
    .then(() => {
      console.log('✅ Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { fixMissingDates };
