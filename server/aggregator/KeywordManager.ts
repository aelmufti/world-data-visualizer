/**
 * KeywordManager - Manages enriched sector keywords for news aggregation
 * 
 * This class provides access to sector-specific keywords organized into 4 categories:
 * - primary: Direct sector keywords
 * - secondary: Related terms
 * - geopolitical: Geopolitical events impacting the sector
 * - contextual: Economic/regulatory context
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */

import { SectorKeywords, SECTOR_KEYWORDS } from './types.js'

export class KeywordManager {
  private keywords: Map<string, SectorKeywords>

  constructor() {
    // Initialize with default sector keywords from types.ts
    // Deep copy to avoid mutating the original SECTOR_KEYWORDS object
    this.keywords = new Map(
      Object.entries(SECTOR_KEYWORDS).map(([sector, keywords]) => [
        sector,
        {
          primary: [...keywords.primary],
          secondary: [...keywords.secondary],
          geopolitical: [...keywords.geopolitical],
          contextual: [...keywords.contextual]
        }
      ])
    )
  }

  /**
   * Get all keywords for a sector, flattened across all categories
   * 
   * @param sector - The sector name (e.g., 'Énergie', 'Technologie')
   * @returns Array of all keywords for the sector
   * @throws Error if sector is not found
   */
  getKeywords(sector: string): string[] {
    const sectorKeywords = this.keywords.get(sector)
    
    if (!sectorKeywords) {
      throw new Error(`Sector not found: ${sector}`)
    }

    // Flatten all categories into a single array
    return [
      ...sectorKeywords.primary,
      ...sectorKeywords.secondary,
      ...sectorKeywords.geopolitical,
      ...sectorKeywords.contextual
    ]
  }

  /**
   * Add keywords to a specific category for a sector
   * 
   * @param sector - The sector name
   * @param category - The keyword category (primary, secondary, geopolitical, contextual)
   * @param keywords - Array of keywords to add
   * @throws Error if sector is not found
   */
  addKeywords(
    sector: string,
    category: keyof SectorKeywords,
    keywords: string[]
  ): void {
    const sectorKeywords = this.keywords.get(sector)
    
    if (!sectorKeywords) {
      throw new Error(`Sector not found: ${sector}`)
    }

    // Add keywords to the specified category (avoid duplicates)
    const existingKeywords = new Set(sectorKeywords[category])
    keywords.forEach(keyword => existingKeywords.add(keyword))
    sectorKeywords[category] = Array.from(existingKeywords)
    
    this.keywords.set(sector, sectorKeywords)
  }

  /**
   * Remove keywords from a specific category for a sector
   * 
   * @param sector - The sector name
   * @param category - The keyword category (primary, secondary, geopolitical, contextual)
   * @param keywords - Array of keywords to remove
   * @throws Error if sector is not found
   */
  removeKeywords(
    sector: string,
    category: keyof SectorKeywords,
    keywords: string[]
  ): void {
    const sectorKeywords = this.keywords.get(sector)
    
    if (!sectorKeywords) {
      throw new Error(`Sector not found: ${sector}`)
    }

    // Remove keywords from the specified category
    const keywordsToRemove = new Set(keywords)
    sectorKeywords[category] = sectorKeywords[category].filter(
      keyword => !keywordsToRemove.has(keyword)
    )
    
    this.keywords.set(sector, sectorKeywords)
  }

  /**
   * Get all available sectors
   * 
   * @returns Array of sector names
   */
  getSectors(): string[] {
    return Array.from(this.keywords.keys())
  }

  /**
   * Get keywords for a specific category of a sector
   * 
   * @param sector - The sector name
   * @param category - The keyword category
   * @returns Array of keywords in the specified category
   * @throws Error if sector is not found
   */
  getKeywordsByCategory(
    sector: string,
    category: keyof SectorKeywords
  ): string[] {
    const sectorKeywords = this.keywords.get(sector)
    
    if (!sectorKeywords) {
      throw new Error(`Sector not found: ${sector}`)
    }

    return [...sectorKeywords[category]]
  }

  /**
   * Check if a sector exists
   * 
   * @param sector - The sector name
   * @returns True if sector exists, false otherwise
   */
  hasSector(sector: string): boolean {
    return this.keywords.has(sector)
  }
}
