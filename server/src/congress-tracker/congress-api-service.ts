// Service for fetching politician data from Congress.gov API
import { getDatabase } from '../database.js';

export interface CongressMember {
  bioguideId: string;
  name: string;
  firstName: string;
  lastName: string;
  party: string;
  state: string;
  chamber: 'house' | 'senate';
  district?: string;
  terms?: any[];
}

export interface Politician {
  bioguide_id: string;
  last_name: string;
  full_name: string;
  party: 'D' | 'R' | 'I';
  state: string;
  chamber: 'house' | 'senate';
  district?: string;
  is_active: boolean;
  last_updated: string;
}

export class CongressApiService {
  private apiKey: string;
  private baseUrl = 'https://api.congress.gov/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchHouseMembers(congress: number = 119): Promise<CongressMember[]> {
    const members: CongressMember[] = [];
    let offset = 0;
    const limit = 250;

    while (true) {
      const url = `${this.baseUrl}/member?chamber=house&congress=${congress}&limit=${limit}&offset=${offset}&api_key=${this.apiKey}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Congress API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const batch = data.members || [];
        
        if (batch.length === 0) break;

        for (const member of batch) {
          // Only include currently serving members
          if (!this.isCurrentlyServing(member)) {
            continue;
          }

          const lastName = this.extractLastName(member.name || member.lastName || '');
          members.push({
            bioguideId: member.bioguideId,
            name: member.name,
            firstName: member.firstName || '',
            lastName: lastName,
            party: this.normalizeParty(member.partyName),
            state: member.state,
            chamber: 'house',
            district: member.district,
            terms: member.terms
          });
        }

        offset += limit;
        
        // If we got fewer results than the limit, we're done
        if (batch.length < limit) break;
      } catch (error: any) {
        console.error(`Failed to fetch House members at offset ${offset}:`, error.message);
        throw error;
      }
    }

    return members;
  }

  async fetchSenateMembers(congress: number = 119): Promise<CongressMember[]> {
    const url = `${this.baseUrl}/member?chamber=senate&congress=${congress}&limit=100&api_key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Congress API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const members = data.members || [];

      return members.map((member: any) => ({
        bioguideId: member.bioguideId,
        name: member.name,
        firstName: member.firstName || '',
        lastName: this.extractLastName(member.name || member.lastName || ''),
        party: this.normalizeParty(member.partyName),
        state: member.state,
        chamber: 'senate' as const,
        terms: member.terms
      })).filter((member: any) => {
        // Only include currently serving members
        const originalMember = members.find((m: any) => m.bioguideId === member.bioguideId);
        return originalMember && this.isCurrentlyServing(originalMember);
      });
    } catch (error: any) {
      console.error('Failed to fetch Senate members:', error.message);
      throw error;
    }
  }

  async fetchAllMembers(congress: number = 119): Promise<CongressMember[]> {
    console.log(`🔄 Fetching all Congress members for ${congress}th Congress...`);
    
    const [houseMembers, senateMembers] = await Promise.all([
      this.fetchHouseMembers(congress),
      this.fetchSenateMembers(congress)
    ]);

    const total = houseMembers.length + senateMembers.length;
    console.log(`✅ Fetched ${houseMembers.length} House + ${senateMembers.length} Senate = ${total} members`);

    return [...houseMembers, ...senateMembers];
  }

  private normalizeParty(partyName: string): 'D' | 'R' | 'I' {
    if (!partyName) return 'I';
    
    const party = partyName.toUpperCase();
    if (party.includes('DEMOCRAT')) return 'D';
    if (party.includes('REPUBLICAN')) return 'R';
    return 'I';
  }

  private extractLastName(fullName: string): string {
    // Handle formats like "Pelosi, Nancy" or "Aderholt, Robert B."
    // Extract just the last name before the comma
    if (fullName.includes(',')) {
      return fullName.split(',')[0].trim();
    }
    // If no comma, try to get the last word
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1];
  }

  private isCurrentlyServing(member: any): boolean {
    // Check if the member is currently serving based on their terms
    if (!member.terms || !member.terms.item || !Array.isArray(member.terms.item) || member.terms.item.length === 0) {
      return false;
    }

    // Get the most recent term
    const latestTerm = member.terms.item[member.terms.item.length - 1];
    
    // If there's no end year, they're currently serving
    if (!latestTerm.endYear) {
      return true;
    }

    // Check if the end year is in the future or current year
    const currentYear = new Date().getFullYear();
    const endYear = parseInt(latestTerm.endYear);
    
    // If end year is current year or future, consider them active
    return endYear >= currentYear;
  }

  async syncPoliticiansToDatabase(congress: number = 119): Promise<number> {
    const db = getDatabase();
    
    // Fetch all members
    const members = await this.fetchAllMembers(congress);
    
    // Mark all existing politicians as inactive
    await db.run('UPDATE politicians SET is_active = false');
    
    // Insert or update politicians
    let insertedCount = 0;
    const now = new Date().toISOString();

    for (const member of members) {
      // Only include members with valid last names (skip historical/invalid entries)
      if (!member.lastName || member.lastName.length < 2) {
        continue;
      }

      await db.run(
        `INSERT INTO politicians 
         (bioguide_id, last_name, full_name, party, state, chamber, district, is_active, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, true, ?)
         ON CONFLICT (bioguide_id) DO UPDATE SET
           last_name = excluded.last_name,
           full_name = excluded.full_name,
           party = excluded.party,
           state = excluded.state,
           chamber = excluded.chamber,
           district = excluded.district,
           is_active = true,
           last_updated = excluded.last_updated`,
        member.bioguideId,
        member.lastName,
        member.name,
        member.party,
        member.state,
        member.chamber,
        member.district || null,
        now
      );
      insertedCount++;
    }

    console.log(`✅ Synced ${insertedCount} politicians to database`);
    return insertedCount;
  }

  async getActivePoliticians(): Promise<Politician[]> {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM politicians WHERE is_active = true ORDER BY chamber, state, last_name'
    );
  }

  async shouldRefresh(): Promise<boolean> {
    const db = getDatabase();
    const result = await db.all(
      'SELECT MAX(last_updated) as last_update FROM politicians WHERE is_active = true'
    );
    
    if (!result[0]?.last_update) {
      return true; // No data, need refresh
    }

    const lastUpdate = new Date(result[0].last_update);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceUpdate >= 24;
  }
}
