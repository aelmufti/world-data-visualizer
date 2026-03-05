# Preset CAC 40 pour la Carte Thermique

## Vue d'Ensemble

Un nouveau preset "CAC 40" a été ajouté à la carte thermique pour afficher les 40 principales actions de l'indice boursier français.

## Comment Utiliser

### Méthode 1: Preset CAC 40 (Recommandé)

1. Aller dans l'onglet "Stock Market"
2. Cliquer sur "Carte thermique"
3. Cliquer sur le bouton **"CAC 40"** dans la barre de presets
4. La carte affiche automatiquement les 40 actions françaises groupées par secteur

### Méthode 2: Mode Custom

Si vous voulez personnaliser la sélection:

1. Cliquer sur "Custom"
2. Utiliser la barre de recherche pour ajouter des actions françaises
3. Exemples de recherche:
   - "LVMH" → MC.PA
   - "Total" → TTE.PA
   - "Airbus" → AIR.PA
   - "BNP" → BNP.PA

## Composition du CAC 40

### Luxury & Consumer (5 actions)
- **MC.PA** - LVMH (Luxe)
- **OR.PA** - L'Oréal (Cosmétiques)
- **RMS.PA** - Hermès (Luxe)
- **KER.PA** - Kering (Luxe)
- **PP.PA** - Publicis (Communication)

### Energy & Utilities (3 actions)
- **TTE.PA** - TotalEnergies (Énergie)
- **ENGI.PA** - Engie (Utilities)
- **EDF.PA** - EDF (Utilities)

### Industrials (5 actions)
- **AIR.PA** - Airbus (Aéronautique)
- **SAF.PA** - Safran (Aéronautique)
- **SGO.PA** - Saint-Gobain (Matériaux)
- **VIE.PA** - Veolia (Services)
- **BOL.PA** - Bolloré (Logistique)

### Technology & Telecom (4 actions)
- **CAP.PA** - Capgemini (IT Services)
- **DSY.PA** - Dassault Systèmes (Software)
- **STM.PA** - STMicroelectronics (Semiconducteurs)
- **ORA.PA** - Orange (Telecom)

### Finance & Insurance (4 actions)
- **BNP.PA** - BNP Paribas (Banque)
- **ACA.PA** - Crédit Agricole (Banque)
- **GLE.PA** - Société Générale (Banque)
- **CS.PA** - AXA (Assurance)

### Healthcare & Pharma (2 actions)
- **SAN.PA** - Sanofi (Pharma)
- **EL.PA** - EssilorLuxottica (Optique)

### Retail & Services (4 actions)
- **CA.PA** - Carrefour (Distribution)
- **BN.PA** - Danone (Agroalimentaire)
- **DG.PA** - Vinci (Construction)
- **PUB.PA** - Publicis (Communication)

### Materials & Construction (4 actions)
- **AI.PA** - Air Liquide (Gaz industriels)
- **CS.PA** - AXA (Assurance)
- **ML.PA** - Michelin (Pneumatiques)
- **URW.PA** - Unibail-Rodamco (Immobilier)

### Automotive (2 actions)
- **RNO.PA** - Renault (Automobile)
- **STLA.PA** - Stellantis (Automobile)

## Format des Symboles Français

Les actions françaises utilisent le suffixe `.PA` (Paris):
- Format: `TICKER.PA`
- Exemples: `MC.PA`, `OR.PA`, `TTE.PA`

## Secteurs Détectés Automatiquement

La carte thermique détecte automatiquement le secteur de chaque action française:

| Secteur | Couleur Bordure | Actions |
|---------|-----------------|---------|
| Consumer Cyclical | Violet | MC.PA, OR.PA, RMS.PA, KER.PA, PP.PA, RNO.PA, STLA.PA |
| Energy | Orange | TTE.PA |
| Utilities | Cyan | ENGI.PA, EDF.PA |
| Industrial | Indigo | AIR.PA, SAF.PA, VIE.PA, BOL.PA, DG.PA |
| Technology | Bleu | CAP.PA, DSY.PA, STM.PA |
| Communication | Bleu-vert | ORA.PA, PUB.PA |
| Financial | Vert | BNP.PA, ACA.PA, GLE.PA, CS.PA |
| Healthcare | Rouge | SAN.PA, EL.PA |
| Consumer Defensive | Violet foncé | CA.PA, BN.PA |
| Materials | Jaune | SGO.PA, AI.PA, ML.PA |
| Real Estate | Rose | URW.PA |

## Visualisation Hiérarchique

La carte affiche les actions groupées par secteur avec:
- **Bordures colorées** par secteur
- **Labels de secteur** en haut de chaque groupe
- **Taille** proportionnelle à la capitalisation boursière
- **Couleur** basée sur la variation du jour (vert = hausse, rouge = baisse)

