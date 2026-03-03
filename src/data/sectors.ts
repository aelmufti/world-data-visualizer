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
    label: "Énergie",
    icon: "⚡",
    color: "#F59E0B",
    macro: ["Prix WTI", "Prix Brent", "Gaz naturel", "Décisions OPEP", "Transition énergétique"],
    indicators: [
      { label: "WTI Crude", value: "$82.4", delta: "+1.8%", up: true },
      { label: "Brent", value: "$85.1", delta: "+1.5%", up: true },
      { label: "Gaz Naturel", value: "$2.61", delta: "-0.4%", up: false },
      { label: "Uranium", value: "$92/lb", delta: "+18%", up: true },
      { label: "Charbon", value: "$142/t", delta: "-12%", up: false },
      { label: "Éthanol", value: "$2.18/gal", delta: "+3%", up: true },
    ],
  },
  {
    id: "tech",
    label: "Technologie",
    icon: "💻",
    color: "#6366F1",
    macro: ["Taux Fed", "Régulation IA", "Semi-conducteurs", "Cloud", "Cybersécurité"],
    indicators: [
      { label: "Nasdaq 100", value: "18,420", delta: "+1.8%", up: true },
      { label: "Sox Index", value: "4,812", delta: "+2.1%", up: true },
      { label: "VIX Tech", value: "18.2", delta: "-2.1", up: true },
    ],
  },
  {
    id: "sante",
    label: "Santé",
    icon: "🏥",
    color: "#10B981",
    macro: ["Approbations FDA", "Brevets", "Politiques remboursement", "Essais cliniques", "Vieillissement"],
    indicators: [
      { label: "Biotech Index", value: "5,240", delta: "+2.8%", up: true },
      { label: "Healthcare ETF", value: "$142", delta: "+1.2%", up: true },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "🏦",
    color: "#8B5CF6",
    macro: ["Taux directeurs", "Courbe des taux", "Régulation bancaire", "Crédit", "Crypto", "M&A"],
    indicators: [
      { label: "VIX", value: "14.2", delta: "-1.8", up: true },
      { label: "Bitcoin", value: "$68.4K", delta: "+8%", up: true },
      { label: "Taux 10 ans", value: "4.31%", delta: "-0.05%", up: true },
      { label: "S&P 500", value: "5,420", delta: "+0.8%", up: true },
    ],
  },
  {
    id: "consommation",
    label: "Consommation",
    icon: "🛒",
    color: "#EF4444",
    macro: ["Confiance consommateur", "Inflation", "Emploi", "E-commerce", "Salaires"],
    indicators: [
      { label: "Consumer Disc", value: "$182", delta: "+1.2%", up: true },
      { label: "Consumer Staples", value: "$78", delta: "+0.4%", up: true },
      { label: "Retail ETF", value: "$68", delta: "+2.1%", up: true },
    ],
  },
  {
    id: "immobilier",
    label: "Immobilier",
    icon: "🏢",
    color: "#06B6D4",
    macro: ["Taux hypothécaires", "Construction", "Prix immobilier", "Bureaux", "Logistique"],
    indicators: [
      { label: "REIT Index", value: "$92", delta: "+1.2%", up: true },
      { label: "Home Builders", value: "$84", delta: "+2.8%", up: true },
    ],
  },
  {
    id: "materiaux",
    label: "Matériaux",
    icon: "⛏️",
    color: "#78716C",
    macro: ["Prix métaux", "Demande construction", "Chine", "Inventaires", "Transition verte"],
    indicators: [
      { label: "Cuivre", value: "$8,420/t", delta: "+3.2%", up: true },
      { label: "Acier", value: "$620/t", delta: "-1.8%", up: false },
      { label: "Aluminium", value: "$2,340/t", delta: "+2.8%", up: true },
      { label: "Lithium", value: "$14.2K/t", delta: "-42%", up: false },
      { label: "Or", value: "$2,180/oz", delta: "+1.2%", up: true },
      { label: "Argent", value: "$24.8/oz", delta: "+2.4%", up: true },
    ],
  },
  {
    id: "telecom",
    label: "Télécoms",
    icon: "📡",
    color: "#EC4899",
    macro: ["Déploiement 5G", "Régulation", "Consolidation", "ARPU", "Fibre optique"],
    indicators: [
      { label: "Telecom ETF", value: "$92", delta: "+0.8%", up: true },
      { label: "5G ETF", value: "$18", delta: "+1.2%", up: true },
    ],
  },
  {
    id: "industrie",
    label: "Industrie",
    icon: "🏭",
    color: "#F97316",
    macro: ["PMI Manufacturier", "Supply Chain", "Défense", "Infrastructure", "Automatisation"],
    indicators: [
      { label: "Industrial ETF", value: "$118", delta: "+1.4%", up: true },
      { label: "Aerospace", value: "$142", delta: "+2.1%", up: true },
      { label: "Defense", value: "$142", delta: "+2.1%", up: true },
    ],
  },
  {
    id: "services",
    label: "Services Publics",
    icon: "🌊",
    color: "#14B8A6",
    macro: ["Taux d'intérêt", "Transition énergétique", "Régulation tarifaire", "Subventions", "Smart Grid"],
    indicators: [
      { label: "Utilities ETF", value: "$68", delta: "+0.4%", up: true },
      { label: "Clean Energy", value: "$22", delta: "+3.2%", up: true },
    ],
  },
  {
    id: "transport",
    label: "Transport",
    icon: "✈️",
    color: "#3B82F6",
    macro: ["Prix carburant", "Trafic passagers", "Fret maritime", "E-commerce", "Véhicules électriques"],
    indicators: [
      { label: "Airlines ETF", value: "$24", delta: "+1.8%", up: true },
      { label: "Shipping", value: "$18", delta: "-2.1%", up: false },
      { label: "EV ETF", value: "$28", delta: "+4.2%", up: true },
    ],
  },
]
