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
    macro: ["Prix WTI", "Prix Brent", "Gaz naturel", "Décisions OPEP"],
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
    indicators: [
      { label: "FDA Approvals", value: "52", delta: "+8 YoY", up: true },
      { label: "R&D Dépenses", value: "$238Bn", delta: "+5%", up: true },
      { label: "GLP-1 Marché", value: "$36Bn", delta: "+120%", up: true },
      { label: "Brevets exp.", value: "18", delta: "2024-25", up: false },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "🏦",
    color: "#8B5CF6",
    macro: ["Taux directeurs", "Courbe des taux", "Régulation bancaire", "Crédit"],
    indicators: [
      { label: "Taux Fed", value: "5.25%", delta: "stable", up: null },
      { label: "Courbe 2-10Y", value: "+0.42%", delta: "normalisée", up: true },
      { label: "Crédit Corp.", value: "$12.8T", delta: "+4%", up: true },
      { label: "NPL Ratio", value: "1.2%", delta: "stable", up: null },
    ],
  },
  {
    id: "consommation",
    label: "Consommation",
    icon: "🛒",
    color: "#EF4444",
    macro: ["Confiance consommateur", "Inflation", "Emploi", "E-commerce"],
    indicators: [
      { label: "Conf. Conso.", value: "102.6", delta: "+2.8", up: true },
      { label: "Inflation", value: "3.2%", delta: "-0.4%", up: true },
      { label: "Taux chômage", value: "3.8%", delta: "stable", up: null },
      { label: "E-commerce", value: "16.2%", delta: "+8% YoY", up: true },
    ],
  },
  {
    id: "immobilier",
    label: "Immobilier",
    icon: "🏢",
    color: "#06B6D4",
    macro: ["Taux hypothécaires", "Construction", "Prix immobilier", "Bureaux"],
    indicators: [
      { label: "Taux 30 ans", value: "6.82%", delta: "-0.15%", up: true },
      { label: "Mises en chantier", value: "1.42M", delta: "+8%", up: true },
      { label: "Prix médian", value: "$412K", delta: "+2.1%", up: true },
      { label: "Taux vacance", value: "13.2%", delta: "bureaux", up: false },
    ],
  },
  {
    id: "materiaux",
    label: "Matériaux",
    icon: "⛏️",
    color: "#78716C",
    macro: ["Prix métaux", "Demande construction", "Chine", "Inventaires"],
    indicators: [
      { label: "Cuivre", value: "$8,420/t", delta: "+3.2%", up: true },
      { label: "Acier", value: "$620/t", delta: "-1.8%", up: false },
      { label: "Lithium", value: "$14.2K/t", delta: "-42%", up: false },
      { label: "PMI Chine", value: "50.8", delta: "+0.6", up: true },
    ],
  },
  {
    id: "telecom",
    label: "Télécoms",
    icon: "📡",
    color: "#EC4899",
    macro: ["Déploiement 5G", "Régulation", "Consolidation", "ARPU"],
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
    indicators: [
      { label: "Taux 10 ans", value: "4.31%", delta: "-0.05%", up: true },
      { label: "Capa. Renouv.", value: "3.2 TW", delta: "+18%", up: true },
      { label: "Prix Élec. EU", value: "€95/MWh", delta: "-8%", up: true },
      { label: "Subventions IRA", value: "$369Bn", delta: "US 2024", up: true },
    ],
  },
  {
    id: "transport",
    label: "Transport",
    icon: "✈️",
    color: "#3B82F6",
    macro: ["Prix carburant", "Trafic passagers", "Fret maritime", "E-commerce"],
    indicators: [
      { label: "Jet Fuel", value: "$2.84/gal", delta: "+2.1%", up: false },
      { label: "Trafic aérien", value: "98%", delta: "vs 2019", up: true },
      { label: "Baltic Dry", value: "1,842", delta: "-8%", up: false },
      { label: "Livraisons", value: "+12%", delta: "e-commerce", up: true },
    ],
  },
]