## Exemples de Recherche

### Rechercher une Action Française

Dans le mode Custom, vous pouvez rechercher par:

1. **Nom de l'entreprise**:
   - "LVMH" → MC.PA
   - "Total" → TTE.PA
   - "Airbus" → AIR.PA

2. **Symbole direct**:
   - "MC.PA"
   - "TTE.PA"
   - "AIR.PA"

### Combiner CAC 40 avec d'autres Actions

Mode Custom permet de mixer:
```
MC.PA (LVMH)
OR.PA (L'Oréal)
AAPL (Apple US)
MSFT (Microsoft US)
```

## Données en Temps Réel

Les données proviennent de Yahoo Finance et sont mises à jour:
- **Cache**: 1 minute
- **WebSocket**: Mises à jour toutes les 5 secondes
- **Heures de marché**: Euronext Paris (9h-17h30 CET)

## Test de l'API

### Test Simple
```bash
curl "http://localhost:8000/api/quotes?symbols=MC.PA,OR.PA,TTE.PA"
```

### Test Complet (10 actions)
```bash
curl "http://localhost:8000/api/quotes?symbols=MC.PA,OR.PA,TTE.PA,AIR.PA,BNP.PA,SAN.PA,CA.PA,AI.PA,RNO.PA,ORA.PA"
```

### Résultat Attendu
```json
[
  {
    "symbol": "MC.PA",
    "price": 502.2,
    "change": -18.3,
    "changePercent": -3.52,
    "volume": 0,
    "timestamp": "2026-03-04T00:31:40.271Z"
  },
  ...
]
```

## Comparaison avec d'autres Indices

### CAC 40 vs S&P 500

| Caractéristique | CAC 40 | S&P 500 |
|-----------------|--------|---------|
| Nombre d'actions | 40 | 50 (preset) |
| Pays | France | USA |
| Secteur dominant | Luxe/Consumer | Technology |
| Heures de marché | 9h-17h30 CET | 9h30-16h EST |
| Symboles | *.PA | Ticker simple |

### CAC 40 vs DAX

| Caractéristique | CAC 40 | DAX |
|-----------------|--------|-----|
| Nombre d'actions | 40 | 40 |
| Pays | France | Allemagne |
| Symboles | *.PA | *.DE |

## Cas d'Usage

### 1. Suivre le Marché Français

```
Objectif: Vue d'ensemble du marché français
Action: Cliquer sur preset "CAC 40"
Résultat: Carte avec les 40 actions groupées par secteur
```

### 2. Comparer Luxe Français

```
Objectif: Comparer LVMH, Hermès, Kering
Action: Mode Custom → Ajouter MC.PA, RMS.PA, KER.PA
Résultat: Carte avec les 3 géants du luxe
```

### 3. Secteur Énergie Européen

```
Objectif: Comparer TotalEnergies avec autres
Action: Mode Custom → TTE.PA, XOM (Exxon), CVX (Chevron)
Résultat: Comparaison France vs USA
```

### 4. Tech France vs USA

```
Objectif: Comparer tech français et américain
Action: Mode Custom → CAP.PA, DSY.PA, AAPL, MSFT, GOOGL
Résultat: Carte mixte France/USA
```

## Limitations

### Heures de Marché

Les actions françaises ne sont mises à jour que pendant les heures de marché Euronext:
- **Lundi-Vendredi**: 9h00 - 17h30 CET
- **Hors heures**: Données du dernier cours de clôture

### Volume

Le volume n'est pas toujours disponible via l'API Yahoo Finance pour les actions européennes.

### Délai

Les données peuvent avoir un léger délai (15-20 minutes) selon la source Yahoo Finance.

## Presets Disponibles

Après ajout du CAC 40, voici tous les presets:

1. **S&P 500 Top 50** - Top 50 actions US
2. **Market Indices** - Indices mondiaux
3. **CAC 40** - 40 actions françaises ⭐ NOUVEAU
4. **Sector ETFs** - ETFs sectoriels
5. **Technology ETFs** - ETFs tech
6. **Commodity ETFs** - ETFs matières premières
7. **Crypto & Digital Assets** - Cryptos
8. **Custom** - Personnalisé

## Prochaines Améliorations

- [ ] Preset DAX 40 (Allemagne)
- [ ] Preset FTSE 100 (UK)
- [ ] Preset Euro Stoxx 50
- [ ] Preset SMI (Suisse)
- [ ] Preset AEX (Pays-Bas)
- [ ] Preset IBEX 35 (Espagne)

## Conclusion

Le preset CAC 40 permet de suivre facilement le marché français avec:
- ✅ 40 actions principales
- ✅ Groupement par secteur
- ✅ Données en temps réel
- ✅ Visualisation hiérarchique
- ✅ Compatible avec mode custom pour personnalisation
