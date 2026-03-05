// House and Senate scrapers for PTR filings

export interface SimplePolitician {
  lastName: string;
  fullName: string;
  party: string;
  state: string;
  chamber: 'house' | 'senate';
}

export interface FilingResult {
  filing_id: string;
  pdf_url: string;
  year: number;
  politician: SimplePolitician;
}

export class HouseScraper {
  private baseUrl = 'https://disclosures-clerk.house.gov';

  async searchFilings(politician: SimplePolitician, year: number): Promise<FilingResult[]> {
    const formData = new URLSearchParams({
      LastName: politician.lastName,
      State: '',
      District: '',
      FilingYear: year.toString(),
      submitForm: 'Submit'
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        `${this.baseUrl}/FinancialDisclosure/ViewMemberSearchResult`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
          signal: controller.signal
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Extract PTR PDF links (ignore financial-pdfs)
      const ptrMatches = html.match(/href="([^"]*ptr-pdfs[^"]*)"/g) || [];
      
      const filings: FilingResult[] = [];
      
      for (const match of ptrMatches) {
        const pathMatch = match.match(/href="([^"]*)"/);
        if (!pathMatch) continue;
        
        const pdfPath = pathMatch[1];
        const yearMatch = pdfPath.match(/ptr-pdfs\/(\d{4})\//);
        const idMatch = pdfPath.match(/\/(\d{8})\.pdf/);
        
        if (yearMatch && idMatch) {
          const fullUrl = pdfPath.startsWith('http') 
            ? pdfPath 
            : `${this.baseUrl}/${pdfPath}`;
          
          filings.push({
            filing_id: idMatch[1],
            pdf_url: fullUrl,
            year: parseInt(yearMatch[1]),
            politician
          });
        }
      }
      
      return filings;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class SenateScraper {
  private baseUrl = 'https://efdsearch.senate.gov';

  async searchFilings(politician: SimplePolitician, year: number): Promise<FilingResult[]> {
    const startDate = `01/01/${year}`;
    const endDate = `12/31/${year}`;
    
    const url = `${this.baseUrl}/search/report/data/?` +
      `submitted_start_date=${encodeURIComponent(startDate)}&` +
      `submitted_end_date=${encodeURIComponent(endDate)}&` +
      `report_types=["ptr"]&` +
      `Senator=${encodeURIComponent(politician.lastName)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const filings: FilingResult[] = [];
      
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.pdf_url) {
            // Extract filing ID from URL or use a generated one
            const idMatch = item.pdf_url.match(/\/(\d+)\.pdf/);
            const filing_id = idMatch ? idMatch[1] : `senate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            filings.push({
              filing_id,
              pdf_url: item.pdf_url,
              year,
              politician
            });
          }
        }
      }
      
      return filings;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const houseScraper = new HouseScraper();
export const senateScraper = new SenateScraper();
