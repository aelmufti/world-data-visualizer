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
  indicators: Indicator[]
}

export const SECTORS: Sector[] = [
  {
    id: "energie",
    label: "Energy",
    icon: "⚡",
    color: "#F59E0B",
    macro: ["WTI Price", "Brent Price", "Natural Gas", "OPEC Decisions", "Energy Transition"],
    indicators: [
      { label: "WTI Crude", value: "$82.4", delta: "+1.8%", up: true },
      { label: "Brent", value: "$85.1", delta: "+1.5%", up: true },
      { label: "Natural Gas", value: "$2.61", delta: "-0.4%", up: false },
      { label: "Uranium", value: "$92/lb", delta: "+18%", up: true },
      { label: "Coal", value: "$142/t", delta: "-12%", up: false },
      { label: "Ethanol", value: "$2.18/gal", delta: "+3%", up: true },
    ],
  },
  {
    id: "tech",
    label: "Technology",
    icon: "💻",
    color: "#6366F1",
    macro: ["Fed Rates", "AI Regulation", "Semiconductors", "Cloud", "Cybersecurity"],
    indicators: [
      { label: "Nasdaq 100", value: "18,420", delta: "+1.8%", up: true },
      { label: "Sox Index", value: "4,812", delta: "+2.1%", up: true },
      { label: "VIX Tech", value: "18.2", delta: "-2.1", up: true },
    ],
  },
  {
    id: "sante",
    label: "Healthcare",
    icon: "🏥",
    color: "#10B981",
    macro: ["FDA Approvals", "Patents", "Reimbursement Policies", "Clinical Trials", "Aging Population"],
    indicators: [
      { label: "Biotech Index", value: "5,240", delta: "+2.8%", up: true },
      { label: "Healthcare ETF", value: "$142", delta: "+1.2%", up: true },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "🏦",
    color: "#3B82F6",
    macro: ["Interest Rates", "Yield Curve", "Banking Regulation", "Credit", "Crypto", "M&A"],
    indicators: [
      { label: "VIX", value: "14.2", delta: "-1.8", up: true },
      { label: "Bitcoin", value: "$68.4K", delta: "+8%", up: true },
      { label: "10Y Yield", value: "4.31%", delta: "-0.05%", up: true },
      { label: "S&P 500", value: "5,420", delta: "+0.8%", up: true },
    ],
  },
  {
    id: "consommation",
    label: "Consumer",
    icon: "🛒",
    color: "#EF4444",
    macro: ["Consumer Confidence", "Inflation", "Employment", "E-commerce", "Wages"],
    indicators: [
      { label: "Consumer Disc", value: "$182", delta: "+1.2%", up: true },
      { label: "Consumer Staples", value: "$78", delta: "+0.4%", up: true },
      { label: "Retail ETF", value: "$68", delta: "+2.1%", up: true },
    ],
  },
  {
    id: "immobilier",
    label: "Real Estate",
    icon: "🏢",
    color: "#06B6D4",
    macro: ["Mortgage Rates", "Construction", "Home Prices", "Office Space", "Logistics"],
    indicators: [
      { label: "REIT Index", value: "$92", delta: "+1.2%", up: true },
      { label: "Home Builders", value: "$84", delta: "+2.8%", up: true },
    ],
  },
  {
    id: "materiaux",
    label: "Materials",
    icon: "⛏️",
    color: "#78716C",
    macro: ["Metal Prices", "Construction Demand", "China", "Inventories", "Green Transition"],
    indicators: [
      { label: "Copper", value: "$8,420/t", delta: "+3.2%", up: true },
      { label: "Steel", value: "$620/t", delta: "-1.8%", up: false },
      { label: "Aluminum", value: "$2,340/t", delta: "+2.8%", up: true },
      { label: "Lithium", value: "$14.2K/t", delta: "-42%", up: false },
      { label: "Gold", value: "$2,180/oz", delta: "+1.2%", up: true },
      { label: "Silver", value: "$24.8/oz", delta: "+2.4%", up: true },
    ],
  },
  {
    id: "telecom",
    label: "Telecom",
    icon: "📡",
    color: "#EC4899",
    macro: ["5G Rollout", "Regulation", "Consolidation", "ARPU", "Fiber Optic"],
    indicators: [
      { label: "Telecom ETF", value: "$92", delta: "+0.8%", up: true },
      { label: "5G ETF", value: "$18", delta: "+1.2%", up: true },
    ],
  },
  {
    id: "industrie",
    label: "Industrial",
    icon: "🏭",
    color: "#F97316",
    macro: ["Manufacturing PMI", "Supply Chain", "Defense", "Infrastructure", "Automation"],
    indicators: [
      { label: "Industrial ETF", value: "$118", delta: "+1.4%", up: true },
      { label: "Aerospace", value: "$142", delta: "+2.1%", up: true },
      { label: "Defense", value: "$142", delta: "+2.1%", up: true },
    ],
  },
  {
    id: "services",
    label: "Utilities",
    icon: "🌊",
    color: "#14B8A6",
    macro: ["Interest Rates", "Energy Transition", "Rate Regulation", "Subsidies", "Smart Grid"],
    indicators: [
      { label: "Utilities ETF", value: "$68", delta: "+0.4%", up: true },
      { label: "Clean Energy", value: "$22", delta: "+3.2%", up: true },
    ],
  },
  {
    id: "transport",
    label: "Transportation",
    icon: "✈️",
    color: "#3B82F6",
    macro: ["Fuel Prices", "Passenger Traffic", "Maritime Freight", "E-commerce", "Electric Vehicles"],
    indicators: [
      { label: "Airlines ETF", value: "$24", delta: "+1.8%", up: true },
      { label: "Shipping", value: "$18", delta: "-2.1%", up: false },
      { label: "EV ETF", value: "$28", delta: "+4.2%", up: true },
    ],
  },
]
