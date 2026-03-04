# Guide d'Utilisation de la Carte Thermique

## Vue d'Ensemble

La carte thermique (Heatmap) permet de visualiser les performances du marché en temps réel avec:
- **Taille**: Proportionnelle à la capitalisation boursière
- **Couleur**: Vert pour les hausses, rouge pour les baisses
- **Données en temps réel**: Mises à jour automatiques via WebSocket

## Presets Disponibles

### 1. 📈 Major Stocks
32 actions majeures des principaux secteurs:
- Technology: AAPL, MSFT, GOOGL, NVDA, META, CRM, AVGO, ADBE, CSCO
- Finance: JPM, V, MA, BAC, BRK-B
- Healthcare: JNJ, UNH, PFE, ABBV, MRK, TMO, LLY
- Energy: XOM, CVX
- Consumer: AMZN, TSLA, WMT, HD, COST, NKE, PG, PEP
- Industrial: ACN

**Utilisation**: Vue par défaut, idéale pour suivre les grandes capitalisations

### 2. 🌍 Market Indices
15 indices boursiers mondiaux:
- **US**: S&P 500 (^GSPC), NASDAQ (^IXIC), Dow Jones (^DJI), Russell 2000 (^RUT), VIX (^VIX)
- **Europe**: CAC 40 (^FCHI), DAX (^GDAXI), FTSE 100 (^FTSE), Euro Stoxx 50 (^STOXX50E)
- **Asie**: Nikkei 225 (^N225), Shanghai (000001.SS), ASX 200 (^AXJO), KOSPI (^KS11)
- **Amériques**: Bovespa (^BVSP), IPC Mexico (^MXX)

**Utilisation**: Pour une vue globale des marchés mondiaux

### 3. 🎯 Sector ETFs
20 ETFs sectoriels pour analyser les secteurs:
- Technology: XLK, VGT, IYW
- Finance: XLF, VFH, IYF
- Healthcare: XLV, VHT, IYH
- Energy: XLE, VDE, IYE
- Consumer: XLY (Discretionary), XLP (Staples), IYC
- Industrial: XLI
- Materials: XLB
- Utilities: XLU
- Real Estate: XLRE
- Communication: XLC

**Utilisation**: Pour identifier les secteurs performants

### 4. 💻 Technology ETFs
14 ETFs technologiques spécialisés:
- Large Cap Tech: QQQ, VGT, XLK
- Semiconductors: SOXX, SMH
- Innovation: ARKK, ARKW
- Software: IGV, QTEC
- Cybersecurity: HACK
- Fintech: FINX
- Cloud: CLOU, SKYY

**Utilisation**: Pour analyser en détail le secteur technologique

### 5. 🥇 Commodity ETFs
14 ETFs de matières premières:
- Métaux précieux: GLD (Or), SLV (Argent), PALL (Palladium)
- Énergie: USO (Pétrole), UNG (Gaz naturel)
- Agriculture: DBA
- Diversifiés: DBC, PDBC, GSG, BCI, COMT
- Métaux industriels: GCC, CPER (Cuivre)
- Uranium: URA

**Utilisation**: Pour suivre les matières premières et l'inflation

### 6. ₿ Crypto & Digital Assets
12 symboles crypto et actions liées:
- Cryptomonnaies: BTC-USD (Bitcoin), ETH-USD (Ethereum)
- ETFs Crypto: BITO, BITI, GBTC, ETHE
- Mining & Exchange: COIN (Coinbase), MARA, RIOT, CLSK, HUT, BITF

**Utilisation**: Pour suivre l'écosystème crypto

## Mode Custom

### Comment utiliser

1. Cliquer sur le bouton **"Custom"**
2. Entrer les symboles dans le champ de texte
3. Séparer par virgule ou espace
4. Cliquer sur **"Load"**

### Exemples de symboles valides

