// Framework d'analyse sectorielle basé sur les chaînes de causalité

export interface SectorFramework {
  id: string
  label: string
  criticalNodes: string[]
  supplyDemandDrivers: {
    supply: string[]
    demand: string[]
  }
  keyIndicators: string[]
  geographicRisks: string[]
  structuralFactors: string[]
  correlations: {
    positive: string[]
    negative: string[]
  }
}

export const SECTOR_FRAMEWORKS: Record<string, SectorFramework> = {
  energie: {
    id: "energie",
    label: "Énergie",
    criticalNodes: [
      "Détroit d'Ormuz (20% du pétrole mondial)",
      "Canal de Suez",
      "Décisions OPEP+",
      "Golfe du Mexique (production US)",
      "Pipeline Nord Stream",
      "Réserves stratégiques (SPR)",
      "Capacités de raffinage mondiales"
    ],
    supplyDemandDrivers: {
      supply: [
        "Production OPEP+",
        "Shale oil américain",
        "Tensions géopolitiques Moyen-Orient",
        "Catastrophes naturelles (ouragans, tempêtes)",
        "Sanctions (Russie, Iran, Venezuela)",
        "Investissements upstream",
        "Capacités de raffinage",
        "Maintenance planifiée",
        "Grèves sectorielles"
      ],
      demand: [
        "Croissance économique Chine/Inde",
        "Transition énergétique",
        "Saison (hiver/été)",
        "Prix du gaz naturel",
        "Trafic aérien",
        "Production pétrochimique",
        "Stockage stratégique",
        "Arbitrage diesel/essence"
      ]
    },
    keyIndicators: [
      "Prix WTI et Brent",
      "Stocks stratégiques US (EIA)",
      "Taux d'utilisation des raffineries",
      "Spreads crack (marges raffinage)",
      "Rig count (nombre de forages)",
      "Backwardation/Contango",
      "Spreads régionaux",
      "Inventaires flottants"
    ],
    geographicRisks: [
      "Moyen-Orient (Iran, Irak, Arabie Saoudite)",
      "Détroits stratégiques (Ormuz, Malacca, Bab el-Mandeb)",
      "Russie (sanctions, pipeline)",
      "Libye (instabilité)",
      "Nigeria (sécurité)",
      "Venezuela (production)"
    ],
    structuralFactors: [
      "Transition énergétique (horizon 10-20 ans)",
      "Réglementations émissions CO2",
      "Investissements dans le renouvelable",
      "Pic de demande pétrolière",
      "Sous-investissement upstream",
      "Électrification transport",
      "Efficacité énergétique",
      "Géopolitique énergétique"
    ],
    correlations: {
      positive: ["Dollar faible", "Croissance économique mondiale", "Tensions géopolitiques", "Inflation", "Stocks bas"],
      negative: ["Récession", "Dollar fort", "Substitution énergétique", "Efficacité énergétique", "Lockdowns"]
    }
  },
  tech: {
    id: "tech",
    label: "Technologie",
    criticalNodes: [
      "Taux directeur Fed",
      "Réglementation IA (UE, US, Chine)",
      "Chaîne d'approvisionnement semi-conducteurs (Taiwan)",
      "Dépenses cloud des entreprises",
      "Restrictions export US-Chine",
      "Antitrust (GAFAM)",
      "Cybersécurité (attaques majeures)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Production TSMC/Samsung/Intel",
        "Restrictions export US-Chine (puces avancées)",
        "Capacités de production puces (fabs)",
        "Pénurie composants",
        "Équipements ASML (EUV)",
        "Matières premières (silicium, terres rares)",
        "Talents (ingénieurs)",
        "Énergie (data centers)"
      ],
      demand: [
        "Adoption IA générative",
        "Dépenses IT entreprises",
        "Cycle de renouvellement smartphones",
        "Croissance cloud computing",
        "Gaming/crypto mining",
        "Automobile (électronique embarquée)",
        "IoT/Edge computing",
        "Défense/spatial"
      ]
    },
    keyIndicators: [
      "Taux Fed (valorisation future)",
      "Sox Index (semi-conducteurs)",
      "Croissance cloud YoY (AWS, Azure, GCP)",
      "Investissements IA",
      "Book-to-bill ratio (semi-conducteurs)",
      "Dépenses capex hyperscalers",
      "Multiples valorisation (P/E, EV/Sales)",
      "Taux d'adoption IA entreprises"
    ],
    geographicRisks: [
      "Taiwan (80% des puces avancées)",
      "Tensions US-Chine (guerre technologique)",
      "Corée du Sud (mémoire DRAM/NAND)",
      "Japon (équipements, matériaux)",
      "Europe (souveraineté numérique)",
      "Inde (délocalisation)"
    ],
    structuralFactors: [
      "Révolution IA (horizon 5-10 ans)",
      "Réglementation antitrust",
      "Souveraineté numérique européenne",
      "Quantum computing",
      "Loi de Moore (ralentissement)",
      "Open source vs propriétaire",
      "Cybersécurité structurelle",
      "Métaverse/AR/VR"
    ],
    correlations: {
      positive: ["Taux bas", "Innovation breakthrough", "Dépenses R&D", "Croissance économique", "Productivité"],
      negative: ["Taux élevés", "Réglementation stricte", "Ralentissement économique", "Guerre commerciale", "Bulle valorisation"]
    }
  },
  sante: {
    id: "sante",
    label: "Santé",
    criticalNodes: [
      "Approbations FDA/EMA",
      "Résultats essais cliniques Phase 3",
      "Expiration brevets blockbusters",
      "Politiques de remboursement",
      "Négociations prix Medicare",
      "Pandémies/épidémies",
      "M&A secteur pharma"
    ],
    supplyDemandDrivers: {
      supply: [
        "Pipeline R&D (phases cliniques)",
        "Capacités de production (bioréacteurs)",
        "Chaîne d'approvisionnement principes actifs",
        "Acquisitions/fusions",
        "Brevets/exclusivité",
        "Capacités CDMO",
        "Matières premières (Chine/Inde)",
        "Talents scientifiques"
      ],
      demand: [
        "Vieillissement population",
        "Maladies chroniques (diabète, obésité, Alzheimer)",
        "Accès aux soins (pays émergents)",
        "Réformes santé",
        "Pandémies",
        "Prévention/dépistage",
        "Médecine esthétique",
        "Santé mentale"
      ]
    },
    keyIndicators: [
      "Nombre approbations FDA/EMA",
      "Dépenses R&D secteur",
      "Marché GLP-1 (Ozempic, Wegovy)",
      "Brevets expirant (patent cliff)",
      "Taux de succès essais cliniques",
      "Pricing power",
      "M&A activity",
      "Biosimilaires (part de marché)"
    ],
    geographicRisks: [
      "Réglementation US (Medicare, IRA)",
      "Politiques prix Europe",
      "Accès marchés émergents",
      "Chaîne d'approvisionnement Asie",
      "Propriété intellectuelle (Chine)",
      "Approbations réglementaires"
    ],
    structuralFactors: [
      "Médecine personnalisée/génomique",
      "Thérapies géniques/cellulaires",
      "Biosimilaires",
      "Télémédecine/santé digitale",
      "IA diagnostic",
      "Vieillissement démographique",
      "Prévention vs traitement",
      "Décentralisation essais cliniques"
    ],
    correlations: {
      positive: ["Vieillissement démographique", "Innovation médicale", "Pandémies", "Obésité", "Maladies chroniques"],
      negative: ["Contrôle des prix", "Échecs cliniques", "Génériques/biosimilaires", "Réforme santé", "Expiration brevets"]
    }
  },
  finance: {
    id: "finance",
    label: "Finance",
    criticalNodes: [
      "Décisions Fed/BCE/BoJ",
      "Courbe des taux (2-10Y)",
      "Régulation bancaire (Bâle III/IV)",
      "Marché du crédit",
      "Crises bancaires régionales",
      "Stress tests",
      "QE/QT (politique monétaire)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Liquidité bancaire",
        "Capacité de prêt (capital ratios)",
        "Régulation capital",
        "Marché interbancaire",
        "Dépôts bancaires",
        "Wholesale funding",
        "Émissions obligataires",
        "Titrisation"
      ],
      demand: [
        "Crédit entreprises",
        "Crédit immobilier",
        "Trading volumes",
        "M&A activity",
        "Crédit consommation",
        "Leveraged buyouts",
        "Refinancement dette",
        "Services gestion patrimoine"
      ]
    },
    keyIndicators: [
      "Taux directeurs (Fed, BCE)",
      "Courbe des taux (2-10Y, inversion)",
      "Spreads crédit (IG, HY)",
      "NPL ratio (prêts non performants)",
      "CET1 ratio (capital)",
      "NIM (marge nette d'intérêt)",
      "Loan-to-deposit ratio",
      "VIX (volatilité)"
    ],
    geographicRisks: [
      "Crise bancaire régionale (SVB-style)",
      "Divergence politique monétaire",
      "Stress tests (Fed, BCE)",
      "Crise dette souveraine",
      "Contagion financière",
      "Shadow banking"
    ],
    structuralFactors: [
      "Fintech disruption",
      "Monnaies numériques (CBDC)",
      "Régulation ESG",
      "Open banking",
      "Consolidation bancaire",
      "Désintermédiation",
      "Blockchain/DeFi",
      "Taux structurellement plus élevés"
    ],
    correlations: {
      positive: ["Courbe pentue", "Croissance économique", "Volatilité marchés", "M&A", "Inflation modérée"],
      negative: ["Courbe inversée", "Récession", "Défauts crédit", "Régulation stricte", "Taux négatifs"]
    }
  },
  consommation: {
    id: "consommation",
    label: "Consommation",
    criticalNodes: [
      "Confiance consommateur",
      "Taux d'épargne",
      "Inflation (pouvoir d'achat)",
      "Marché du travail",
      "Crédit consommation",
      "Prix énergie/alimentation",
      "Saison (Black Friday, Noël)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Chaîne d'approvisionnement",
        "Inventaires détaillants",
        "Capacités production",
        "Logistique (ports, transport)",
        "Coûts matières premières",
        "Main d'œuvre",
        "Immobilier commercial",
        "E-commerce infrastructure"
      ],
      demand: [
        "Pouvoir d'achat",
        "Emploi/salaires",
        "Crédit consommation",
        "Tendances démographiques",
        "Confiance économique",
        "Épargne excédentaire",
        "Substitution premium/discount",
        "Comportements post-Covid"
      ]
    },
    keyIndicators: [
      "Confiance consommateur (Michigan, Conference Board)",
      "Inflation (CPI, PCE)",
      "Taux de chômage",
      "Part e-commerce",
      "Ventes retail (ex-auto)",
      "Taux d'épargne",
      "Crédit revolving",
      "Taux de délinquance"
    ],
    geographicRisks: [
      "Divergence US/Europe/Chine",
      "Politiques fiscales (stimulus, taxes)",
      "Guerre commerciale (tarifs)",
      "Chaîne d'approvisionnement Asie",
      "Coûts logistiques",
      "Régulation e-commerce"
    ],
    structuralFactors: [
      "E-commerce vs retail physique",
      "Marques premium vs discount",
      "Durabilité/ESG",
      "Personnalisation/DTC",
      "Vieillissement population",
      "Génération Z (comportements)",
      "Économie de l'expérience",
      "Seconde main/économie circulaire"
    ],
    correlations: {
      positive: ["Emploi fort", "Salaires en hausse", "Confiance élevée", "Crédit accessible", "Stimulus fiscal"],
      negative: ["Inflation élevée", "Récession", "Épargne de précaution", "Taux élevés", "Pessimisme"]
    }
  },
  immobilier: {
    id: "immobilier",
    label: "Immobilier",
    criticalNodes: [
      "Taux hypothécaires",
      "Politiques Fed (QT impact)",
      "Zonage/régulation",
      "Démographie (formation ménages)",
      "Télétravail structurel",
      "Bureaux (taux d'occupation)",
      "Commercial (retail apocalypse)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Mises en chantier",
        "Permis de construire",
        "Coûts construction (matériaux, main d'œuvre)",
        "Disponibilité terrains",
        "Régulation (zonage, environnement)",
        "Financement promoteurs",
        "Conversions (bureaux en résidentiel)",
        "Inventaire existant"
      ],
      demand: [
        "Formation ménages",
        "Migration (urbain/rural)",
        "Télétravail",
        "Investissement locatif",
        "Primo-accédants",
        "Downsizing (retraités)",
        "Seconde résidence",
        "Institutionnels (REITs)"
      ]
    },
    keyIndicators: [
      "Taux hypothécaires 30 ans",
      "Mises en chantier",
      "Prix médian maisons (Case-Shiller)",
      "Taux de vacance",
      "Inventaire (mois de ventes)",
      "Affordability index",
      "Cap rates (commercial)",
      "Taux d'occupation bureaux"
    ],
    geographicRisks: [
      "Marchés surchauffés (côtes)",
      "Bureaux post-Covid (CBD)",
      "Régulation loyers (contrôle)",
      "Taxes foncières",
      "Risques climatiques (inondations, incendies)",
      "Migration inter-États"
    ],
    structuralFactors: [
      "Télétravail structurel",
      "Urbanisation vs exurbanisation",
      "Vieillissement (senior housing)",
      "Logistique/data centers",
      "Conversions d'usage",
      "Densification urbaine",
      "Risques climatiques",
      "Tokenisation immobilier"
    ],
    correlations: {
      positive: ["Taux bas", "Croissance emploi", "Migration", "Formation ménages", "Inflation (actif réel)"],
      negative: ["Taux élevés", "Récession", "Suroffre", "Télétravail (bureaux)", "Affordability crisis"]
    }
  },
  materiaux: {
    id: "materiaux",
    label: "Matériaux",
    criticalNodes: [
      "Croissance Chine (50% demande)",
      "Prix énergie (coûts production)",
      "Demande construction",
      "Transition énergétique (métaux critiques)",
      "Restrictions export (Chine terres rares)",
      "Grèves minières",
      "Inventaires LME/SHFE"
    ],
    supplyDemandDrivers: {
      supply: [
        "Capacités minières",
        "Coûts extraction (énergie, main d'œuvre)",
        "Géopolitique (mines, nationalisations)",
        "Recyclage/économie circulaire",
        "Permis environnementaux",
        "Capex minier (sous-investissement)",
        "Grades minerais (déclin)",
        "Disruptions (grèves, accidents)"
      ],
      demand: [
        "Construction (Chine, infrastructure)",
        "Automobile (acier, aluminium)",
        "Batteries (lithium, cobalt, nickel)",
        "Infrastructure (cuivre)",
        "Électronique (terres rares)",
        "Défense/aérospatial",
        "Emballage",
        "Transition énergétique"
      ]
    },
    keyIndicators: [
      "Prix cuivre (baromètre économique)",
      "Prix acier (Chine)",
      "Prix lithium/cobalt/nickel",
      "PMI Chine (construction)",
      "Inventaires LME",
      "Coûts énergie",
      "Capex minier",
      "Ratio stocks/consommation"
    ],
    geographicRisks: [
      "Chine (50% demande, contrôle terres rares)",
      "Concentration mines (RDC cobalt, Chili lithium)",
      "Restrictions export (Chine)",
      "Nationalisations (Amérique Latine)",
      "Instabilité politique (Afrique)",
      "Régulation environnementale"
    ],
    structuralFactors: [
      "Transition énergétique (métaux critiques)",
      "Économie circulaire/recyclage",
      "Substitution matériaux",
      "Décarbonation production (acier vert)",
      "Sous-investissement minier",
      "Concentration géographique",
      "Urbanisation pays émergents",
      "Efficacité matériaux"
    ],
    correlations: {
      positive: ["Croissance Chine", "Infrastructure", "Transition verte", "Dollar faible", "Inflation"],
      negative: ["Récession", "Dollar fort", "Surproduction", "Substitution", "Efficacité"]
    }
  },
  telecom: {
    id: "telecom",
    label: "Télécoms",
    criticalNodes: [
      "Déploiement 5G",
      "Régulation (enchères spectre)",
      "Consolidation sectorielle",
      "ARPU (revenu par utilisateur)",
      "Capex (infrastructure)",
      "Guerre des prix",
      "Neutralité du net"
    ],
    supplyDemandDrivers: {
      supply: [
        "Capacité réseau",
        "Investissements infrastructure (capex)",
        "Couverture 5G",
        "Fibre optique (FTTH)",
        "Spectre disponible",
        "Équipements (Ericsson, Nokia, Huawei)",
        "Sites cellulaires",
        "Backbone internet"
      ],
      demand: [
        "Consommation data mobile",
        "Adoption IoT",
        "Streaming vidéo (4K, 8K)",
        "Télétravail",
        "Gaming cloud",
        "Smart cities",
        "Véhicules connectés",
        "Industrie 4.0"
      ]
    },
    keyIndicators: [
      "Couverture 5G (%)",
      "ARPU moyen",
      "Churn rate (taux désabonnement)",
      "Prix enchères spectre",
      "Capex/revenus ratio",
      "Consommation data (GB/user)",
      "Free cash flow",
      "Leverage (dette/EBITDA)"
    ],
    geographicRisks: [
      "Réglementation européenne (roaming, prix)",
      "Consolidation marché (antitrust)",
      "Concurrence MVNO",
      "Sécurité nationale (Huawei)",
      "Taxes sectorielles",
      "Obligations couverture rurale"
    ],
    structuralFactors: [
      "Transition 5G vers 6G",
      "Neutralité du net",
      "Edge computing",
      "Satellites (Starlink, OneWeb)",
      "Convergence fixe-mobile",
      "Virtualisation réseau (NFV)",
      "Open RAN",
      "Consolidation sectorielle"
    ],
    correlations: {
      positive: ["Croissance data", "IoT", "Smart cities", "Streaming", "Consolidation"],
      negative: ["Guerre des prix", "Régulation stricte", "Saturation marché", "Capex élevé", "Disruption satellite"]
    }
  },
  industrie: {
    id: "industrie",
    label: "Industrie",
    criticalNodes: [
      "PMI manufacturier",
      "Chaîne d'approvisionnement mondiale",
      "Budgets défense (OTAN 2% PIB)",
      "Investissements infrastructure",
      "Guerre Ukraine (défense)",
      "Nearshoring/reshoring",
      "Coûts énergie"
    ],
    supplyDemandDrivers: {
      supply: [
        "Capacités de production",
        "Disponibilité matières premières",
        "Main d'œuvre qualifiée",
        "Logistique (fret maritime, ferroviaire)",
        "Énergie (coûts)",
        "Chaîne d'approvisionnement (Asie)",
        "Automatisation/robotique",
        "Permis environnementaux"
      ],
      demand: [
        "Commandes industrielles",
        "Dépenses défense (OTAN)",
        "Construction (BTP)",
        "Aéronautique (backlog Airbus/Boeing)",
        "Automobile",
        "Infrastructure (ponts, routes)",
        "Énergie (éoliennes, solaire)",
        "Spatial"
      ]
    },
    keyIndicators: [
      "PMI Global (ISM, Markit)",
      "Budget défense OTAN (% PIB)",
      "Backlog Airbus/Boeing",
      "Freight Index (Baltic Dry, transport)",
      "Commandes biens durables",
      "Taux d'utilisation capacités",
      "Capex industriel",
      "Book-to-bill ratio"
    ],
    geographicRisks: [
      "Tensions commerciales US-Chine",
      "Guerre Ukraine (défense, énergie)",
      "Supply chain Asie",
      "Coûts énergie Europe",
      "Protectionnisme (IRA, subventions)",
      "Régulation environnementale"
    ],
    structuralFactors: [
      "Réindustrialisation Europe/US",
      "Automatisation/robotique",
      "Décarbonation industrie",
      "Impression 3D/fabrication additive",
      "Industrie 4.0 (IoT, IA)",
      "Nearshoring",
      "Économie circulaire",
      "Défense (tensions géopolitiques)"
    ],
    correlations: {
      positive: ["Croissance économique", "Dépenses infrastructure", "Tensions géopolitiques (défense)", "Nearshoring", "Capex"],
      negative: ["Récession", "Disruption supply chain", "Coûts matières premières", "Dollar fort", "Protectionnisme"]
    }
  },
  services: {
    id: "services",
    label: "Services Publics",
    criticalNodes: [
      "Taux d'intérêt (valorisation)",
      "Transition énergétique",
      "Régulation tarifaire",
      "Subventions (IRA, Green Deal)",
      "Prix gaz/électricité",
      "Sécheresses (hydro)",
      "Vagues de chaleur/froid"
    ],
    supplyDemandDrivers: {
      supply: [
        "Capacités renouvelables (éolien, solaire)",
        "Centrales nucléaires",
        "Réseaux électriques (transmission)",
        "Stockage (batteries, hydro)",
        "Gaz naturel (centrales)",
        "Maintenance/vieillissement actifs",
        "Permis construction",
        "Interconnexions"
      ],
      demand: [
        "Consommation électrique",
        "Électrification (véhicules, chauffage)",
        "Industrie énergivore (data centers)",
        "Climatisation (été)",
        "Chauffage (hiver)",
        "Croissance économique",
        "Efficacité énergétique",
        "Hydrogène vert"
      ]
    },
    keyIndicators: [
      "Taux 10 ans (valorisation)",
      "Capacités renouvelables installées",
      "Prix électricité spot",
      "Subventions IRA/Green Deal",
      "Dividend yield",
      "Regulated asset base (RAB)",
      "Capex renouvelables",
      "Load factor (taux de charge)"
    ],
    geographicRisks: [
      "Régulation européenne (prix)",
      "Politiques nationales (mix énergétique)",
      "Interconnexions réseaux",
      "Sécheresses (hydro)",
      "Vagues chaleur (demande)",
      "Nucléaire (politique)"
    ],
    structuralFactors: [
      "Transition énergétique (horizon 20-30 ans)",
      "Décentralisation production",
      "Smart grids",
      "Hydrogène vert",
      "Stockage batteries",
      "Électrification transport",
      "Vieillissement réseaux",
      "Résilience climatique"
    ],
    correlations: {
      positive: ["Taux bas", "Subventions vertes", "Électrification", "Croissance économique", "Inflation (actif réel)"],
      negative: ["Taux élevés", "Régulation stricte prix", "Concurrence renouvelables", "Efficacité énergétique", "Récession"]
    }
  },
  transport: {
    id: "transport",
    label: "Transport",
    criticalNodes: [
      "Prix carburant (jet fuel, diesel)",
      "Reprise trafic post-Covid",
      "E-commerce (fret)",
      "Régulation émissions (EU ETS)",
      "Grèves sectorielles",
      "Congestion ports/aéroports",
      "Géopolitique (routes commerciales)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Capacités (avions, camions, navires)",
        "Main d'œuvre (pilotes, chauffeurs, marins)",
        "Infrastructure (aéroports, ports, routes)",
        "Coûts carburant",
        "Maintenance/vieillissement flotte",
        "Régulation (heures de vol, repos)",
        "Slots aéroportuaires",
        "Capacités portuaires"
      ],
      demand: [
        "Trafic passagers (business, loisirs)",
        "Fret e-commerce",
        "Commerce international",
        "Tourisme",
        "Supply chain (just-in-time)",
        "Périshables (alimentaire)",
        "Nearshoring (moins de fret longue distance)",
        "Urbanisation (mobilité urbaine)"
      ]
    },
    keyIndicators: [
      "Prix jet fuel",
      "Trafic aérien (% vs 2019)",
      "Baltic Dry Index (fret maritime)",
      "Croissance livraisons e-commerce",
      "Load factor (taux de remplissage)",
      "Yield (prix moyen)",
      "Congestion ports (temps attente)",
      "Taux fret ($/TEU)"
    ],
    geographicRisks: [
      "Congestion ports (Asie, US West Coast)",
      "Grèves sectorielles (pilotes, dockers)",
      "Régulation émissions EU (ETS)",
      "Géopolitique (Mer Rouge, détroits)",
      "Protectionnisme (cabotage)",
      "Infrastructure vieillissante"
    ],
    structuralFactors: [
      "Décarbonation (SAF, électrification)",
      "Automatisation (camions autonomes, drones)",
      "Nearshoring (moins de fret longue distance)",
      "Drones livraison",
      "Hyperloop/nouveaux modes",
      "Vieillissement flotte",
      "Consolidation sectorielle",
      "Mobilité urbaine (micro-mobilité)"
    ],
    correlations: {
      positive: ["Croissance économique", "E-commerce", "Tourisme", "Commerce international", "Prix carburant bas"],
      negative: ["Prix carburant élevé", "Récession", "Télétravail structurel", "Nearshoring", "Régulation émissions"]
    }
  },
  automobile: {
    id: "automobile",
    label: "Automobile",
    criticalNodes: [
      "Transition électrique (VE)",
      "Semi-conducteurs (pénurie)",
      "Prix batteries/lithium",
      "Régulation émissions (EU, Chine)",
      "Subventions VE (IRA)",
      "Guerre commerciale (tarifs)",
      "Autonomie (réglementation)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Capacités production",
        "Semi-conducteurs",
        "Batteries (cellules)",
        "Matières premières (acier, aluminium)",
        "Main d'œuvre",
        "Chaîne d'approvisionnement (just-in-time)",
        "Usines batteries (gigafactories)",
        "Logiciel (OTA updates)"
      ],
      demand: [
        "Crédit auto",
        "Pouvoir d'achat",
        "Renouvellement parc (âge moyen)",
        "Urbanisation vs rural",
        "Mobilité partagée",
        "Flottes entreprises",
        "Marchés émergents",
        "Seconde main"
      ]
    },
    keyIndicators: [
      "Ventes VE (% total)",
      "Prix batteries ($/kWh)",
      "Inventaires concessionnaires",
      "Crédit auto (taux, délinquance)",
      "Backlog commandes",
      "Marges constructeurs",
      "Part marché Chine",
      "Autonomie moyenne VE"
    ],
    geographicRisks: [
      "Chine (30% marché mondial, VE)",
      "Europe (régulation stricte)",
      "US (IRA, protectionnisme)",
      "Chaîne d'approvisionnement batteries (Asie)",
      "Guerre commerciale (tarifs)",
      "Régulation locale (ZFE)"
    ],
    structuralFactors: [
      "Électrification (horizon 10-15 ans)",
      "Autonomie (L4/L5)",
      "Mobilité partagée vs propriété",
      "Software-defined vehicle",
      "Intégration verticale (Tesla model)",
      "Consolidation sectorielle",
      "Économie circulaire (recyclage batteries)",
      "Nouvelles marques chinoises"
    ],
    correlations: {
      positive: ["Crédit accessible", "Subventions VE", "Prix batteries baisse", "Pouvoir d'achat", "Renouvellement parc"],
      negative: ["Taux élevés", "Récession", "Pénurie semi-conducteurs", "Prix lithium élevé", "Saturation marché"]
    }
  },
  luxe: {
    id: "luxe",
    label: "Luxe",
    criticalNodes: [
      "Consommation Chine (30-40% marché)",
      "Tourisme international",
      "Richesse (marchés actions, crypto)",
      "Taux de change (euro/dollar)",
      "Zéro-Covid Chine",
      "Aspirational buyers",
      "Pricing power"
    ],
    supplyDemandDrivers: {
      supply: [
        "Savoir-faire artisanal",
        "Matières premières (cuir, métaux précieux)",
        "Capacités production (contrôlées)",
        "Distribution (boutiques, e-commerce)",
        "Marketing/brand equity",
        "Exclusivité (rareté)",
        "Acquisitions marques",
        "Talents créatifs"
      ],
      demand: [
        "HNWI (High Net Worth Individuals)",
        "Classe moyenne supérieure Chine",
        "Tourisme (duty-free)",
        "Aspirational buyers",
        "Génération Z (sneakers, streetwear)",
        "Seconde main (Vestiaire Collective)",
        "Gifting (Chine)",
        "Investissement (montres, sacs)"
      ]
    },
    keyIndicators: [
      "Ventes Chine (% total)",
      "Trafic touristes chinois",
      "Pricing (hausses prix)",
      "Croissance e-commerce",
      "Marges opérationnelles",
      "Richesse mondiale (HNWI)",
      "Taux de change",
      "Seconde main (volumes)"
    ],
    geographicRisks: [
      "Chine (30-40% marché, régulation)",
      "Tourisme international (visas, Covid)",
      "Taux de change (euro fort = moins attractif)",
      "Géopolitique (boycotts)",
      "Taxation (droits douane)",
      "Régulation e-commerce Chine"
    ],
    structuralFactors: [
      "Premiumisation (trading up)",
      "Génération Z (nouveaux codes)",
      "Durabilité/traçabilité",
      "Seconde main/économie circulaire",
      "Phygital (expérience)",
      "Consolidation (groupes)",
      "Chine (classe moyenne)",
      "NFT/métaverse"
    ],
    correlations: {
      positive: ["Richesse (actions, crypto)", "Tourisme", "Consommation Chine", "Aspirational buyers", "Pricing power"],
      negative: ["Récession", "Marchés actions baisse", "Restrictions tourisme", "Boycotts", "Euro fort"]
    }
  },
  agriculture: {
    id: "agriculture",
    label: "Agriculture & Alimentation",
    criticalNodes: [
      "Météo (sécheresses, inondations)",
      "Guerre Ukraine (blé, maïs)",
      "Prix engrais (gaz naturel)",
      "Chine (importations soja, porc)",
      "Restrictions export (Inde, Russie)",
      "Maladies (grippe aviaire, porcine)",
      "Biocarburants (demande)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Météo (rendements)",
        "Surfaces cultivées",
        "Engrais (prix, disponibilité)",
        "Eau (irrigation)",
        "Main d'œuvre",
        "Technologie (OGM, précision)",
        "Logistique (export)",
        "Stocks stratégiques"
      ],
      demand: [
        "Croissance population",
        "Changement régimes alimentaires (protéines)",
        "Biocarburants (éthanol, biodiesel)",
        "Alimentation animale",
        "Chine (importations)",
        "Gaspillage alimentaire",
        "Substituts (protéines alternatives)",
        "Stockage stratégique"
      ]
    },
    keyIndicators: [
      "Prix blé/maïs/soja (CBOT)",
      "Stocks mondiaux (ratio stocks/usage)",
      "Météo (NOAA, sécheresses)",
      "Prix engrais",
      "Exportations Ukraine/Russie",
      "Importations Chine",
      "Rendements (bushels/acre)",
      "Indice FAO"
    ],
    geographicRisks: [
      "Guerre Ukraine (30% blé mondial)",
      "Restrictions export (Inde riz, Russie blé)",
      "Chine (importations massives)",
      "Sécheresses (US, Brésil, Argentine)",
      "Mer Noire (corridor céréalier)",
      "Protectionnisme alimentaire"
    ],
    structuralFactors: [
      "Changement climatique (rendements)",
      "Croissance population (9 milliards 2050)",
      "Protéines alternatives (viande cultivée)",
      "Agriculture de précision",
      "Sécurité alimentaire",
      "Eau (stress hydrique)",
      "Régénération sols",
      "Vertical farming"
    ],
    correlations: {
      positive: ["Sécheresses", "Restrictions export", "Demande biocarburants", "Croissance population", "Chine importations"],
      negative: ["Rendements records", "Dollar fort", "Récession", "Substituts", "Gaspillage réduit"]
    }
  },
  media: {
    id: "media",
    label: "Médias & Divertissement",
    criticalNodes: [
      "Streaming wars (Netflix, Disney+)",
      "Publicité digitale (Google, Meta)",
      "Grèves Hollywood (WGA, SAG)",
      "Régulation (antitrust, contenu)",
      "Gaming (consoles, mobile)",
      "Sports rights (droits TV)",
      "IA générative (contenu)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Production contenu (films, séries)",
        "Talents (acteurs, réalisateurs)",
        "Studios (capacités)",
        "Droits sportifs",
        "Infrastructure streaming",
        "Publicité (inventaire)",
        "Gaming (développement)",
        "IA générative (contenu)"
      ],
      demand: [
        "Abonnements streaming",
        "Publicité (budgets entreprises)",
        "Gaming (consoles, mobile, PC)",
        "Cinéma (post-Covid)",
        "Sports (audiences)",
        "Podcasts",
        "UGC (user-generated content)",
        "Temps d'attention"
      ]
    },
    keyIndicators: [
      "Abonnés streaming (Netflix, Disney+)",
      "Dépenses publicité digitale",
      "Box office (cinéma)",
      "Ventes jeux vidéo",
      "Audiences TV/streaming",
      "ARPU (revenu par utilisateur)",
      "Churn rate",
      "Coûts contenu"
    ],
    geographicRisks: [
      "Régulation Chine (contenu, gaming)",
      "Europe (DSA, DMA)",
      "Droits sportifs (inflation)",
      "Piratage",
      "Censure (marchés émergents)",
      "Taxation services numériques"
    ],
    structuralFactors: [
      "Streaming vs linéaire",
      "Publicité vs abonnement",
      "IA générative (création contenu)",
      "Gaming (cloud, métaverse)",
      "Consolidation (M&A)",
      "Fragmentation audiences",
      "UGC vs professionnel",
      "Attention economy"
    ],
    correlations: {
      positive: ["Croissance abonnés", "Publicité digitale", "Gaming", "Sports", "Contenu premium"],
      negative: ["Récession (publicité)", "Saturation streaming", "Piratage", "Fragmentation", "Coûts contenu"]
    }
  },
  assurance: {
    id: "assurance",
    label: "Assurance",
    criticalNodes: [
      "Catastrophes naturelles (ouragans, incendies)",
      "Taux d'intérêt (revenus placements)",
      "Inflation (coûts sinistres)",
      "Régulation (Solvabilité II)",
      "Réassurance (capacités, prix)",
      "Cyber-risques",
      "Longévité (retraites)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Capacités réassurance",
        "Capital (fonds propres)",
        "Souscription (discipline)",
        "Placements (obligations)",
        "Modèles risques",
        "Régulation (capital requis)",
        "Catastrophes (épuisement capital)",
        "ILS (insurance-linked securities)"
      ],
      demand: [
        "Croissance économique",
        "Patrimoine (assurance biens)",
        "Vieillissement (santé, vie)",
        "Régulation (assurance obligatoire)",
        "Risques émergents (cyber, climat)",
        "Litiges (responsabilité civile)",
        "Catastrophes (sinistres)",
        "Inflation (reconstruction)"
      ]
    },
    keyIndicators: [
      "Combined ratio (<100% = profitable)",
      "Taux d'intérêt (revenus placements)",
      "Catastrophes naturelles (coûts)",
      "Prix réassurance",
      "Ratio Solvabilité II",
      "Primes écrites",
      "Réserves sinistres",
      "ROE (return on equity)"
    ],
    geographicRisks: [
      "Catastrophes naturelles (Floride, Californie)",
      "Régulation (Solvabilité II Europe)",
      "Litiges (US)",
      "Changement climatique (côtes)",
      "Cyber-attaques",
      "Pandémies"
    ],
    structuralFactors: [
      "Changement climatique (fréquence catastrophes)",
      "Cyber-risques (croissance)",
      "Longévité (retraites)",
      "Inflation (coûts sinistres)",
      "Insurtech (disruption)",
      "Données/IA (pricing)",
      "Régulation (capital)",
      "Consolidation"
    ],
    correlations: {
      positive: ["Taux élevés", "Discipline souscription", "Prix réassurance", "Croissance économique", "Patrimoine"],
      negative: ["Catastrophes naturelles", "Taux bas", "Inflation sinistres", "Litiges", "Cyber-attaques"]
    }
  },
  crypto: {
    id: "crypto",
    label: "Crypto & Blockchain",
    criticalNodes: [
      "Régulation (SEC, MiCA Europe)",
      "ETF Bitcoin/Ethereum",
      "Adoption institutionnelle",
      "Taux Fed (risk-on/risk-off)",
      "Stablecoins (régulation)",
      "Hacks/faillites (FTX-style)",
      "Halving Bitcoin"
    ],
    supplyDemandDrivers: {
      supply: [
        "Mining (hashrate, coûts énergie)",
        "Émission tokens (tokenomics)",
        "Staking (locked supply)",
        "Exchanges (liquidité)",
        "Régulation (restrictions)",
        "Halving Bitcoin (réduction émission)",
        "Unlocks tokens (vesting)",
        "Faillites (ventes forcées)"
      ],
      demand: [
        "Adoption institutionnelle (ETF)",
        "Retail (FOMO)",
        "DeFi (yield farming)",
        "NFT (volumes)",
        "Paiements (adoption)",
        "Hedge inflation",
        "Spéculation",
        "Adoption pays émergents"
      ]
    },
    keyIndicators: [
      "Prix Bitcoin/Ethereum",
      "Dominance Bitcoin",
      "Volumes exchanges",
      "Flows ETF",
      "TVL DeFi (Total Value Locked)",
      "Hashrate Bitcoin",
      "Stablecoins market cap",
      "Fear & Greed Index"
    ],
    geographicRisks: [
      "Régulation US (SEC)",
      "Europe (MiCA)",
      "Chine (interdiction)",
      "Taxation (capital gains)",
      "Banking access (débancarisation)",
      "Énergie (mining, ESG)"
    ],
    structuralFactors: [
      "Adoption institutionnelle",
      "CBDC (concurrence)",
      "Régulation (clarification)",
      "Scalabilité (L2)",
      "Interopérabilité",
      "Custody (sécurité)",
      "ESG (proof-of-stake)",
      "Tokenisation actifs réels"
    ],
    correlations: {
      positive: ["Risk-on", "Taux bas", "Dollar faible", "Adoption institutionnelle", "ETF flows", "Halving"],
      negative: ["Risk-off", "Taux élevés", "Régulation stricte", "Hacks", "Faillites exchanges", "Récession"]
    }
  },
  biotechnologie: {
    id: "biotechnologie",
    label: "Biotechnologie",
    criticalNodes: [
      "Résultats essais cliniques",
      "Approbations FDA/EMA",
      "Financement (IPO, VC)",
      "Taux d'intérêt (valorisation)",
      "M&A (Big Pharma)",
      "Breakthrough therapies",
      "Échecs cliniques"
    ],
    supplyDemandDrivers: {
      supply: [
        "Pipeline R&D",
        "Financement (VC, IPO)",
        "Talents scientifiques",
        "CRO/CDMO (capacités)",
        "Technologie (CRISPR, mRNA)",
        "Propriété intellectuelle",
        "Partenariats Big Pharma",
        "Régulation (fast track)"
      ],
      demand: [
        "Maladies rares (orphan drugs)",
        "Oncologie",
        "Maladies neurodégénératives",
        "Maladies auto-immunes",
        "Thérapies géniques",
        "Médecine personnalisée",
        "Vieillissement population",
        "Besoins médicaux non satisfaits"
      ]
    },
    keyIndicators: [
      "Taux de succès essais cliniques",
      "Financement VC biotech",
      "IPO biotech",
      "M&A (montants, multiples)",
      "Approbations FDA",
      "Taux d'intérêt (valorisation)",
      "XBI Index (biotech)",
      "Cash runway (trésorerie)"
    ],
    geographicRisks: [
      "Régulation FDA/EMA",
      "Financement (marchés)",
      "Propriété intellectuelle",
      "Essais cliniques (recrutement)",
      "Manufacturing (CDMO)",
      "Remboursement"
    ],
    structuralFactors: [
      "Thérapies géniques/cellulaires",
      "CRISPR/édition génomique",
      "mRNA (au-delà Covid)",
      "IA drug discovery",
      "Médecine personnalisée",
      "Maladies rares",
      "Vieillissement population",
      "Consolidation (M&A)"
    ],
    correlations: {
      positive: ["Succès cliniques", "M&A", "Financement VC", "Breakthrough therapies", "Taux bas"],
      negative: ["Échecs cliniques", "Taux élevés", "Marchés baissiers", "Régulation stricte", "Cash burn"]
    }
  },
  spatial: {
    id: "spatial",
    label: "Spatial & Défense",
    criticalNodes: [
      "Budgets défense (OTAN 2% PIB)",
      "Tensions géopolitiques",
      "Lancements satellites (Starlink)",
      "Contrats gouvernementaux",
      "Guerre Ukraine",
      "Chine (tensions Taiwan)",
      "New Space (commercialisation)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Capacités production (avions, missiles)",
        "Chaîne d'approvisionnement",
        "Main d'œuvre qualifiée",
        "Lancements (SpaceX, Ariane)",
        "Technologies (hypersonique, furtivité)",
        "Certifications (sécurité)",
        "Capacités satellites",
        "Matières premières (titane, composites)"
      ],
      demand: [
        "Budgets défense (OTAN)",
        "Modernisation armées",
        "Satellites (communication, observation)",
        "Missiles (Ukraine, Moyen-Orient)",
        "Drones",
        "Cyberdéfense",
        "Spatial commercial (tourisme, mining)",
        "Constellation satellites (Starlink)"
      ]
    },
    keyIndicators: [
      "Budgets défense (% PIB)",
      "Backlog commandes",
      "Lancements orbitaux",
      "Contrats gouvernementaux",
      "Tensions géopolitiques",
      "Satellites déployés",
      "Coûts lancement ($/kg)",
      "Free cash flow"
    ],
    geographicRisks: [
      "Tensions US-Chine (Taiwan)",
      "Guerre Ukraine",
      "Moyen-Orient",
      "OTAN (engagement 2% PIB)",
      "Export controls (ITAR)",
      "Souveraineté (Europe)"
    ],
    structuralFactors: [
      "Tensions géopolitiques (long terme)",
      "New Space (commercialisation)",
      "Réutilisabilité (SpaceX)",
      "Constellations satellites",
      "Hypersonique",
      "Drones autonomes",
      "Cyberdéfense",
      "Tourisme spatial"
    ],
    correlations: {
      positive: ["Tensions géopolitiques", "Budgets défense", "Guerre", "Modernisation", "New Space"],
      negative: ["Paix", "Coupes budgétaires", "Échecs lancements", "Régulation export", "Accidents"]
    }
  },
  ecommerce: {
    id: "ecommerce",
    label: "E-commerce & Retail",
    criticalNodes: [
      "Pouvoir d'achat consommateurs",
      "Coûts logistique (last mile)",
      "Concurrence (Amazon, Alibaba)",
      "Régulation (DMA Europe)",
      "Retour en magasin (post-Covid)",
      "Social commerce (TikTok)",
      "Paiements (BNPL)"
    ],
    supplyDemandDrivers: {
      supply: [
        "Infrastructure logistique (entrepôts)",
        "Last mile delivery",
        "Inventaires",
        "Technologie (IA, personnalisation)",
        "Paiements (infrastructure)",
        "Main d'œuvre (entrepôts, livreurs)",
        "Chaîne d'approvisionnement",
        "Capacités cloud"
      ],
      demand: [
        "Pouvoir d'achat",
        "Adoption e-commerce (pénétration)",
        "Mobile commerce",
        "Social commerce",
        "Catégories (alimentaire, mode)",
        "Génération Z",
        "Pays émergents",
        "Commodité vs expérience"
      ]
    },
    keyIndicators: [
      "Pénétration e-commerce (% retail)",
      "GMV (Gross Merchandise Value)",
      "Take rate (commission)",
      "Coûts acquisition client (CAC)",
      "Coûts logistique",
      "Conversion rate",
      "Mobile (% ventes)",
      "Retours (taux)"
    ],
    geographicRisks: [
      "Régulation (DMA, DSA Europe)",
      "Taxation (marketplace)",
      "Concurrence locale",
      "Logistique (infrastructure)",
      "Paiements (fragmentation)",
      "Protectionnisme"
    ],
    structuralFactors: [
      "Pénétration e-commerce (croissance)",
      "Social commerce",
      "Live commerce (Chine)",
      "Quick commerce (10-15 min)",
      "Recommerce (seconde main)",
      "D2C vs marketplace",
      "IA (personnalisation)",
      "Durabilité (retours, emballages)"
    ],
    correlations: {
      positive: ["Pouvoir d'achat", "Adoption mobile", "Social commerce", "Pays émergents", "Commodité"],
      negative: ["Récession", "Coûts logistique", "Régulation", "Retour magasin", "Saturation marché"]
    }
  },
}

