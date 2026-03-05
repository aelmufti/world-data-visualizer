#!/usr/bin/env node
// CLI script to manually sync politicians from Congress.gov API
import { CongressApiService } from './src/congress-tracker/congress-api-service.js';
import { initDatabase } from './src/database.js';
import { congressDb } from './src/congress-tracker/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const apiKey = process.env.CONGRESS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CONGRESS_API_KEY not set in .env file');
    console.log('\nTo get an API key:');
    console.log('1. Visit https://api.congress.gov/sign-up/');
    console.log('2. Sign up for a free API key');
    console.log('3. Add it to server/.env: CONGRESS_API_KEY=your_key_here');
    process.exit(1);
  }

  console.log('🔄 Initializing database...');
  await initDatabase();
  await congressDb.initTables();

  console.log('🔄 Syncing politicians from Congress.gov API...');
  const service = new CongressApiService(apiKey);
  
  try {
    const count = await service.syncPoliticiansToDatabase(119);
    console.log(`✅ Successfully synced ${count} politicians`);
    
    // Show some stats
    const politicians = await service.getActivePoliticians();
    const houseCount = politicians.filter(p => p.chamber === 'house').length;
    const senateCount = politicians.filter(p => p.chamber === 'senate').length;
    
    console.log(`\n📊 Statistics:`);
    console.log(`   House: ${houseCount} members`);
    console.log(`   Senate: ${senateCount} members`);
    console.log(`   Total: ${politicians.length} active politicians`);
    
    // Show party breakdown
    const dems = politicians.filter(p => p.party === 'D').length;
    const reps = politicians.filter(p => p.party === 'R').length;
    const ind = politicians.filter(p => p.party === 'I').length;
    
    console.log(`\n🎭 Party Breakdown:`);
    console.log(`   Democrats: ${dems}`);
    console.log(`   Republicans: ${reps}`);
    console.log(`   Independent: ${ind}`);
    
  } catch (error: any) {
    console.error('❌ Failed to sync politicians:', error.message);
    process.exit(1);
  }
}

main();