```
Actions US
AAPL MSFT GOOGL AMZN NVDA TSLA

Indices mondiaux
^GSPC ^IXIC ^DJI ^FCHI ^GDAXI

ETFs populaires
SPY QQQ IWM DIA VTI VOO

Cryptomonnaies
BTC-USD ETH-USD SOL-USD ADA-USD

Mix personnalisé
AAPL ^GSPC QQQ BTC-USD GLD TSLA
```

### Formats de symboles supportés

| Type | Format | Exemples |
|------|--------|----------|
| Actions US | TICKER | AAPL, MSFT, GOOGL |
| Indices US | ^TICKER | ^GSPC, ^IXIC, ^DJI |
| Indices Europe | ^TICKER | ^FCHI, ^GDAXI, ^FTSE |
| Indices Asie | ^TICKER ou 000000.XX | ^N225, 000001.SS |
| ETFs | TICKER | QQQ, SPY, GLD, SLV |
| Cryptos | TICKER-USD | BTC-USD, ETH-USD |

## Filtres par Secteur

Une fois les données chargées, utilisez le filtre "Filter" pour afficher uniquement:
- All Sectors (tous)
- Technology
- Finance
- Healthcare
- Energy
- Consumer
- Industrial
- Index (pour les indices)
- ETF (pour les ETFs)
- Crypto (pour les cryptos)

## Interactions

### Survol (Hover)
Affiche une tooltip avec:
- Nom complet du symbole
- Variation en pourcentage
- Capitalisation boursière
- Volume

### Clic
Ouvre la vue détaillée du symbole avec:
- Graphique en chandelier
- Données historiques
- Actualités liées

## Tests API

### Test d'un preset
```bash
# Major Stocks
curl "http://localhost:8000/api/quotes?symbols=AAPL,MSFT,GOOGL,AMZN,NVDA"

# Indices
curl "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI"

# ETFs
curl "http://localhost:8000/api/quotes?symbols=QQQ,SPY,GLD,SLV"

# Crypto
curl "http://localhost:8000/api/quotes?symbols=BTC-USD,ETH-USD,COIN"
```

### Test avec formatage
```bash
curl -s "http://localhost:8000/api/quotes?symbols=AAPL,^GSPC,QQQ,BTC-USD" | python3 -m json.tool
```

### Script de test complet
```bash
./test-heatmap-presets.sh
```

## Mises à Jour en Temps Réel

La carte thermique se met à jour automatiquement via WebSocket:
- Connexion: `ws://localhost:8000/stock-prices`
- Fréquence: Toutes les 5 secondes
- Données: Prix et variations en temps réel

Les couleurs changent dynamiquement selon les variations de prix.

## Conseils d'Utilisation

### Pour l'analyse de marché
1. Commencer par **Market Indices** pour la vue globale
2. Passer à **Sector ETFs** pour identifier les secteurs performants
3. Zoomer sur **Major Stocks** dans les secteurs intéressants

### Pour le trading
1. Utiliser **Major Stocks** pour les opportunités sur grandes caps
2. **Technology ETFs** pour les tendances tech
3. **Crypto & Digital Assets** pour les actifs numériques

### Pour la diversification
1. **Commodity ETFs** pour l'exposition aux matières premières
2. **Market Indices** pour la diversification géographique
3. Mode **Custom** pour créer un portefeuille personnalisé

## Limitations

- Maximum recommandé: 50 symboles par vue (performance)
- Certains symboles peuvent ne pas avoir de données en temps réel
- Les cryptos peuvent avoir des délais de mise à jour plus longs
- Les indices asiatiques ne sont mis à jour que pendant leurs heures de marché

## Dépannage

### Aucune donnée affichée
- Vérifier que le serveur backend est démarré: `http://localhost:8000/api/health`
- Vérifier la console du navigateur pour les erreurs

### Symbole non trouvé
- Vérifier l'orthographe du symbole
- Utiliser le format correct (^GSPC pour S&P 500, BTC-USD pour Bitcoin)
- Certains symboles peuvent ne pas être disponibles sur Yahoo Finance

### Mises à jour lentes
- Vérifier la connexion WebSocket dans la console
- Le cache API est de 1 minute, les données peuvent être légèrement retardées
