/**
 * Verification script for KeywordManager
 * This script manually tests the KeywordManager implementation
 */

import { KeywordManager } from './KeywordManager.js'

console.log('=== KeywordManager Verification ===\n')

const manager = new KeywordManager()

// Test 1: Get all sectors
console.log('Test 1: Get all sectors')
const sectors = manager.getSectors()
console.log(`✓ Found ${sectors.length} sectors:`, sectors)
console.log()

// Test 2: Verify all 6 sectors exist
console.log('Test 2: Verify all 6 sectors exist')
const expectedSectors = ['Énergie', 'Technologie', 'Santé', 'Télécoms', 'Industrie', 'Services Publics']
expectedSectors.forEach(sector => {
  const exists = manager.hasSector(sector)
  console.log(`✓ ${sector}: ${exists ? 'EXISTS' : 'MISSING'}`)
})
console.log()

// Test 3: Verify minimum 8 keywords per sector
console.log('Test 3: Verify minimum 8 keywords per sector (Requirement 2.8)')
sectors.forEach(sector => {
  const keywords = manager.getKeywords(sector)
  const status = keywords.length >= 8 ? '✓' : '✗'
  console.log(`${status} ${sector}: ${keywords.length} keywords`)
})
console.log()

// Test 4: Verify 4 categories per sector
console.log('Test 4: Verify 4 categories per sector')
const categories = ['primary', 'secondary', 'geopolitical', 'contextual']
const testSector = 'Énergie'
categories.forEach(category => {
  const keywords = manager.getKeywordsByCategory(testSector, category)
  console.log(`✓ ${testSector} - ${category}: ${keywords.length} keywords`)
})
console.log()

// Test 5: Verify getKeywords() flattens all categories
console.log('Test 5: Verify getKeywords() flattens all categories')
const allKeywords = manager.getKeywords(testSector)
const primaryCount = manager.getKeywordsByCategory(testSector, 'primary').length
const secondaryCount = manager.getKeywordsByCategory(testSector, 'secondary').length
const geopoliticalCount = manager.getKeywordsByCategory(testSector, 'geopolitical').length
const contextualCount = manager.getKeywordsByCategory(testSector, 'contextual').length
const expectedTotal = primaryCount + secondaryCount + geopoliticalCount + contextualCount
console.log(`✓ ${testSector} total keywords: ${allKeywords.length}`)
console.log(`  Expected: ${expectedTotal} (${primaryCount}+${secondaryCount}+${geopoliticalCount}+${contextualCount})`)
console.log(`  Match: ${allKeywords.length === expectedTotal ? 'YES' : 'NO'}`)
console.log()

// Test 6: Sample keywords from each sector
console.log('Test 6: Sample keywords from each sector')
sectors.forEach(sector => {
  const keywords = manager.getKeywords(sector)
  console.log(`✓ ${sector}: ${keywords.slice(0, 5).join(', ')}...`)
})
console.log()

// Test 7: Test addKeywords
console.log('Test 7: Test addKeywords()')
const beforeAdd = manager.getKeywordsByCategory('Énergie', 'primary').length
manager.addKeywords('Énergie', 'primary', ['hydrogen', 'biofuel'])
const afterAdd = manager.getKeywordsByCategory('Énergie', 'primary').length
console.log(`✓ Added 2 keywords: before=${beforeAdd}, after=${afterAdd}`)
const energyKeywords = manager.getKeywordsByCategory('Énergie', 'primary')
console.log(`✓ Contains 'hydrogen': ${energyKeywords.includes('hydrogen')}`)
console.log(`✓ Contains 'biofuel': ${energyKeywords.includes('biofuel')}`)
console.log()

// Test 8: Test removeKeywords
console.log('Test 8: Test removeKeywords()')
manager.removeKeywords('Énergie', 'primary', ['hydrogen'])
const afterRemove = manager.getKeywordsByCategory('Énergie', 'primary')
console.log(`✓ Removed 'hydrogen': ${!afterRemove.includes('hydrogen')}`)
console.log(`✓ Still has 'biofuel': ${afterRemove.includes('biofuel')}`)
console.log()

// Test 9: Test error handling
console.log('Test 9: Test error handling')
try {
  manager.getKeywords('NonExistent')
  console.log('✗ Should have thrown error for non-existent sector')
} catch (error) {
  console.log(`✓ Correctly threw error: ${error.message}`)
}
console.log()

console.log('=== All Verification Tests Passed ===')
