export interface Stock {
  ticker: string
  name: string
  shares: number
  buy: number
  price: number
  change: number
}

export interface Indicator {
  label: string
  value: string
  delta: string
  up: boolean | null
}

export interface Sector {
  id: string
  label: string
  icon: string
  color: string
  macro: string[]
  stocks: Stock[]
  indicators: Indicator[]
}

export const SECTORS: Sector[] = [
  {
    id: "energie",
    label: "Énergie",
    icon: "⚡",
    color: "#F59E0B",
    macro: ["Prix WTI", "Prix Brent", "Gaz naturel", "Décisions OPEP"],
    stocks: [
      { ticker: "TTE", name: "TotalEnergies", shares: 40, buy: 52.3, price: 58.1, change: +1.2 },
      { ticker: "XOM", name: "ExxonMobil", shares: 15, buy: 98.5, price: 112.4, change: -0.8 },
      { ticker: "CVX", name: "Chevron", shares: 10, buy: 145.0, price: 157.3, change: +0.4 },
    ],
    indicators: [
      { label: "WTI Crude", value: "$82.4", delta: "+1.8%", up: true },
      { label: "Brent", value: "$85.1", delta: "+1.5%", up: true },
      { label: "Gaz Naturel", value: "$2.61", delta: "-0.4%", up: false },
      { label: "OPEP Output", value: "26.8 Mb/j", delta: "stable", up: null },
    ],
  },
  {
    id: "tech",
    label: "Technologie",
    icon: "💻",
    color: "#6366F1",
    macro: ["Taux Fed", "Régulation IA", "Semi-conducteurs", "Cloud"],
    stocks: [
      { ticker: "NVDA", name: "Nvidia", shares: 8, buy: 420.0, price: 875.0, change: +3.1 },
      { ticker: "MSFT", name: "Microsoft", shares: 12, buy: 310.0, price: 415.2, change: +0.9 },
      { ticker: "ASML", name: "ASML", shares: 5, buy: 620.0, price: 780.5, change: -1.2 },
    ],
    indicators: [
      { label: "Taux Fed", value: "5.25%", delta: "stable", up: null },
      { label: "Sox Index", value: "4,812", delta: "+2.1%", up: true },
      { label: "Cloud Growth", value: "+28%", delta: "YoY", up: true },
      { label: "IA Investiss.", value: "$180Bn", delta: "+42%", up: true },
    ],
  },
  {
    id: "sante",
    label: "Santé",
    icon: "🏥",
    color: "#10B981",
    macro: ["Approbations FDA", "Brevets", "Politiques remboursement", "Essais cliniques"],
    stocks: [
      { ticker: "JNJ", name: "Johnson & Johnson", shares: 20, buy: 155.0, price: 162.3, change: +0.3 },
      { ticker: "NVO", name: "Novo Nordisk", shares: 18, buy: 78.0, price: 105.6, change: +2.4 },
      { ticker: "SAN", name: "Sanofi", shares: 25, buy: 88.0, price: 92.1, change: -0.5 },
    ],
    indicators: [
      { label: "FDA Approvals", value: "52", delta: "+8 YoY", up: true },
      { label: "R&D Dépenses", value: "$238Bn", delta: "+5%", up: true },
      { label: "GLP-1 Marché", value: "$36Bn", delta: "+120%", up: true },
      { label: "Brevets exp.", value: "18", delta: "2024-25", up: false },
    ],
  },
  {
    id: "telecom",
    label: "Télécoms",
    icon: "📡",
    color: "#EC4899",
    macro: ["Déploiement 5G", "Régulation", "Consolidation", "ARPU"],
    stocks: [
      { ticker: "VIV", name: "Vivendi", shares: 50, buy: 9.8, price: 10.2, change: +0.6 },
      { ticker: "T", name: "AT&T", shares: 80, buy: 17.5, price: 16.8, change: -1.1 },
      { ticker: "DTE", name: "Deutsche Telekom", shares: 30, buy: 21.0, price: 24.3, change: +0.8 },
    ],
    indicators: [
      { label: "5G Coverage", value: "68%", delta: "+12% YoY", up: true },
      { label: "ARPU Moyen", value: "$48.2", delta: "+3%", up: true },
      { label: "Churn Rate", value: "1.8%", delta: "-0.2%", up: true },
      { label: "Spectrum prix", value: "$2.1Bn", delta: "enchères", up: null },
    ],
  },
  {
    id: "industrie",
    label: "Industrie",
    icon: "🏭",
    color: "#F97316",
    macro: ["PMI Manufacturier", "Supply Chain", "Défense", "Infrastructure"],
    stocks: [
      { ticker: "AIR", name: "Airbus", shares: 12, buy: 125.0, price: 168.4, change: +1.5 },
      { ticker: "HON", name: "Honeywell", shares: 8, buy: 195.0, price: 210.8, change: +0.7 },
      { ticker: "CAT", name: "Caterpillar", shares: 6, buy: 220.0, price: 345.2, change: -0.3 },
    ],
    indicators: [
      { label: "PMI Global", value: "51.2", delta: "+0.8", up: true },
      { label: "Budget Défense", value: "$2.2T", delta: "+8% NATO", up: true },
      { label: "Backlog Airbus", value: "8,598", delta: "avions", up: true },
      { label: "Freight Index", value: "1,842", delta: "-2%", up: false },
    ],
  },
  {
    id: "services",
    label: "Services Publics",
    icon: "🌊",
    color: "#14B8A6",
    macro: ["Taux d'intérêt", "Transition énergétique", "Régulation tarifaire", "Subventions"],
    stocks: [
      { ticker: "ENGI", name: "Engie", shares: 60, buy: 13.5, price: 14.8, change: +0.4 },
      { ticker: "NEE", name: "NextEra Energy", shares: 20, buy: 62.0, price: 58.4, change: -1.8 },
      { ticker: "EDF", name: "EDF", shares: 35, buy: 11.0, price: 12.3, change: +0.9 },
    ],
    indicators: [
      { label: "Taux 10 ans", value: "4.31%", delta: "-0.05%", up: true },
      { label: "Capa. Renouv.", value: "3.2 TW", delta: "+18%", up: true },
      { label: "Prix Élec. EU", value: "€95/MWh", delta: "-8%", up: true },
      { label: "Subventions IRA", value: "$369Bn", delta: "US 2024", up: true },
    ],
  },
]