// Fonction pour obtenir le contexte d'analyse d'un secteur
export function getSectorAnalysisContext(sectorId: string): string {
  const framework = SECTOR_FRAMEWORKS[sectorId]
  if (!framework) return ''
  
  return `
CONTEXTE D'ANALYSE SECTORIELLE - ${framework.label}

Nœuds critiques à surveiller:
${framework.criticalNodes.map(n => `- ${n}`).join('\n')}

Drivers Offre/Demande:
OFFRE: ${framework.supplyDemandDrivers.supply.join(', ')}
DEMANDE: ${framework.supplyDemandDrivers.demand.join(', ')}

Indicateurs clés: ${framework.keyIndicators.join(', ')}

Risques géographiques: ${framework.geographicRisks.join(', ')}

Facteurs structurels (long terme): ${framework.structuralFactors.join(', ')}

Corrélations positives: ${framework.correlations.positive.join(', ')}
Corrélations négatives: ${framework.correlations.negative.join(', ')}

RÈGLES D'ANALYSE:
1. Filtre Offre/Demande: L'actualité touche-t-elle l'offre ou la demande?
2. Filtre Temporel: Est-ce structurel (>5 ans) ou conjoncturel (<1 an)?
3. Filtre Prix: Est-ce déjà "priced in" ou est-ce une surprise?
4. Filtre Géographique: Quel impact régional et contagion possible?
5. Filtre Chaîne de valeur: Quels acteurs sont impactés (upstream/downstream)?
`
}

// Fonction pour obtenir tous les secteurs disponibles
export function getAllSectors(): Array<{ id: string; label: string }> {
  return Object.values(SECTOR_FRAMEWORKS).map(f => ({
    id: f.id,
    label: f.label
  }))
}

// Fonction pour rechercher des secteurs par mot-clé
export function searchSectorsByKeyword(keyword: string): SectorFramework[] {
  const lowerKeyword = keyword.toLowerCase()
  return Object.values(SECTOR_FRAMEWORKS).filter(framework => {
    const searchText = `
      ${framework.label}
      ${framework.criticalNodes.join(' ')}
      ${framework.supplyDemandDrivers.supply.join(' ')}
      ${framework.supplyDemandDrivers.demand.join(' ')}
      ${framework.keyIndicators.join(' ')}
      ${framework.structuralFactors.join(' ')}
    `.toLowerCase()
    
    return searchText.includes(lowerKeyword)
  })
}
