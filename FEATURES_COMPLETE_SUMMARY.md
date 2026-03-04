# 📊 Résumé Complet des Features - Market Intelligence Platform

**Date**: 3 mars 2026  
**Version**: 1.0.0  
**Stack**: React + TypeScript + Node.js + Express + Firebase/Firestore

---

## 🎯 Vue d'Ensemble du Projet

Cette plateforme d'intelligence de marché combine analyse sectorielle en temps réel, agrégation d'actualités multi-sources, données de marché live, et suivi AIS des navires pétroliers. Elle offre une interface moderne avec navigation unifiée et analyse IA.

### Architecture Globale

```
Frontend (React + Vite)
├── Navbar commune (navigation)
├── Analyse Sectorielle (11 secteurs)
├── Panel Actualités IA (agrégation multi-sources)
├── Données de Marché (Yahoo Finance)
└── Carte AIS Interactive (suivi navires)

Backend (Node.js + Express)
├── API REST (port 8000)
├── Agrégateur d'actualités RSS
├── Proxy WebSocket AIS
├── Service données de marché
└── Firebase/Firestore (base de données)
```

---

## 📋 TABLE DES MATIÈRES

1. [Navigation et Interface](#1-navigation-et-interface)
2. [Analyse Sectorielle](#2-analyse-sectorielle)
3. [Agrégation d'Actualités Multi-Sources](#3-agrégation-dactualités-multi-sources)
4. [Données de Marché en Temps Réel](#4-données-de-marché-en-temps-réel)
5. [Suivi AIS des Navires](#5-suivi-ais-des-navires)
6. [Intelligence Artificielle](#6-intelligence-artificielle)
7. [Backend et API](#7-backend-et-api)
8. [Base de Données Firebase](#8-base-de-données-firebase)
9. [Sécurité et Configuration](#9-sécurité-et-configuration)
10. [Performance et Optimisation](#10-performance-et-optimisation)

---


## 1. NAVIGATION ET INTERFACE

### 1.1 Navbar Commune (Nouveau - Mars 2026)

**Fichier**: `src/components/Navbar.tsx`

**Description**: Barre de navigation unifiée en haut de l'application avec design glassmorphism et animations fluides.

**Implémentation**:
```typescript
interface NavbarProps {
  activeSection?: 'sectorial' | 'portfolio' | 'alerts' | 'settings'
}

// Composant avec 4 sections de navigation
const navItems = [
  { id: 'sectorial', label: 'Analyse Sectorielle', icon: '📊' },
  { id: 'portfolio', label: 'Portfolio', icon: '💼' },
  { id: 'alerts', label: 'Alertes', icon: '🔔' },
  { id: 'settings', label: 'Paramètres', icon: '⚙️' }
]
```

**Features**:
- Logo "Market Intelligence" avec gradient bleu-violet
- Navigation avec 4 sections (Analyse Sectorielle active par défaut)
- Indicateur de statut "LIVE" avec animation pulse
- Avatar utilisateur
- Effets hover avec transitions fluides
- Point lumineux bleu sur la section active
- Design sticky (reste en haut lors du scroll)
- Backdrop blur pour effet glassmorphism

**Intégration**:
```typescript
// Dans App.tsx
<div style={{ display: "flex", flexDirection: "column" }}>
  <Navbar activeSection="sectorial" />
  <div style={{ display: "flex", flex: 1 }}>
    {/* Sidebar + Contenu */}
  </div>
</div>
```

**Styling**:
- Hauteur: 64px
- Background: `rgba(8,14,26,0.95)` avec blur
- Border bottom: `1px solid rgba(255,255,255,0.08)`
- Z-index: 1000 (au-dessus de tout)

---


## 2. ANALYSE SECTORIELLE

### 2.1 Vue d'Ensemble

**Fichier**: `src/App.tsx`

**Description**: Interface principale permettant d'analyser 11 secteurs économiques avec indicateurs macro, actualités IA, et alertes personnalisées.

**Secteurs Couverts**:
1. ⚡ Énergie (WTI, Brent, Gaz, Uranium, Charbon, Éthanol)
2. 💻 Technologie (Nasdaq 100, Sox Index, VIX Tech)
3. 🏥 Santé (Biotech Index, Healthcare ETF)
4. 🏦 Finance (VIX, Bitcoin, Taux 10 ans, S&P 500)
5. 🛒 Consommation (Consumer Disc, Consumer Staples, Retail ETF)
6. 🏢 Immobilier (REIT Index, Home Builders)
7. ⛏️ Matériaux (Cuivre, Acier, Aluminium, Lithium, Or, Argent)
8. 📡 Télécoms (Telecom ETF, 5G ETF)
9. 🏭 Industrie (Industrial ETF, Aerospace, Defense)
10. 🌊 Services Publics (Utilities ETF, Clean Energy)
11. ✈️ Transport (Airlines ETF, Shipping, EV ETF)

### 2.2 Structure des Données

**Fichier**: `src/data/sectors.ts`

```typescript
export interface Indicator {
  label: string      // "WTI Crude"
  value: string      // "$82.4"
  delta: string      // "+1.8%"
  up: boolean | null // true/false/null
}

export interface Sector {
  id: string         // "energie"
  label: string      // "Énergie"
  icon: string       // "⚡"
  color: string      // "#F59E0B"
  macro: string[]    // ["Prix WTI", "Prix Brent", ...]
  indicators: Indicator[]
}
```

### 2.3 Framework d'Analyse Causale

**Fichier**: `src/data/sectorAnalysisFramework.ts` (1421 lignes)

**Description**: Framework complet d'analyse basé sur les chaînes de causalité pour chaque secteur.

**Structure par Secteur**:
```typescript
interface SectorFramework {
  id: string
  label: string
  criticalNodes: string[]           // Points critiques (Détroit d'Ormuz, etc.)
  supplyDemandDrivers: {
    supply: string[]                // Facteurs d'offre
    demand: string[]                // Facteurs de demande
  }
  keyIndicators: string[]           // Indicateurs clés à surveiller
  geographicRisks: string[]         // Risques géographiques
  structuralFactors: string[]       // Facteurs structurels long terme
  correlations: {
    positive: string[]              // Corrélations positives
    negative: string[]              // Corrélations négatives
  }
}
```

**Exemple - Secteur Énergie**:
```typescript
energie: {
  criticalNodes: [
    "Détroit d'Ormuz (20% du pétrole mondial)",
    "Canal de Suez",
    "Décisions OPEP+",
    "Golfe du Mexique (production US)"
  ],
  supplyDemandDrivers: {
    supply: [
      "Production OPEP+",
      "Shale oil américain",
      "Tensions géopolitiques Moyen-Orient",
      "Catastrophes naturelles (ouragans)"
    ],
    demand: [
      "Croissance économique Chine/Inde",
      "Transition énergétique",
      "Saison (hiver/été)",
      "Trafic aérien"
    ]
  },
  keyIndicators: [
    "Prix WTI et Brent",
    "Stocks stratégiques US (EIA)",
    "Taux d'utilisation des raffineries",
    "Rig count (nombre de forages)"
  ]
}
```

**Utilisation**: Ce framework alimente l'IA pour générer des analyses contextuelles pertinentes.

---


## 3. AGRÉGATION D'ACTUALITÉS MULTI-SOURCES

### 3.1 Système d'Agrégation Intelligent

**Fichier**: `server/src/aggregator.ts` (600+ lignes)

**Description**: Système avancé d'agrégation d'actualités avec scoring de pertinence, déduplication et filtrage intelligent.

### 3.2 Sources RSS (20 sources)

**Fichier**: `server/src/rss-worker.ts`

**Sources Configurées**:
1. Reuters Business
2. Yahoo Finance
3. MarketWatch
4. Seeking Alpha
5. CNBC
6. Bloomberg
7. Financial Times
8. The Wall Street Journal
9. Barrons
10. Investor's Business Daily
11. Forbes Markets
12. Business Insider
13. TechCrunch
14. The Verge
15. Ars Technica
16. VentureBeat
17. BioPharma Dive
18. FiercePharma
19. Oil Price
20. Renewable Energy World

**Implémentation**:
```typescript
async fetchRSSFeed(source) {
  const response = await axios.get(source.url, { timeout: 10000 })
  const parsed = await parseStringPromise(response.data)
  const items = parsed.rss?.channel?.[0]?.item || []
  
  return items.map(item => ({
    title: item.title[0],
    body: item.description[0],
    url: item.link[0],
    publishedAt: new Date(item.pubDate[0]),
    sourceDomain: source.domain
  }))
}
```

### 3.3 Système de Scoring (5 Améliorations Critiques)

**Fichier**: `server/SCORING_METHODOLOGY.md` + `server/SCORING_IMPROVEMENTS.md`

#### 3.3.1 Score de Pertinence (0-10)

**Algorithme avec Position Weighting**:
```typescript
scoreSectorRelevance(title: string, body: string, sector: string): number {
  const keywords = SECTOR_KEYWORDS[sector]
  
  // Extraire lead (150 premiers mots)
  const words = body.split(/\s+/)
  const lead = words.slice(0, 150).join(' ')
  const rest = words.slice(150).join(' ')
  
  // Compter les matches avec word-boundary
  let titleMatches = 0
  let leadMatches = 0
  let bodyMatches = 0
  
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(title)) titleMatches++
    if (regex.test(lead)) leadMatches++
    if (regex.test(rest)) bodyMatches++
  }
  
  // Position weighting: titre ×2.0, lead ×1.5, body ×1.0
  const weightedMatches = (titleMatches * 2.0) + (leadMatches * 1.5) + (bodyMatches * 1.0)
  
  // Courbe logarithmique (évite le plafonnement)
  const score = 10 * (1 - Math.exp(-weightedMatches * 0.4))
  
  return score
}
```

**Exemple**:
- Article: "Apple launches iPhone 17e with M4 chip"
- Titre: 3 keywords (Apple, iPhone, chip) × 2.0 = 6.0
- Lead: 2 keywords (M4, iPad) × 1.5 = 3.0
- Weighted: 9.0
- Score: 10 × (1 - e^(-9.0 × 0.4)) = 9.8/10

#### 3.3.2 Score d'Importance (1-10)

**Basé sur le type d'événement**:
```typescript
const EVENT_IMPORTANCE = {
  merger_acquisition: 10,      // M&A
  regulatory_action: 9,         // Régulation
  earnings_beat: 8,             // Résultats supérieurs
  earnings_miss: 8,             // Résultats inférieurs
  government_contract: 7,       // Contrat gouvernemental
  layoffs: 7,                   // Licenciements
  lawsuit: 7,                   // Procès
  partnership: 6,               // Partenariat
  product_launch: 6,            // Lancement produit
  analyst_upgrade: 6,           // Upgrade analyste
  analyst_downgrade: 6,         // Downgrade analyste
  executive_change: 5,          // Changement direction
  share_buyback: 5,             // Rachat d'actions
  dividend_change: 4,           // Changement dividende
  insider_trading: 4,           // Trading initié
  sec_filing: 3,                // Dépôt SEC
  default: 3                    // Par défaut
}
```

#### 3.3.3 Score de Sentiment (0-10)

**Direction préservée**:
```typescript
// AVANT (incorrect): Math.abs(rawSentiment) * 10
// -0.9 (très négatif) = 9 points ❌
// +0.9 (très positif) = 9 points ❌

// APRÈS (correct):
const sentimentScore = ((rawSentiment + 1) / 2) * 10
// -1.0 (très négatif) → 0 points ✅
//  0.0 (neutre) → 5 points ✅
// +1.0 (très positif) → 10 points ✅
```

#### 3.3.4 Recency Decay

**Half-life de 4.6 heures**:
```typescript
const ageInHours = (Date.now() - publishedAt) / 3600000
const decayFactor = Math.exp(-0.15 * ageInHours)

// 0h (maintenant) = 100% du score
// 4.6h = 50% du score
// 9.2h = 25% du score
// 24h = 2% du score
```

#### 3.3.5 Score Final

**Formule de pondération**:
```typescript
const baseScore = (relevanceScore * 0.6) + (importanceScore * 0.3) + (sentimentScore * 0.1)
const finalScore = baseScore * decayFactor
```

### 3.4 Mots-Clés par Secteur (Enrichis)

**Technology** (70+ keywords):
```
AI, artificial intelligence, software, cloud, semiconductor, chip, tech, 
digital, cyber, data, algorithm, platform, app, Apple, Microsoft, Google, 
Amazon, Meta, Tesla, Nvidia, Intel, iPhone, iPad, Android, Windows, AWS, 
Azure, OpenAI, ChatGPT, machine learning, neural network, automation, 
API, developer, coding, programming, database, server, processor, GPU, 
CPU, internet, web, online, digital transformation, IT, technology
```

**Energy** (40+ keywords):
```
oil, gas, energy, renewable, solar, wind, electric, battery, power, fuel, 
petroleum, coal, nuclear, grid, utility, carbon, emission, clean energy, 
EV, electric vehicle, Exxon, Chevron, BP, Shell, TotalEnergies, 
ConocoPhillips, crude, barrel, OPEC, drilling, refinery, pipeline, 
fracking, natural gas, LNG, hydrogen, biofuel, ethanol, climate, green 
energy, sustainability, decarbonization, net zero
```

**Finance** (60+ keywords):
```
bank, financial, investment, trading, stock, bond, credit, loan, mortgage, 
insurance, fintech, payment, crypto, bitcoin, blockchain, fund, asset 
management, wealth, capital, IPO, JPMorgan, Goldman, Morgan Stanley, 
Citigroup, Wells Fargo, BofA, Fed, Federal Reserve, interest rate, 
inflation, recession, GDP, earnings, revenue, profit, loss, dividend, 
share, equity, debt, treasury, yield, market, Wall Street, S&P, Dow, 
Nasdaq, investor, portfolio, hedge fund, private equity, venture capital, 
valuation, acquisition, merger, M&A, deal, transaction
```

### 3.5 Résultats Actuels

**Performance**:
- Articles récupérés par cycle: 111
- Articles passant le filtre: 30-35 (30% acceptance rate)
- Faux positifs: ~10% (réduit de 75% après fixes)
- Temps d'agrégation: < 100ms

**Distribution par Secteur**:
- Technology: 15 articles (score moyen ~7.0)
- Finance: 10 articles (score moyen ~6.5)
- Energy: 10 articles (score moyen ~6.0)
- Consumer: 8 articles
- Industrial: 6 articles
- Materials: 5 articles
- Telecom: 4 articles
- Healthcare: 4 articles
- Real Estate: 3 articles
- Utilities: 2 articles

---


## 4. DONNÉES DE MARCHÉ EN TEMPS RÉEL

### 4.1 Service de Données de Marché

**Fichier**: `server/src/market-data.ts`

**Description**: Service récupérant les cours en temps réel depuis Yahoo Finance pour tous les indicateurs macro.

### 4.2 Symboles Yahoo Finance par Secteur

**Mapping complet**:
```typescript
const MACRO_SYMBOLS: Record<string, Record<string, string>> = {
  energie: {
    'WTI Crude': 'CL=F',        // Futures pétrole WTI
    'Brent': 'BZ=F',            // Futures pétrole Brent
    'Gaz Naturel': 'NG=F',      // Futures gaz naturel
    'Uranium': 'URA',           // Global X Uranium ETF
    'Charbon': 'KOL',           // VanEck Coal ETF
    'Éthanol': 'CORN'           // Corn futures (proxy)
  },
  tech: {
    'Nasdaq 100': '^NDX',       // Indice Nasdaq 100
    'Sox Index': '^SOX',        // Indice semi-conducteurs
    'VIX Tech': '^VXN'          // Nasdaq VIX
  },
  finance: {
    'VIX': '^VIX',              // Indice de volatilité
    'Bitcoin': 'BTC-USD',       // Bitcoin en USD
    'Taux 10 ans': '^TNX',      // Treasury 10 ans
    'S&P 500': '^GSPC'          // Indice S&P 500
  },
  // ... 8 autres secteurs
}
```

### 4.3 Implémentation du Service

```typescript
class MarketDataService {
  private cache: Map<string, { data: YahooQuote; timestamp: number }>
  private cacheDuration = 5 * 60 * 1000 // 5 minutes

  async fetchQuote(symbol: string): Promise<YahooQuote | null> {
    // Vérifier le cache
    const cached = this.cache.get(symbol)
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data
    }

    // Fetch depuis Yahoo Finance v8 API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    const response = await axios.get(url, {
      params: { interval: '1d', range: '5d' },
      timeout: 5000
    })

    const result = response.data?.chart?.result?.[0]
    const meta = result.meta
    
    const currentPrice = meta.regularMarketPrice || meta.previousClose
    const previousClose = meta.previousClose
    const change = currentPrice - previousClose
    const changePercent = (change / previousClose) * 100

    const quote: YahooQuote = {
      symbol,
      regularMarketPrice: currentPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent
    }

    // Mettre en cache
    this.cache.set(symbol, { data: quote, timestamp: Date.now() })
    return quote
  }

  async getMacroIndicators(sectorId: string): Promise<MacroIndicator[]> {
    const symbols = MACRO_SYMBOLS[sectorId]
    const indicators: MacroIndicator[] = []

    for (const [label, symbol] of Object.entries(symbols)) {
      const quote = await this.fetchQuote(symbol)
      
      if (quote) {
        indicators.push({
          label,
          value: this.formatPrice(quote.regularMarketPrice, symbol),
          delta: this.formatChange(quote.regularMarketChangePercent),
          up: quote.regularMarketChange > 0 ? true : 
              quote.regularMarketChange < 0 ? false : null
        })
      }

      // Délai pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return indicators
  }
}
```

### 4.4 Formatage des Prix

```typescript
formatPrice(price: number, symbol: string): string {
  if (symbol.includes('=F')) {
    // Futures: 2 décimales
    return `${price.toFixed(2)}`
  } else if (symbol.includes('-USD')) {
    // Crypto: pas de décimales
    return `${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  } else if (symbol.startsWith('^')) {
    // Indices: 2 décimales avec séparateurs
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  } else {
    // Stocks/ETFs: 2 décimales
    return `${price.toFixed(2)}`
  }
}

formatChange(changePercent: number): string {
  const sign = changePercent >= 0 ? '+' : ''
  return `${sign}${changePercent.toFixed(2)}%`
}
```

### 4.5 Hook Frontend

**Fichier**: `src/hooks/useMarketData.ts`

```typescript
export function useMarketData(sectorId: string) {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMarketData() {
      try {
        setLoading(true)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/market-data/${sectorId}`)
        const data = await response.json()
        setIndicators(data.indicators)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()

    // Refresh toutes les 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [sectorId])

  return { indicators, loading, error }
}
```

### 4.6 Intégration dans l'Interface

```typescript
// Dans App.tsx
const { indicators: realIndicators, loading: loadingMarket } = useMarketData(activeSector.id)

// Affichage
{(realIndicators.length > 0 ? realIndicators : activeSector.indicators).map((ind, i) => (
  <div key={i}>
    <div>{ind.label}</div>
    <div>{ind.value}</div>
    <div style={{ color: ind.up ? "#10B981" : "#EF4444" }}>
      {ind.up ? "▲ " : "▼ "}{ind.delta}
    </div>
  </div>
))}
```

**Features**:
- Cache de 5 minutes par symbole
- Fallback sur données statiques si API échoue
- Timeout de 5 secondes par requête
- Délai de 100ms entre requêtes (rate limiting)
- Refresh automatique toutes les 5 minutes
- Indicateur de chargement

---


## 5. SUIVI AIS DES NAVIRES

### 5.1 Contexte AIS (Automatic Identification System)

**Description**: Système de suivi en temps réel des navires via WebSocket connecté à aisstream.io.

**Fichiers**:
- `src/contexts/AISContext.tsx` - Contexte React global
- `src/components/VesselMap.tsx` - Carte interactive Deck.gl
- `src/components/OilTankerMap.tsx` - Carte Leaflet (legacy)
- `server/src/ais-proxy.ts` - Proxy WebSocket backend

### 5.2 Architecture WebSocket

```
Frontend (React)
    ↓ WebSocket
Backend Proxy (Node.js)
    ↓ WebSocket
aisstream.io API
    ↓ AIS Data
Navires (MMSI, Position, Type, etc.)
```

**Pourquoi un proxy?**
- aisstream.io ne supporte pas les connexions directes depuis le navigateur
- Le proxy backend maintient une connexion partagée
- Tous les clients frontend reçoivent les mêmes données

### 5.3 Contexte AIS Global

**Fichier**: `src/contexts/AISContext.tsx`

```typescript
export interface Vessel {
  mmsi: number          // Identifiant unique du navire
  name: string          // Nom du navire
  lat: number           // Latitude
  lon: number           // Longitude
  speed: number         // Vitesse en nœuds
  course: number        // Cap en degrés
  heading: number       // Direction en degrés
  shipType: string      // Type de navire (Tanker, Cargo, etc.)
  destination?: string  // Destination
  eta?: string          // ETA (Estimated Time of Arrival)
  lastUpdate: number    // Timestamp dernière mise à jour
}

interface AISContextType {
  vessels: Vessel[]     // Liste de tous les navires
  connected: boolean    // Statut de connexion
  vesselCount: number   // Nombre de navires
}

export function AISProvider({ children }: AISProviderProps) {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [connected, setConnected] = useState(false)
  const [shipTypes, setShipTypes] = useState<Map<number, number>>(new Map())

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/ais-stream')

    ws.onopen = () => {
      console.log('✅ AIS WebSocket connected')
      setConnected(true)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      // Gérer ShipStaticData (type de navire)
      if (data.MessageType === "ShipStaticData") {
        const staticData = data.Message.ShipStaticData
        const metadata = data.MetaData
        
        if (staticData.Type !== undefined) {
          setShipTypes(prev => {
            const updated = new Map(prev)
            updated.set(metadata.MMSI, staticData.Type)
            return updated
          })
        }
        return
      }
      
      // Gérer PositionReport (position du navire)
      if (data.MessageType === "PositionReport") {
        const msg = data.Message.PositionReport
        const metadata = data.MetaData
        
        const shipType = shipTypes.get(metadata.MMSI) || metadata.ShipType
        
        const vessel: Vessel = {
          mmsi: metadata.MMSI,
          name: metadata.ShipName || `MMSI ${metadata.MMSI}`,
          lat: msg.Latitude,
          lon: msg.Longitude,
          speed: msg.Sog || 0,
          course: msg.Cog || 0,
          heading: msg.TrueHeading || msg.Cog || 0,
          shipType: shipType ? getShipTypeName(shipType) : "Other",
          destination: metadata.Destination,
          lastUpdate: Date.now()
        }
        
        setVessels(prev => {
          const filtered = prev.filter(v => v.mmsi !== vessel.mmsi)
          const updated = [...filtered, vessel]
          return updated.slice(-20000) // Garder les 20000 plus récents
        })
      }
    }

    ws.onerror = (error) => {
      console.error("❌ AIS WebSocket error:", error)
      setConnected(false)
    }

    ws.onclose = () => {
      console.log('🔌 AIS WebSocket closed')
      setConnected(false)
      // Reconnexion automatique après 5 secondes
      setTimeout(connect, 5000)
    }

    return () => {
      ws.close()
    }
  }, [])

  return (
    <AISContext.Provider value={{ vessels, connected, vesselCount: vessels.length }}>
      {children}
    </AISContext.Provider>
  )
}
```

### 5.4 Types de Navires AIS

**Codes ITU-R M.1371-5**:
```typescript
function getShipTypeName(type: number): string {
  if (type >= 80 && type <= 89) return "Tanker"        // Pétroliers
  if (type >= 70 && type <= 79) return "Cargo Ship"    // Cargos
  if (type >= 60 && type <= 69) return "Passenger"     // Passagers
  if (type >= 40 && type <= 49) return "High Speed Craft"
  if (type >= 30 && type <= 39) return "Fishing"       // Pêche
  if (type === 50) return "Pilot Vessel"               // Pilote
  if (type === 51) return "Search and Rescue"          // SAR
  if (type === 52) return "Tug"                        // Remorqueur
  if (type === 53) return "Port Tender"
  if (type === 54) return "Anti-pollution"
  if (type === 55) return "Law Enforcement"
  if (type === 58) return "Medical Transport"
  if (type === 59) return "Non-combatant Ship"
  return "Other"
}
```

### 5.5 Carte Interactive Deck.gl

**Fichier**: `src/components/VesselMap.tsx`

**Technologies**:
- Deck.gl (visualisation WebGL)
- MapLibre GL (carte de base)
- ScatterplotLayer (points pour navires)

```typescript
export default function VesselMap({ onClose }: VesselMapProps) {
  const { vessels, connected, vesselCount } = useAIS()
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2,
    pitch: 0,
    bearing: 0
  })

  // Filtrer les navires valides
  const validVessels = vessels.filter(v => 
    v && 
    typeof v.lon === 'number' && 
    typeof v.lat === 'number' &&
    !isNaN(v.lon) && 
    !isNaN(v.lat) &&
    v.lon >= -180 && v.lon <= 180 &&
    v.lat >= -90 && v.lat <= 90
  )

  // Créer la couche de points
  const layers = [
    new ScatterplotLayer({
      id: 'vessels-scatter',
      data: validVessels,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 5,
      radiusMaxPixels: 15,
      lineWidthMinPixels: 1,
      getPosition: (d: any) => [d.lon, d.lat],
      getRadius: 100,
      getFillColor: (d: any) => {
        // Couleur selon le type
        if (d.shipType.includes('Tanker')) return [239, 68, 68, 255]  // Rouge
        if (d.shipType.includes('Cargo')) return [59, 130, 246, 255]  // Bleu
        if (d.shipType.includes('Passenger')) return [34, 197, 94, 255] // Vert
        return [156, 163, 175, 255] // Gris
      },
      getLineColor: [255, 255, 255, 255]
    })
  ]

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Header avec stats */}
      <div style={{ position: 'absolute', top: 0, zIndex: 1001 }}>
        <h2>🚢 Live Vessel Tracking - Global AIS Data</h2>
        <p>{connected ? `● Connected • ${vesselCount} vessels` : '● Connecting...'}</p>
      </div>

      {/* Légende */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1001 }}>
        <div>🔴 Tankers</div>
        <div>🔵 Cargo Ships</div>
        <div>🟢 Passenger</div>
        <div>⚪ Other</div>
      </div>

      {/* Stats */}
      <div style={{ position: 'absolute', top: 100, right: 20, zIndex: 1001 }}>
        <div>Total Vessels: {vesselCount.toLocaleString()}</div>
        <div>Tankers: {vessels.filter(v => v.shipType.includes('Tanker')).length}</div>
        <div>Cargo Ships: {vessels.filter(v => v.shipType.includes('Cargo')).length}</div>
      </div>

      {/* Carte Deck.gl */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }: any) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getTooltip={({ object }: any) => {
          if (!object) return null
          return {
            html: `
              <div>
                <div><strong>${object.name}</strong></div>
                <div>MMSI: ${object.mmsi}</div>
                <div>Type: ${object.shipType}</div>
                <div>Speed: ${object.speed.toFixed(1)} knots</div>
                ${object.destination ? `<div>Destination: ${object.destination}</div>` : ''}
              </div>
            `
          }
        }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>
    </div>
  )
}
```

### 5.6 Proxy WebSocket Backend

**Fichier**: `server/src/ais-proxy.ts`

```typescript
let sharedAisWs: WebSocket | null = null
const clients = new Set<WebSocket>()

export function setupAISProxy(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/api/ais-stream'
  })

  function ensureAISConnection() {
    if (sharedAisWs && sharedAisWs.readyState === WebSocket.OPEN) {
      return // Déjà connecté
    }

    console.log('🔄 Creating shared AIS Stream connection...')
    sharedAisWs = new WebSocket('wss://stream.aisstream.io/v0/stream')
    
    sharedAisWs.on('open', () => {
      console.log('✅ Shared AIS Stream connection established')
      
      const subscriptionMessage = {
        APIKey: process.env.VITE_AISSTREAM_API_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]], // Couverture mondiale
        FilterMessageTypes: ["PositionReport", "ShipStaticData"]
      }
      
      sharedAisWs!.send(JSON.stringify(subscriptionMessage))
      
      // Notifier tous les clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'connected',
            message: 'Connected to AIS Stream'
          }))
        }
      })
    })

    sharedAisWs.on('message', (data) => {
      // Diffuser à tous les clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.toString())
        }
      })
    })

    sharedAisWs.on('close', () => {
      console.log('🔌 Shared AIS Stream closed')
      sharedAisWs = null
      
      // Reconnecter si des clients sont toujours connectés
      if (clients.size > 0) {
        setTimeout(ensureAISConnection, 5000)
      }
    })
  }

  wss.on('connection', (clientWs) => {
    console.log(`👤 Client connected (${clients.size + 1} total)`)
    clients.add(clientWs)
    ensureAISConnection()

    clientWs.on('close', () => {
      clients.delete(clientWs)
      console.log(`👤 Client disconnected (${clients.size} remaining)`)
      
      // Fermer la connexion AIS si plus de clients
      if (clients.size === 0) {
        setTimeout(() => {
          if (clients.size === 0 && sharedAisWs) {
            sharedAisWs.close()
            sharedAisWs = null
          }
        }, 30000)
      }
    })
  })

  return wss
}
```

**Features**:
- Connexion partagée (1 connexion backend pour N clients frontend)
- Reconnexion automatique après 5 secondes
- Fermeture automatique après 30 secondes sans clients
- Couverture mondiale (bounding box -90/-180 à 90/180)
- Filtrage sur PositionReport et ShipStaticData
- Gestion gracieuse des erreurs

### 5.7 Intégration dans l'Interface

**Déclenchement depuis le secteur Énergie**:
```typescript
// Dans App.tsx
<div 
  onClick={() => {
    if (ind.label === "WTI Crude" && activeSector.id === "energie") {
      setShowMap(true)
    }
  }}
  style={{ cursor: "pointer" }}
>
  {ind.label} 🗺️
</div>

{showMap && <VesselMap onClose={() => setShowMap(false)} />}
```

**Performance**:
- Jusqu'à 20,000 navires en mémoire
- Mise à jour en temps réel (< 1s de latence)
- Rendu WebGL fluide (60 FPS)
- Tooltip interactif au survol

---


## 6. INTELLIGENCE ARTIFICIELLE

### 6.1 Détection Automatique du Provider

**Fichier**: `src/hooks/useAIProvider.ts`

**Description**: Détecte automatiquement si Ollama (local) est disponible, sinon utilise Claude (API).

```typescript
export function useAIProvider() {
  const [ollamaAvailable, setOllamaAvailable] = useState(false)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkOllama() {
      const available = await detectOllama()
      setOllamaAvailable(available)
      
      if (available) {
        const models = await getOllamaModels()
        setOllamaModels(models)
      }
      
      setChecking(false)
    }
    
    checkOllama()
  }, [])

  return {
    ollamaAvailable,
    ollamaModels,
    checking,
    provider: ollamaAvailable ? 'ollama' : 'claude'
  }
}
```

### 6.2 Service IA Unifié

**Fichier**: `src/services/aiApi.ts`

**Providers Supportés**:
1. **Ollama** (local, gratuit)
2. **Claude Sonnet 4** (API Anthropic)

#### 6.2.1 Détection Ollama

```typescript
export async function detectOllama(): Promise<boolean> {
  try {
    const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}

export async function getOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    const data = await response.json()
    return data.models?.map((m: any) => m.name) || []
  } catch {
    return []
  }
}
```

#### 6.2.2 Génération avec Ollama

```typescript
export async function generateWithOllama(prompt: string, model: string = 'llama3.2'): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false
    })
  })
  
  const data = await response.json()
  return data.response || ''
}
```

#### 6.2.3 Génération avec Claude

```typescript
export async function generateWithClaude(prompt: string): Promise<string> {
  const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  
  const data = await response.json()
  return data.content.map((b: any) => b.text || '').join('')
}
```

#### 6.2.4 Fonction Principale (Auto-Fallback)

```typescript
export async function generateText(prompt: string, preferredProvider?: AIProvider): Promise<{
  text: string
  provider: AIProvider
}> {
  // Si provider spécifié, l'utiliser
  if (preferredProvider === 'ollama') {
    const text = await generateWithOllama(prompt)
    return { text, provider: 'ollama' }
  }
  
  if (preferredProvider === 'claude') {
    const text = await generateWithClaude(prompt)
    return { text, provider: 'claude' }
  }
  
  // Sinon, détecter automatiquement
  const ollamaAvailable = await detectOllama()
  
  if (ollamaAvailable) {
    try {
      const text = await generateWithOllama(prompt)
      return { text, provider: 'ollama' }
    } catch (error) {
      console.warn('Ollama failed, falling back to Claude:', error)
    }
  }
  
  // Fallback sur Claude
  const text = await generateWithClaude(prompt)
  return { text, provider: 'claude' }
}
```

### 6.3 Génération d'Actualités IA

**Fonction**: `generateNews(sectorLabel: string, sectorId: string)`

**Workflow**:
1. Tenter de récupérer des actualités réelles depuis l'agrégateur
2. Si aucune actualité réelle, utiliser l'IA pour générer des actualités fictives mais réalistes
3. Enrichir avec le framework d'analyse sectorielle

```typescript
export async function generateNews(sectorLabel: string, sectorId: string, preferredProvider?: AIProvider): Promise<any[]> {
  // 1. Essayer de récupérer des actualités réelles
  try {
    const response = await fetch(`${API_BASE_URL}/api/news/${encodeURIComponent(sectorLabel)}`)
    const data = await response.json()
    
    if (data.articles && data.articles.length > 0) {
      return data.articles.map((article: any) => ({
        title: article.title,
        summary: article.snippet,
        impact: "neutre",
        category: article.source,
        date: article.date,
        url: article.url,
        source: article.source
      }))
    }
  } catch (error) {
    console.error('Error fetching real news:', error)
  }
  
  // 2. Fallback: Récupérer actualités récentes du web pour contexte
  const recentNews = await fetchRecentNews(sectorLabel)
  
  // 3. Récupérer le framework d'analyse du secteur
  const analysisContext = getSectorAnalysisContext(sectorId)
  
  // 4. Construire le prompt enrichi
  const prompt = `Tu es un analyste financier senior spécialisé dans l'analyse causale des marchés. 
Nous sommes le ${new Date().toLocaleDateString('fr-FR')}.

${analysisContext}

Pour le secteur "${sectorLabel}", génère 4 actualités fictives mais réalistes basées sur les vraies actualités récentes.

${recentNews ? `Actualités récentes:\n${recentNews}` : ''}

IMPORTANT - Applique les 3 filtres d'analyse:
1. Offre/Demande: Précise si l'actualité impacte l'offre ou la demande
2. Temporel: Indique si c'est structurel (>5 ans) ou conjoncturel (<1 an)
3. Prix: Mentionne si c'est une surprise ou déjà anticipé par le marché

Format JSON uniquement:
{"news":[{"title":"...","summary":"...","impact":"positif"|"negatif"|"neutre","category":"...","date":"..."},...]}

Catégories: Géopolitique, Réglementation, Résultats, Macro, M&A, Technologie, Supply Chain`

  // 5. Générer avec l'IA
  try {
    const { text } = await generateText(prompt, preferredProvider)
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return parsed.news || []
  } catch (error) {
    console.error('Error generating news:', error)
    return [{
      title: "Erreur de chargement",
      summary: "Impossible de récupérer les actualités.",
      impact: "neutre",
      category: "Système",
      date: new Date().toLocaleDateString('fr-FR')
    }]
  }
}
```

### 6.4 Récupération d'Actualités Web

```typescript
export async function fetchRecentNews(sector: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/news/${encodeURIComponent(sector)}`)
    const data = await response.json()
    
    if (data.news && data.news.length > 0) {
      const newsContext = data.news.map((item: any, i: number) => 
        `${i + 1}. [${item.date}] ${item.title}\n   ${item.snippet}${item.source ? ` (Source: ${item.source})` : ''}`
      ).join('\n\n')
      
      return `Actualités en temps réel (${new Date().toLocaleString('fr-FR')}):\n\n${newsContext}`
    }
    
    return ''
  } catch (error) {
    console.error('Error fetching recent news:', error)
    return ''
  }
}
```

### 6.5 Contexte d'Analyse Sectorielle

**Fichier**: `src/data/sectorAnalysisFramework.ts`

```typescript
export function getSectorAnalysisContext(sectorId: string): string {
  const framework = SECTOR_FRAMEWORKS[sectorId]
  if (!framework) return ''
  
  return `
FRAMEWORK D'ANALYSE - ${framework.label}

Nœuds Critiques:
${framework.criticalNodes.map(n => `- ${n}`).join('\n')}

Drivers Offre/Demande:
OFFRE: ${framework.supplyDemandDrivers.supply.slice(0, 5).join(', ')}
DEMANDE: ${framework.supplyDemandDrivers.demand.slice(0, 5).join(', ')}

Indicateurs Clés:
${framework.keyIndicators.slice(0, 5).map(i => `- ${i}`).join('\n')}

Risques Géographiques:
${framework.geographicRisks.slice(0, 3).map(r => `- ${r}`).join('\n')}

Facteurs Structurels:
${framework.structuralFactors.slice(0, 3).map(f => `- ${f}`).join('\n')}

Corrélations:
POSITIVES: ${framework.correlations.positive.slice(0, 3).join(', ')}
NÉGATIVES: ${framework.correlations.negative.slice(0, 3).join(', ')}
`
}
```

### 6.6 Panel Actualités IA

**Fichier**: `src/components/AINewsPanel.tsx`

**Features**:
- Affichage des actualités avec scoring de pertinence
- Sentiment coloré (positif/négatif/neutre)
- Liens cliquables vers les sources
- Points clés extraits
- Entreprises mentionnées
- Événements détectés
- Bouton de rafraîchissement
- Indicateur de dernière mise à jour

```typescript
export default function AINewsPanel({ sector }: Props) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchNews = async () => {
    setLoading(true)
    
    try {
      const apiSectorId = SECTOR_ID_MAP[sector.id] || sector.id
      const response = await fetch(
        `${API_BASE_URL}/api/aggregated/sector/${apiSectorId}?limit=15`
      )
      
      const data = await response.json()
      setNews(data.articles || [])
      setLastUpdate(new Date())
    } catch (err: any) {
      console.error('Error fetching news:', err)
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [sector.id])

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          📰 Actualités · {sector.label}
          {lastUpdate && (
            <div>Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}</div>
          )}
        </div>
        <button onClick={fetchNews} disabled={loading}>
          {loading ? "..." : "↻ Actualiser"}
        </button>
      </div>

      {news.map((article) => (
        <div key={article.id}>
          <a href={article.url} target="_blank">
            {article.title}
          </a>
          <div>{article.summary}</div>
          <div>
            Score: {article.finalScore} | 
            Sentiment: {getSentimentLabel(article.sentiment)} |
            {article.companies.join(', ')}
          </div>
          {article.keyPoints.map((point, idx) => (
            <div key={idx}>• {point}</div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

**Affichage**:
- Titre cliquable (ouvre l'article dans un nouvel onglet)
- Résumé de l'article
- Score de pertinence (0-10)
- Sentiment (positif/négatif/neutre)
- Entreprises mentionnées (badges bleus)
- Événements détectés (badges violets)
- Points clés (liste à puces)
- Date de publication (format français)

---


## 7. BACKEND ET API

### 7.1 Architecture Backend

**Stack**:
- Node.js + Express
- TypeScript
- Firebase/Firestore
- WebSocket (ws)
- Axios (HTTP client)
- XML2JS (parsing RSS)
- Compromise + Sentiment (NLP)

**Port**: 8000

### 7.2 Serveur Principal

**Fichier**: `server/src/index.ts`

```typescript
const app = express()
const PORT = process.env.PORT || 8000
const server = createServer(app)

app.use(cors())
app.use(express.json())

// Setup AIS WebSocket proxy
setupAISProxy(server)

// Routes d'agrégation intelligente
app.use('/api/aggregated', aggregationRouter)

// Routes de données de marché
app.use('/api', marketDataRouter)

// Middleware: API Key verification
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' })
  }

  const keyDoc = await db.collection(collections.apiKeys)
    .where('key', '==', apiKey)
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (keyDoc.empty) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  req.apiKey = keyDoc.docs[0].data()
  next()
}

// Middleware: Rate limiting
const rateLimiter = (req, res, next) => {
  const key = `rate:${req.apiKey.key}`
  const current = cache.get<number>(key) || 0

  if (current >= req.apiKey.rateLimit) {
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }

  cache.set(key, current + 1, 60)
  next()
}

server.listen(PORT, () => {
  console.log(`🚀 Financial News API running on port ${PORT}`)
})
```

### 7.3 Endpoints API

#### 7.3.1 Agrégation par Secteur

```
GET /api/aggregated/sector/:sector?limit=15
```

**Paramètres**:
- `sector`: technology, finance, healthcare, energy, consumer, industrial, materials, real_estate, utilities, telecom
- `limit`: nombre d'articles (défaut: 20)

**Réponse**:
```json
{
  "sector": "technology",
  "count": 15,
  "articles": [
    {
      "id": "abc123",
      "title": "Apple launches iPhone 17e",
      "url": "https://...",
      "publishedAt": "2026-03-03T10:30:00Z",
      "relevanceScore": "9.80",
      "importanceScore": 6,
      "finalScore": "7.68",
      "sentiment": "0.00",
      "summary": "Apple unveils...",
      "keyPoints": ["Lower cost", "M4 chip", "iPad Air"],
      "companies": ["AAPL"],
      "events": ["product_launch"]
    }
  ]
}
```

#### 7.3.2 Top Articles Globaux

```
GET /api/aggregated/top?limit=30
```

**Réponse**:
```json
{
  "count": 30,
  "articles": [...]
}
```

#### 7.3.3 Tous les Secteurs

```
GET /api/aggregated/all?topPerSector=10
```

**Réponse**:
```json
{
  "sectors": ["technology", "finance", ...],
  "data": {
    "technology": [...],
    "finance": [...]
  }
}
```

#### 7.3.4 Données de Marché

```
GET /api/market-data/:sector
```

**Réponse**:
```json
{
  "sector": "energie",
  "indicators": [
    {
      "label": "WTI Crude",
      "value": "$82.4",
      "delta": "+1.8%",
      "up": true
    }
  ],
  "timestamp": "2026-03-03T10:30:00Z"
}
```

### 7.4 Worker RSS

**Fichier**: `server/src/rss-worker.ts`

**Description**: Worker qui récupère les actualités RSS toutes les minutes et les ingère dans Firestore.

```typescript
class RSSWorker {
  async run() {
    console.log('🚀 Starting RSS ingestion worker...')
    console.log(`📡 Monitoring ${RSS_SOURCES.length} RSS feeds`)

    while (true) {
      try {
        // Fetch de toutes les sources
        const articles = await this.fetchAllFeeds()
        console.log(`📊 Total articles fetched: ${articles.length}`)

        // Traiter chaque article
        for (const article of articles) {
          await this.processArticle(article)
        }

        this.lastIngestedAt = new Date()
      } catch (error: any) {
        console.error('Error in worker loop:', error.message)
      }

      // Attendre 1 minute avant le prochain poll
      console.log('⏳ Waiting 1 minute before next poll...')
      await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000))
    }
  }

  async processArticle(articleData: any) {
    // Vérifier si déjà en DB
    if (await this.alreadyInDb(articleData.url)) {
      return
    }

    // Récupérer les entreprises
    const companies = await this.getCompanies()
    
    // Traiter avec NLP
    const result = nlpProcessor.process(articleData, companies)

    // Sauvegarder l'article
    const articleRef = await db.collection(collections.articles).add({
      url: articleData.url,
      title: articleData.title,
      body: articleData.body,
      publishedAt: articleData.publishedAt,
      ingestedAt: new Date(),
      sourceDomain: articleData.sourceDomain,
      language: articleData.language || 'en',
      rawSentiment: result.rawSentiment
    })

    // Sauvegarder les mentions
    for (const company of result.detectedCompanies) {
      await db.collection(collections.mentions).add({
        articleId: articleRef.id,
        companyId: company.companyId,
        ticker: company.ticker,
        mentionCount: company.mentionCount,
        entitySentiment: company.entitySentiment,
        isPrimarySubject: company.isPrimarySubject,
        eventTags: result.events.map(e => e[0])
      })
    }

    // Sauvegarder les événements
    for (const [eventType, confidence] of result.events) {
      for (const company of result.detectedCompanies) {
        if (company.isPrimarySubject) {
          await db.collection(collections.events).add({
            articleId: articleRef.id,
            companyId: company.companyId,
            ticker: company.ticker,
            eventType,
            confidence,
            detectedAt: new Date(),
            articleUrl: articleData.url
          })
        }
      }
    }

    const latency = (Date.now() - articleData.publishedAt.getTime()) / 1000
    console.log(`✅ ${articleData.title.substring(0, 60)}... - ${latency.toFixed(0)}s`)
  }
}

const worker = new RSSWorker()
worker.run()
```

**Lancement**:
```bash
cd server
npm run rss-worker
```

### 7.5 NLP Processor

**Fichier**: `server/src/nlp.ts`

**Description**: Traitement NLP basique avec Compromise et Sentiment.

```typescript
export class NLPProcessor {
  detectCompanies(text: string, companies: Company[]) {
    const doc = nlp(text)
    const orgs = doc.organizations().out('array')
    const detected: Array<{
      companyId: string
      ticker: string
      mentionCount: number
    }> = []

    for (const org of orgs) {
      for (const company of companies) {
        // Check ticker
        if (org.toUpperCase() === company.ticker) {
          detected.push({
            companyId: company.id,
            ticker: company.ticker,
            mentionCount: this.countOccurrences(text, company.ticker)
          })
          continue
        }

        // Check official name (fuzzy)
        if (this.fuzzyMatch(org, company.officialName)) {
          detected.push({
            companyId: company.id,
            ticker: company.ticker,
            mentionCount: this.countOccurrences(text, company.officialName)
          })
          continue
        }

        // Check aliases
        for (const alias of company.aliases) {
          if (this.fuzzyMatch(org, alias)) {
            detected.push({
              companyId: company.id,
              ticker: company.ticker,
              mentionCount: this.countOccurrences(text, alias)
            })
            break
          }
        }
      }
    }

    return detected
  }

  analyzeEntitySentiment(text: string, entity: string): number {
    const doc = nlp(text)
    const sentences = doc.sentences().out('array') as string[]
    const entitySentences = sentences.filter((s: string) =>
      s.toLowerCase().includes(entity.toLowerCase())
    )

    if (entitySentences.length === 0) return 0

    const sentiments = entitySentences.map((s: string) => {
      const result = sentiment.analyze(s)
      return result.comparative // Normalized score
    })

    return sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length
  }

  classifyEvents(text: string): Array<[EventType, number]> {
    const textLower = text.toLowerCase()
    const detected: Array<[EventType, number]> = []

    for (const [eventType, keywords] of Object.entries(EVENT_KEYWORDS)) {
      const matches = keywords.filter(kw => textLower.includes(kw)).length
      if (matches > 0) {
        const confidence = Math.min(matches / keywords.length, 1.0)
        detected.push([eventType as EventType, confidence])
      }
    }

    return detected
  }

  process(article: any, companies: Company[]) {
    const text = `${article.title} ${article.body}`

    // Detect companies
    const detectedCompanies = this.detectCompanies(text, companies)

    // Analyze sentiment for each
    for (const company of detectedCompanies) {
      company.entitySentiment = this.analyzeEntitySentiment(text, company.ticker)
    }

    // Determine primary subject
    if (detectedCompanies.length > 0) {
      const maxMentions = Math.max(...detectedCompanies.map(c => c.mentionCount))
      for (const company of detectedCompanies) {
        company.isPrimarySubject = company.mentionCount === maxMentions
      }
    }

    // Classify events
    const events = this.classifyEvents(text)

    // Global sentiment
    const rawSentiment = sentiment.analyze(text).comparative

    return {
      article,
      detectedCompanies,
      events,
      rawSentiment
    }
  }
}
```

**Événements Détectés** (16 types):
- earnings_beat / earnings_miss
- merger_acquisition
- government_contract
- partnership
- executive_change
- layoffs
- product_launch
- regulatory_action
- share_buyback
- dividend_change
- analyst_upgrade / analyst_downgrade
- insider_trading
- sec_filing
- lawsuit

---


## 8. BASE DE DONNÉES FIREBASE

### 8.1 Configuration Firebase

**Fichier**: `server/src/firebase.ts`

```typescript
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'world-data-visualizer'
})

const db = getFirestore()

// Use emulator if FIRESTORE_EMULATOR_HOST is set
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.NODE_ENV !== 'production') {
  db.settings({
    host: 'localhost:8080',
    ssl: false
  })
  console.log('🔧 Using Firestore Emulator at localhost:8080')
}

export { db }
export const auth = admin.auth()

// Collections
export const collections = {
  companies: 'companies',
  articles: 'articles',
  mentions: 'article_mentions',
  events: 'events',
  apiKeys: 'api_keys'
}
```

### 8.2 Schéma de Données

#### 8.2.1 Collection: companies

```typescript
interface Company {
  id: string
  ticker: string              // "AAPL"
  officialName: string        // "Apple Inc."
  aliases: string[]           // ["Apple", "AAPL"]
  exchange: 'NYSE' | 'NASDAQ' | 'OTHER'
  sector?: string             // "Technology"
  createdAt: Date
}
```

**Exemple**:
```json
{
  "id": "abc123",
  "ticker": "AAPL",
  "officialName": "Apple Inc.",
  "aliases": ["Apple", "AAPL", "Apple Computer"],
  "exchange": "NASDAQ",
  "sector": "Technology",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

#### 8.2.2 Collection: articles

```typescript
interface Article {
  id: string
  url: string                 // URL de l'article
  title: string               // Titre
  body: string                // Contenu complet
  publishedAt: Date           // Date de publication
  ingestedAt: Date            // Date d'ingestion
  sourceDomain: string        // "reuters.com"
  language: string            // "en"
  rawSentiment: number        // -1.0 à +1.0
}
```

**Exemple**:
```json
{
  "id": "xyz789",
  "url": "https://reuters.com/article/...",
  "title": "Apple launches iPhone 17e",
  "body": "Apple Inc. today announced...",
  "publishedAt": "2026-03-03T10:00:00Z",
  "ingestedAt": "2026-03-03T10:05:00Z",
  "sourceDomain": "reuters.com",
  "language": "en",
  "rawSentiment": 0.15
}
```

#### 8.2.3 Collection: article_mentions

```typescript
interface ArticleMention {
  id: string
  articleId: string           // Référence à l'article
  companyId: string           // Référence à l'entreprise
  ticker: string              // "AAPL"
  mentionCount: number        // Nombre de mentions
  entitySentiment: number     // Sentiment spécifique à l'entité
  isPrimarySubject: boolean   // Sujet principal?
  eventTags: string[]         // ["product_launch"]
}
```

**Exemple**:
```json
{
  "id": "mention123",
  "articleId": "xyz789",
  "companyId": "abc123",
  "ticker": "AAPL",
  "mentionCount": 5,
  "entitySentiment": 0.25,
  "isPrimarySubject": true,
  "eventTags": ["product_launch"]
}
```

#### 8.2.4 Collection: events

```typescript
interface Event {
  id: string
  articleId: string           // Référence à l'article
  companyId: string           // Référence à l'entreprise
  ticker: string              // "AAPL"
  eventType: EventType        // "product_launch"
  confidence: number          // 0.0 à 1.0
  detectedAt: Date            // Date de détection
  articleUrl: string          // URL de l'article source
}

type EventType =
  | 'earnings_beat'
  | 'earnings_miss'
  | 'merger_acquisition'
  | 'government_contract'
  | 'partnership'
  | 'executive_change'
  | 'layoffs'
  | 'product_launch'
  | 'regulatory_action'
  | 'share_buyback'
  | 'dividend_change'
  | 'analyst_upgrade'
  | 'analyst_downgrade'
  | 'insider_trading'
  | 'sec_filing'
  | 'lawsuit'
```

**Exemple**:
```json
{
  "id": "event456",
  "articleId": "xyz789",
  "companyId": "abc123",
  "ticker": "AAPL",
  "eventType": "product_launch",
  "confidence": 0.85,
  "detectedAt": "2026-03-03T10:05:00Z",
  "articleUrl": "https://reuters.com/article/..."
}
```

#### 8.2.5 Collection: api_keys

```typescript
interface APIKey {
  id: string
  key: string                 // Clé API
  plan: 'free' | 'pro' | 'enterprise'
  rateLimit: number           // Requêtes par minute
  maxWebsockets: number       // Connexions WebSocket max
  createdAt: Date
  isActive: boolean
}
```

**Exemple**:
```json
{
  "id": "key789",
  "key": "sk_live_abc123...",
  "plan": "pro",
  "rateLimit": 100,
  "maxWebsockets": 5,
  "createdAt": "2026-01-01T00:00:00Z",
  "isActive": true
}
```

### 8.3 Émulateur Firestore

**Configuration**: `server/firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

**Lancement**:
```bash
cd server
firebase emulators:start --only firestore
```

**Interface UI**: http://localhost:4000

### 8.4 Règles de Sécurité

**Fichier**: `server/firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Companies: lecture publique
    match /companies/{companyId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Articles: lecture publique
    match /articles/{articleId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Mentions: lecture publique
    match /article_mentions/{mentionId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Events: lecture publique
    match /events/{eventId} {
      allow read: if true;
      allow write: if false;
    }
    
    // API Keys: lecture/écriture restreinte
    match /api_keys/{keyId} {
      allow read, write: if false;
    }
  }
}
```

### 8.5 Indexes

**Fichier**: `server/firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "articles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "publishedAt", "order": "DESCENDING" },
        { "fieldPath": "rawSentiment", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "article_mentions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "isPrimarySubject", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ticker", "order": "ASCENDING" },
        { "fieldPath": "detectedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---


## 9. SÉCURITÉ ET CONFIGURATION

### 9.1 Variables d'Environnement

#### 9.1.1 Frontend (.env)

```env
# Clé API Anthropic (pour Claude)
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here

# URL du serveur backend
VITE_API_URL=http://localhost:8000

# AIS Stream API (optionnel, pour suivi pétroliers)
VITE_AISSTREAM_API_KEY=your_aisstream_api_key_here

# Ollama URL (optionnel, pour IA locale)
VITE_OLLAMA_URL=http://localhost:11434

# NewsAPI (optionnel, 100 requêtes/jour gratuit)
NEWS_API_KEY=your_newsapi_key_here
```

#### 9.1.2 Backend (server/.env)

```env
# Port du serveur
PORT=8000

# Firebase
FIREBASE_PROJECT_ID=world-data-visualizer
FIREBASE_API_KEY=your_firebase_api_key_here

# AIS Stream (même clé que frontend)
VITE_AISSTREAM_API_KEY=your_aisstream_api_key_here

# NewsAPI
NEWS_API_KEY=your_newsapi_key_here

# Environnement
NODE_ENV=development
```

### 9.2 Fichiers Protégés

**Fichier**: `.gitignore`

```
# Variables d'environnement
.env
.env.local
.env.*.local
*.env

# Clés API et Credentials
API_KEY.txt
serviceAccountKey.json
*-key.json
*-credentials.json
firebase-adminsdk-*.json

# Google Cloud
gcloud-credentials.json
application_default_credentials.json

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Node
node_modules/
dist/
build/

# Logs
*.log
npm-debug.log*
```

### 9.3 Bonnes Pratiques de Sécurité

**Fichier**: `SECURITY.md`

1. **Ne jamais commit de clés API**
   - Toujours utiliser `.env` pour les secrets
   - Commit uniquement `.env.example` avec des valeurs factices

2. **Vérifier avant de commit**
   ```bash
   git status
   git diff --cached
   ```

3. **Tester la protection**
   ```bash
   git check-ignore -v server/API_KEY.txt
   # Doit afficher: server/.gitignore:14:API_KEY.txt
   ```

4. **Si vous avez déjà commité une clé par erreur**
   ```bash
   # Supprimer du dernier commit
   git rm --cached fichier_sensible
   git commit --amend
   
   # Révoquer la clé immédiatement!
   # Générer une nouvelle clé
   ```

### 9.4 Validation des Clés API

**Backend**:
```typescript
// Vérifier que la clé NewsAPI est configurée
if (!process.env.NEWS_API_KEY) {
  console.warn('⚠️ NEWS_API_KEY not configured')
}

// Vérifier que la clé AIS Stream est configurée
if (!process.env.VITE_AISSTREAM_API_KEY) {
  console.warn('⚠️ VITE_AISSTREAM_API_KEY not configured')
}
```

**Frontend**:
```typescript
// Vérifier que la clé Anthropic est configurée
if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
  console.warn('⚠️ VITE_ANTHROPIC_API_KEY not configured - Claude unavailable')
}
```

### 9.5 Rate Limiting

**Implémentation**:
```typescript
const cache = new NodeCache({ stdTTL: 60 })

const rateLimiter = (req: any, res: any, next: any) => {
  const key = `rate:${req.apiKey.key}`
  const current = cache.get<number>(key) || 0

  if (current >= req.apiKey.rateLimit) {
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }

  cache.set(key, current + 1, 60)
  next()
}
```

**Limites par Plan**:
- Free: 10 requêtes/minute
- Pro: 100 requêtes/minute
- Enterprise: 1000 requêtes/minute

### 9.6 CORS Configuration

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',  // Frontend dev
    'http://localhost:3000',  // Frontend prod
    'https://yourdomain.com'  // Production
  ],
  credentials: true
}))
```

---


## 10. PERFORMANCE ET OPTIMISATION

### 10.1 Cache Multi-Niveaux

#### 10.1.1 Cache Backend (NodeCache)

**Données de Marché**:
```typescript
class MarketDataService {
  private cache: Map<string, { data: YahooQuote; timestamp: number }>
  private cacheDuration = 5 * 60 * 1000 // 5 minutes

  async fetchQuote(symbol: string): Promise<YahooQuote | null> {
    // Vérifier le cache
    const cached = this.cache.get(symbol)
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data
    }

    // Fetch depuis Yahoo Finance
    const quote = await this.fetchFromYahoo(symbol)
    
    // Mettre en cache
    this.cache.set(symbol, { data: quote, timestamp: Date.now() })
    return quote
  }
}
```

**Rate Limiting**:
```typescript
const cache = new NodeCache({ stdTTL: 60 })

const rateLimiter = (req, res, next) => {
  const key = `rate:${req.apiKey.key}`
  const current = cache.get<number>(key) || 0

  if (current >= req.apiKey.rateLimit) {
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }

  cache.set(key, current + 1, 60)
  next()
}
```

#### 10.1.2 Cache Frontend (React State)

**Hook useMarketData**:
```typescript
export function useMarketData(sectorId: string) {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMarketData() {
      // Fetch depuis l'API
      const data = await fetch(`${apiUrl}/api/market-data/${sectorId}`)
      setIndicators(data.indicators)
    }

    fetchMarketData()

    // Refresh toutes les 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [sectorId])

  return { indicators, loading }
}
```

### 10.2 Optimisations WebSocket

#### 10.2.1 Connexion Partagée

**Problème**: N clients = N connexions à aisstream.io

**Solution**: 1 connexion backend partagée pour tous les clients

```typescript
let sharedAisWs: WebSocket | null = null
const clients = new Set<WebSocket>()

export function setupAISProxy(server: Server) {
  const wss = new WebSocketServer({ server, path: '/api/ais-stream' })

  function ensureAISConnection() {
    if (sharedAisWs && sharedAisWs.readyState === WebSocket.OPEN) {
      return // Déjà connecté
    }

    sharedAisWs = new WebSocket('wss://stream.aisstream.io/v0/stream')
    
    sharedAisWs.on('message', (data) => {
      // Diffuser à tous les clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.toString())
        }
      })
    })
  }

  wss.on('connection', (clientWs) => {
    clients.add(clientWs)
    ensureAISConnection()

    clientWs.on('close', () => {
      clients.delete(clientWs)
      
      // Fermer la connexion AIS si plus de clients
      if (clients.size === 0) {
        setTimeout(() => {
          if (clients.size === 0 && sharedAisWs) {
            sharedAisWs.close()
            sharedAisWs = null
          }
        }, 30000)
      }
    })
  })
}
```

**Bénéfices**:
- 1 connexion backend au lieu de N
- Économie de bande passante
- Meilleure gestion des reconnexions

#### 10.2.2 Limitation des Navires en Mémoire

```typescript
setVessels(prev => {
  const filtered = prev.filter(v => v.mmsi !== vessel.mmsi)
  const updated = [...filtered, vessel]
  return updated.slice(-20000) // Garder les 20000 plus récents
})
```

### 10.3 Optimisations Rendering

#### 10.3.1 React.memo pour Composants Lourds

```typescript
const VesselMap = React.memo(({ onClose }: VesselMapProps) => {
  // Composant lourd avec Deck.gl
  // Ne re-render que si onClose change
})
```

#### 10.3.2 useMemo pour Calculs Coûteux

```typescript
const validVessels = useMemo(() => 
  vessels.filter(v => 
    v && 
    typeof v.lon === 'number' && 
    typeof v.lat === 'number' &&
    !isNaN(v.lon) && 
    !isNaN(v.lat) &&
    v.lon >= -180 && v.lon <= 180 &&
    v.lat >= -90 && v.lat <= 90
  ),
  [vessels]
)
```

#### 10.3.3 Virtualisation (Future)

Pour les listes longues d'actualités:
```typescript
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={news.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <NewsArticle article={news[index]} />
    </div>
  )}
</FixedSizeList>
```

### 10.4 Optimisations Backend

#### 10.4.1 Batch Processing

**RSS Worker**:
```typescript
// Fetch toutes les sources en parallèle
const allArticles = await Promise.all(
  RSS_SOURCES.map(source => this.fetchRSSFeed(source))
)

// Traiter en batch
for (const article of allArticles.flat()) {
  await this.processArticle(article)
}
```

#### 10.4.2 Délais Anti-Rate-Limiting

```typescript
// Délai de 100ms entre requêtes Yahoo Finance
for (const [label, symbol] of Object.entries(symbols)) {
  const quote = await this.fetchQuote(symbol)
  indicators.push(...)
  
  await new Promise(resolve => setTimeout(resolve, 100))
}
```

#### 10.4.3 Timeout sur Requêtes Externes

```typescript
const response = await axios.get(url, {
  timeout: 5000, // 5 secondes max
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; FinancialNewsBot/1.0)'
  }
})
```

### 10.5 Métriques de Performance

**Temps de Réponse API**:
- `/api/aggregated/sector/:sector`: < 100ms (cache hit)
- `/api/aggregated/sector/:sector`: < 2s (cache miss)
- `/api/market-data/:sector`: < 500ms
- `/api/aggregated/top`: < 200ms

**Temps de Chargement Frontend**:
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Largest Contentful Paint: < 2.5s

**WebSocket**:
- Latence AIS: < 1s
- Reconnexion automatique: 5s
- Navires en mémoire: jusqu'à 20,000

**RSS Worker**:
- Cycle complet: ~30s (20 sources)
- Articles par cycle: ~111
- Taux d'acceptation: ~30%

---

## 11. DÉPLOIEMENT

### 11.1 Prérequis

- Node.js ≥ 18
- Firebase CLI (pour l'émulateur Firestore)
- Clés API configurées dans `.env`

### 11.2 Installation

```bash
# Cloner le projet
git clone <your-repo-url>
cd world-data-visualizer

# Installer les dépendances (root)
npm install

# Installer les dépendances (server)
cd server
npm install
cd ..
```

### 11.3 Lancement en Développement

```bash
# Terminal 1: Firestore Emulator
cd server
firebase emulators:start --only firestore

# Terminal 2: Backend API
cd server
npm run dev

# Terminal 3: RSS Worker (optionnel)
cd server
npm run rss-worker

# Terminal 4: Frontend
npm run dev
```

**URLs**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Firestore UI: http://localhost:4000

### 11.4 Build Production

```bash
# Frontend
npm run build
# Génère: dist/

# Backend
cd server
npm run build
# Génère: server/dist/
```

### 11.5 Déploiement Recommandé

**Frontend**: Vercel / Netlify
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

**Backend**: Railway / Render / Fly.io
```bash
# Railway
railway up

# Render
render deploy

# Fly.io
fly deploy
```

**Base de Données**: Firebase Firestore (production)
```bash
# Déployer les règles
firebase deploy --only firestore:rules

# Déployer les indexes
firebase deploy --only firestore:indexes
```

---

## 12. TESTS

### 12.1 Tests Unitaires

**Framework**: Vitest

```bash
# Lancer les tests
npm run test

# Lancer les tests en mode watch
npm run test:watch
```

**Configuration**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
```

### 12.2 Tests d'Intégration

**Fichier**: `server/test-api.sh`

```bash
#!/bin/bash

# Test aggregation endpoint
curl "http://localhost:8000/api/aggregated/sector/technology?limit=5"

# Test market data endpoint
curl "http://localhost:8000/api/market-data/energie"

# Test top articles
curl "http://localhost:8000/api/aggregated/top?limit=10"
```

### 12.3 Tests AIS

**Fichier**: `server/test-ais-direct.mjs`

```javascript
import WebSocket from 'ws'

const ws = new WebSocket('wss://stream.aisstream.io/v0/stream')

ws.on('open', () => {
  console.log('✅ Connected to AIS Stream')
  
  ws.send(JSON.stringify({
    APIKey: process.env.VITE_AISSTREAM_API_KEY,
    BoundingBoxes: [[[-90, -180], [90, 180]]],
    FilterMessageTypes: ["PositionReport", "ShipStaticData"]
  }))
})

ws.on('message', (data) => {
  const parsed = JSON.parse(data.toString())
  console.log('📡 Received:', parsed.MessageType)
})
```

---

## 13. DOCUMENTATION

### 13.1 Fichiers de Documentation

1. **readme.md** - Documentation principale du projet
2. **SECURITY.md** - Bonnes pratiques de sécurité
3. **PROJECT_STATUS.md** - Statut actuel du projet
4. **CLEANUP_SUMMARY.md** - Résumé du nettoyage
5. **FEATURES_COMPLETE_SUMMARY.md** - Ce fichier (résumé complet)

### 13.2 Documentation Backend

1. **server/README.md** - Documentation backend
2. **server/SCORING_METHODOLOGY.md** - Méthodologie de scoring
3. **server/SCORING_IMPROVEMENTS.md** - Améliorations du scoring

### 13.3 Documentation Specs

1. **.kiro/specs/multi-source-news-aggregation/requirements.md** - Exigences
2. **.kiro/specs/multi-source-news-aggregation/design.md** - Design
3. **.kiro/specs/multi-source-news-aggregation/tasks.md** - Plan d'implémentation

---

## 14. ROADMAP

### 14.1 Court Terme (1-2 semaines)

- [ ] Monitorer les scores pendant 24-48h
- [ ] Collecter feedback utilisateurs
- [ ] Fine-tuner les listes de keywords
- [ ] Implémenter Event Detection Confidence
- [ ] Ajouter Cross-Sector Dampening

### 14.2 Moyen Terme (1 mois)

- [ ] Implémenter TF-IDF scoring
- [ ] Ajouter OpenAI/Claude pour NLP avancé
- [ ] Implémenter Redis caching
- [ ] Ajouter authentification utilisateur
- [ ] Créer dashboard analytics

### 14.3 Long Terme (3 mois)

- [ ] Support multi-langues
- [ ] WebSocket updates en temps réel
- [ ] Application mobile (React Native)
- [ ] Alertes personnalisées par email/SMS
- [ ] Intégration avec brokers (trading)

---

## 15. CONTRIBUTEURS

**Développement**: Équipe Kiro AI  
**Date de Création**: Janvier 2026  
**Dernière Mise à Jour**: 3 mars 2026

---

## 16. LICENCE

MIT - Libre d'utilisation et de modification

---

**FIN DU RÉSUMÉ COMPLET**

