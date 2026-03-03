/**
 * Unit tests for KeywordManager
 * 
 * Tests basic functionality and edge cases for the KeywordManager class
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { KeywordManager } from './KeywordManager.js'

describe('KeywordManager', () => {
  let manager: KeywordManager

  beforeEach(() => {
    manager = new KeywordManager()
  })

  describe('getKeywords', () => {
    it('should return all keywords for Énergie sector', () => {
      const keywords = manager.getKeywords('Énergie')
      
      expect(keywords).toContain('oil')
      expect(keywords).toContain('renewable')
      expect(keywords).toContain('OPEC')
      expect(keywords).toContain('carbon tax')
      expect(keywords.length).toBeGreaterThanOrEqual(8)
    })

    it('should return all keywords for Technologie sector', () => {
      const keywords = manager.getKeywords('Technologie')
      
      expect(keywords).toContain('technology')
      expect(keywords).toContain('semiconductor')
      expect(keywords).toContain('tech regulation')
      expect(keywords).toContain('innovation')
      expect(keywords.length).toBeGreaterThanOrEqual(8)
    })

    it('should return all keywords for Santé sector', () => {
      const keywords = manager.getKeywords('Santé')
      
      expect(keywords).toContain('healthcare')
      expect(keywords).toContain('hospital')
      expect(keywords).toContain('pandemic')
      expect(keywords).toContain('aging population')
      expect(keywords.length).toBeGreaterThanOrEqual(8)
    })

    it('should return all keywords for Télécoms sector', () => {
      const keywords = manager.getKeywords('Télécoms')
      
      expect(keywords).toContain('telecom')
      expect(keywords).toContain('fiber')
      expect(keywords).toContain('spectrum auction')
      expect(keywords).toContain('connectivity')
      expect(keywords.length).toBeGreaterThanOrEqual(8)
    })

    it('should return all keywords for Industrie sector', () => {
      const keywords = manager.getKeywords('Industrie')
      
      expect(keywords).toContain('manufacturing')
      expect(keywords).toContain('factory')
      expect(keywords).toContain('trade war')
      expect(keywords).toContain('capacity')
      expect(keywords.length).toBeGreaterThanOrEqual(8)
    })

    it('should return all keywords for Services Publics sector', () => {
      const keywords = manager.getKeywords('Services Publics')
      
      expect(keywords).toContain('utilities')
      expect(keywords).toContain('grid')
      expect(keywords).toContain('regulation')
      expect(keywords).toContain('renewable mandate')
      expect(keywords.length).toBeGreaterThanOrEqual(8)
    })

    it('should throw error for unknown sector', () => {
      expect(() => manager.getKeywords('Unknown')).toThrow('Sector not found: Unknown')
    })

    it('should flatten all 4 categories', () => {
      const keywords = manager.getKeywords('Énergie')
      const primaryKeywords = manager.getKeywordsByCategory('Énergie', 'primary')
      const secondaryKeywords = manager.getKeywordsByCategory('Énergie', 'secondary')
      const geopoliticalKeywords = manager.getKeywordsByCategory('Énergie', 'geopolitical')
      const contextualKeywords = manager.getKeywordsByCategory('Énergie', 'contextual')
      
      const expectedTotal = 
        primaryKeywords.length + 
        secondaryKeywords.length + 
        geopoliticalKeywords.length + 
        contextualKeywords.length
      
      expect(keywords.length).toBe(expectedTotal)
    })
  })

  describe('addKeywords', () => {
    it('should add keywords to primary category', () => {
      const beforeCount = manager.getKeywordsByCategory('Énergie', 'primary').length
      
      manager.addKeywords('Énergie', 'primary', ['hydrogen', 'biofuel'])
      
      const keywords = manager.getKeywordsByCategory('Énergie', 'primary')
      expect(keywords).toContain('hydrogen')
      expect(keywords).toContain('biofuel')
      expect(keywords.length).toBe(beforeCount + 2)
    })

    it('should not add duplicate keywords', () => {
      manager.addKeywords('Énergie', 'primary', ['oil', 'gas'])
      
      const keywords = manager.getKeywordsByCategory('Énergie', 'primary')
      const oilCount = keywords.filter(k => k === 'oil').length
      
      expect(oilCount).toBe(1)
    })

    it('should throw error for unknown sector', () => {
      expect(() => 
        manager.addKeywords('Unknown', 'primary', ['test'])
      ).toThrow('Sector not found: Unknown')
    })
  })

  describe('removeKeywords', () => {
    it('should remove keywords from category', () => {
      manager.removeKeywords('Énergie', 'primary', ['oil', 'gas'])
      
      const keywords = manager.getKeywordsByCategory('Énergie', 'primary')
      expect(keywords).not.toContain('oil')
      expect(keywords).not.toContain('gas')
    })

    it('should not affect other categories', () => {
      const beforeSecondary = manager.getKeywordsByCategory('Énergie', 'secondary')
      
      manager.removeKeywords('Énergie', 'primary', ['oil'])
      
      const afterSecondary = manager.getKeywordsByCategory('Énergie', 'secondary')
      expect(afterSecondary).toEqual(beforeSecondary)
    })

    it('should throw error for unknown sector', () => {
      expect(() => 
        manager.removeKeywords('Unknown', 'primary', ['test'])
      ).toThrow('Sector not found: Unknown')
    })
  })

  describe('getSectors', () => {
    it('should return all 6 sectors', () => {
      const sectors = manager.getSectors()
      
      expect(sectors).toHaveLength(6)
      expect(sectors).toContain('Énergie')
      expect(sectors).toContain('Technologie')
      expect(sectors).toContain('Santé')
      expect(sectors).toContain('Télécoms')
      expect(sectors).toContain('Industrie')
      expect(sectors).toContain('Services Publics')
    })
  })

  describe('getKeywordsByCategory', () => {
    it('should return only primary keywords', () => {
      const keywords = manager.getKeywordsByCategory('Énergie', 'primary')
      
      expect(keywords).toContain('oil')
      expect(keywords).toContain('gas')
      expect(keywords).not.toContain('renewable') // secondary
      expect(keywords).not.toContain('OPEC') // geopolitical
    })

    it('should throw error for unknown sector', () => {
      expect(() => 
        manager.getKeywordsByCategory('Unknown', 'primary')
      ).toThrow('Sector not found: Unknown')
    })
  })

  describe('hasSector', () => {
    it('should return true for existing sector', () => {
      expect(manager.hasSector('Énergie')).toBe(true)
      expect(manager.hasSector('Technologie')).toBe(true)
    })

    it('should return false for non-existing sector', () => {
      expect(manager.hasSector('Unknown')).toBe(false)
      expect(manager.hasSector('')).toBe(false)
    })
  })

  describe('minimum keywords requirement', () => {
    it('should have at least 8 keywords per sector', () => {
      const sectors = manager.getSectors()
      
      sectors.forEach(sector => {
        const keywords = manager.getKeywords(sector)
        expect(keywords.length).toBeGreaterThanOrEqual(8)
      })
    })
  })
})

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('KeywordManager Property Tests', () => {
  /**
   * Feature: multi-source-news-aggregation, Property 5: Sector Keywords Completeness
   * 
   * **Validates: Requirements 2.1, 2.8**
   * 
   * For any supported sector, the keyword mapping SHALL contain at least 8 keywords 
   * total across all categories (primary, secondary, geopolitical, contextual).
   */
  it('Property 5: all sectors should have at least 8 keywords total', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary sector from the available sectors
        fc.constantFrom(
          'Énergie',
          'Technologie',
          'Santé',
          'Télécoms',
          'Industrie',
          'Services Publics'
        ),
        (sector) => {
          const manager = new KeywordManager()
          const keywords = manager.getKeywords(sector)
          
          // Property: Every sector must have at least 8 keywords total
          return keywords.length >= 8
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property test: Verify keyword count equals sum of all categories
   * This ensures getKeywords() correctly flattens all categories
   */
  it('Property: total keywords should equal sum of all category keywords', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'Énergie',
          'Technologie',
          'Santé',
          'Télécoms',
          'Industrie',
          'Services Publics'
        ),
        (sector) => {
          const manager = new KeywordManager()
          const allKeywords = manager.getKeywords(sector)
          
          const primaryCount = manager.getKeywordsByCategory(sector, 'primary').length
          const secondaryCount = manager.getKeywordsByCategory(sector, 'secondary').length
          const geopoliticalCount = manager.getKeywordsByCategory(sector, 'geopolitical').length
          const contextualCount = manager.getKeywordsByCategory(sector, 'contextual').length
          
          const expectedTotal = primaryCount + secondaryCount + geopoliticalCount + contextualCount
          
          // Property: Total keywords should equal sum of all categories
          return allKeywords.length === expectedTotal
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property test: Verify no duplicate keywords within a sector
   * This ensures keyword uniqueness across all categories
   */
  it('Property: sectors should not have duplicate keywords across categories', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'Énergie',
          'Technologie',
          'Santé',
          'Télécoms',
          'Industrie',
          'Services Publics'
        ),
        (sector) => {
          const manager = new KeywordManager()
          const allKeywords = manager.getKeywords(sector)
          
          // Property: No duplicates - set size should equal array length
          const uniqueKeywords = new Set(allKeywords)
          return uniqueKeywords.size === allKeywords.length
        }
      ),
      { numRuns: 100 }
    )
  })
})
