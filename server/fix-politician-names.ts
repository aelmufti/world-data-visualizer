#!/usr/bin/env node
// Fix politician last names in database
import { initDatabase, getDatabase } from './src/database.js';

function extractLastName(fullName: string): string {
  // Handle formats like "Pelosi, Nancy" or "Aderholt, Robert B."
  // Extract just the last name before the comma
  if (fullName.includes(',')) {
    return fullName.split(',')[0].trim();
  }
  // If no comma, try to get the last word
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
}

async function main() {
  console.log('🔄 Fixing politician last names...');
  
  await initDatabase();
  const db = getDatabase();

  // Get all politicians
  const politicians = await db.all('SELECT bioguide_id, last_name, full_name FROM politicians');
  
  console.log(`📊 Found ${politicians.length} politicians to check`);
  
  let fixedCount = 0;
  
  for (const pol of politicians) {
    const currentLastName = pol.last_name;
    const correctLastName = extractLastName(pol.full_name || pol.last_name);
    
    if (currentLastName !== correctLastName) {
      await db.run(
        'UPDATE politicians SET last_name = ? WHERE bioguide_id = ?',
        correctLastName,
        pol.bioguide_id
      );
      fixedCount++;
      
      if (fixedCount <= 10) {
        console.log(`✅ Fixed: "${currentLastName}" → "${correctLastName}"`);
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} politician names`);
  console.log(`📊 ${politicians.length - fixedCount} names were already correct`);
}

main().catch(console.error);
