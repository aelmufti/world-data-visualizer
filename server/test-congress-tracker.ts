// Quick test script for Congress tracker
import { initDatabase } from './src/database.js';
import { congressPipeline } from './src/congress-tracker/pipeline.js';
import { congressDb } from './src/congress-tracker/database.js';
import { pdfParser } from './src/congress-tracker/pdf-parser.js';
import { priceService } from './src/congress-tracker/price-service.js';

async function test() {
  console.log('🧪 Testing Congress Tracker...\n');

  // Test 1: Check pdftotext
  console.log('1️⃣  Checking pdftotext availability...');
  const hasPdfToText = await pdfParser.checkPdfToText();
  console.log(`   ${hasPdfToText ? '✅' : '❌'} pdftotext ${hasPdfToText ? 'found' : 'NOT FOUND'}`);
  if (!hasPdfToText) {
    console.log('   Install with: brew install poppler (macOS) or apt install poppler-utils (Linux)\n');
    return;
  }

  // Test 2: Initialize database
  console.log('\n2️⃣  Initializing database...');
  await initDatabase();
  await congressDb.initTables();
  console.log('   ✅ Database tables created');

  // Test 3: Check stats
  console.log('\n3️⃣  Checking database stats...');
  const stats = await congressDb.getStats();
  console.log(`   📊 Filings: ${stats.totalFilings}`);
  console.log(`   📊 Trades: ${stats.totalTrades}`);
  console.log(`   📊 Unread Alerts: ${stats.unreadAlerts}`);

  // Test 4: Test Yahoo Finance price lookup
  console.log('\n4️⃣  Testing Yahoo Finance price lookup...');
  const testPrice = await priceService.getCurrentPrice('NVDA');
  console.log(`   ${testPrice ? '✅' : '❌'} NVDA current price: ${testPrice ? `$${testPrice.toFixed(2)}` : 'Failed'}`);

  // Test 5: Run a single poll (this will take a few minutes)
  console.log('\n5️⃣  Running test poll (this may take a few minutes)...');
  console.log('   ⏳ Fetching filings from House and Senate...');
  
  const result = await congressPipeline.runPoll();
  
  console.log(`\n   ${result.success ? '✅' : '❌'} Poll ${result.success ? 'completed' : 'failed'}`);
  console.log(`   📄 New filings: ${result.filings}`);
  console.log(`   💼 New trades: ${result.trades}`);
  console.log(`   🔔 New alerts: ${result.alerts}`);
  
  if (result.warnings.length > 0) {
    console.log(`   ⚠️  Warnings: ${result.warnings.length}`);
    result.warnings.forEach(w => console.log(`      - ${w}`));
  }

  // Test 6: Check updated stats
  console.log('\n6️⃣  Updated database stats...');
  const newStats = await congressDb.getStats();
  console.log(`   📊 Total Filings: ${newStats.totalFilings}`);
  console.log(`   📊 Total Trades: ${newStats.totalTrades}`);
  console.log(`   📊 Unread Alerts: ${newStats.unreadAlerts}`);

  console.log('\n✅ Test complete!\n');
  console.log('🚀 Start the server with: npm run dev');
  console.log('📡 API available at: http://localhost:8000/api/congress/');
  console.log('📊 Check status: http://localhost:8000/api/congress/status');
  
  process.exit(0);
}

test().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
