# 📊 Symboles Yahoo Finance - Guide de Référence

## Indices Actuellement Utilisés

### États-Unis 🇺🇸

| Symbole | Nom Complet | Description | Heures de Trading |
|---------|-------------|-------------|-------------------|
| `^GSPC` | S&P 500 | Indice des 500 plus grandes entreprises américaines cotées en bourse | 9:30 - 16:00 ET |
| `^IXIC` | NASDAQ Composite | Indice du marché technologique américain | 9:30 - 16:00 ET |
| `^DJI` | Dow Jones Industrial Average | 30 grandes entreprises industrielles américaines | 9:30 - 16:00 ET |
| `^RUT` | Russell 2000 | Indice des petites capitalisations américaines | 9:30 - 16:00 ET |
| `^VIX` | CBOE Volatility Index | Mesure de la volatilité du marché (indice de peur) | 9:30 - 16:15 ET |

### Europe 🇪🇺

| Symbole | Nom Complet | Description | Heures de Trading |
|---------|-------------|-------------|-------------------|
| `^FCHI` | CAC 40 | 40 plus grandes entreprises françaises | 9:00 - 17:30 CET |
| `^GDAXI` | DAX | 40 plus grandes entreprises allemandes | 9:00 - 17:30 CET |
| `^FTSE` | FTSE 100 | 100 plus grandes entreprises britanniques | 8:00 - 16:30 GMT |

### Asie 🌏

| Symbole | Nom Complet | Description | Heures de Trading |
|---------|-------------|-------------|-------------------|
| `^N225` | Nikkei 225 | 225 plus grandes entreprises japonaises | 9:00 - 15:00 JST |
| `000001.SS` | Shanghai Composite | Indice de la bourse de Shanghai | 9:30 - 15:00 CST |

## Autres Indices Disponibles

### Indices Américains Supplémentaires

| Symbole | Nom | Description |
|---------|-----|-------------|
| `^NDX` | NASDAQ 100 | 100 plus grandes entreprises non-financières du NASDAQ |
| `^GSPTSE` | S&P/TSX Composite | Indice principal de la bourse de Toronto (Canada) |
| `^MXX` | IPC Mexico | Indice principal de la bourse mexicaine |
| `^BVSP` | Bovespa | Indice principal de la bourse brésilienne |

### Indices Européens Supplémentaires

| Symbole | Nom | Description |
|---------|-----|-------------|
| `^STOXX50E` | EURO STOXX 50 | 50 plus grandes entreprises de la zone euro |
| `^IBEX` | IBEX 35 | Indice principal de la bourse espagnole |
| `^FTSEMIB.MI` | FTSE MIB | Indice principal de la bourse italienne |
| `^AEX` | AEX | Indice principal de la bourse d'Amsterdam |
| `^SSMI` | SMI | Indice principal de la bourse suisse |

### Indices Asiatiques Supplémentaires

| Symbole | Nom | Description |
|---------|-----|-------------|
| `^HSI` | Hang Seng | Indice principal de la bourse de Hong Kong |
| `^TWII` | Taiwan Weighted | Indice principal de la bourse de Taiwan |
| `^KS11` | KOSPI | Indice principal de la bourse de Corée du Sud |
| `^AXJO` | ASX 200 | Indice principal de la bourse australienne |
| `^BSESN` | BSE Sensex | Indice principal de la bourse de Bombay (Inde) |

## Matières Premières

### Énergie

| Symbole | Nom | Description |
|---------|-----|-------------|
| `CL=F` | Crude Oil WTI | Pétrole brut West Texas Intermediate |
| `BZ=F` | Brent Crude Oil | Pétrole brut Brent |
| `NG=F` | Natural Gas | Gaz naturel |

### Métaux Précieux

| Symbole | Nom | Description |
|---------|-----|-------------|
| `GC=F` | Gold | Or |
| `SI=F` | Silver | Argent |
| `PL=F` | Platinum | Platine |
| `PA=F` | Palladium | Palladium |

### Métaux Industriels

| Symbole | Nom | Description |
|---------|-----|-------------|
| `HG=F` | Copper | Cuivre |
| `ALI=F` | Aluminum | Aluminium |

## Cryptomonnaies

| Symbole | Nom | Description |
|---------|-----|-------------|
| `BTC-USD` | Bitcoin | Bitcoin en USD |
| `ETH-USD` | Ethereum | Ethereum en USD |
| `BNB-USD` | Binance Coin | Binance Coin en USD |
| `XRP-USD` | Ripple | Ripple en USD |
| `ADA-USD` | Cardano | Cardano en USD |

## Devises (Forex)

| Symbole | Nom | Description |
|---------|-----|-------------|
| `EURUSD=X` | EUR/USD | Euro vs Dollar américain |
| `GBPUSD=X` | GBP/USD | Livre sterling vs Dollar américain |
| `USDJPY=X` | USD/JPY | Dollar américain vs Yen japonais |
| `USDCHF=X` | USD/CHF | Dollar américain vs Franc suisse |
| `AUDUSD=X` | AUD/USD | Dollar australien vs Dollar américain |

## Obligations

| Symbole | Nom | Description |
|---------|-----|-------------|
| `^TNX` | 10-Year Treasury | Rendement des obligations du Trésor américain à 10 ans |
| `^TYX` | 30-Year Treasury | Rendement des obligations du Trésor américain à 30 ans |
| `^FVX` | 5-Year Treasury | Rendement des obligations du Trésor américain à 5 ans |

## Comment Utiliser ces Symboles

### Dans l'API
```bash
# Un seul symbole
curl "http://localhost:8000/api/quote/^GSPC"

# Plusieurs symboles (max 50)
curl "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI"
```

### Dans le Code
```typescript
// Ajouter un nouvel indice
const NEW_INDEX = { symbol: '^NDX', name: 'NASDAQ 100' };

// Dans useMarketIndexes.ts
const INDEX_SYMBOLS = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^NDX', name: 'NASDAQ 100' }, // Nouveau
  // ...
];
```

## Notes Importantes

### Préfixes
- `^` : Indices boursiers (ex: ^GSPC)
- `=F` : Contrats à terme / Futures (ex: CL=F)
- `-USD` : Cryptomonnaies en USD (ex: BTC-USD)
- `=X` : Devises Forex (ex: EURUSD=X)
- `.SS` : Bourse de Shanghai (ex: 000001.SS)
- `.HK` : Bourse de Hong Kong (ex: 0700.HK)

### Limitations
- Yahoo Finance peut limiter le nombre de requêtes (rate limiting)
- Certains symboles peuvent ne pas être disponibles en temps réel
- Les données peuvent avoir un délai de 15-20 minutes pour certains marchés
- Les heures de trading varient selon les fuseaux horaires

### Bonnes Pratiques
- Utiliser le cache pour éviter trop de requêtes
- Grouper les requêtes avec l'endpoint `/quotes` (batch)
- Respecter les limites de rate limiting
- Gérer les erreurs et fournir des fallbacks

## Ressources

- [Yahoo Finance](https://finance.yahoo.com/)
- [Liste complète des symboles](https://finance.yahoo.com/lookup)
- [Documentation API Yahoo Finance](https://www.yahoofinanceapi.com/)
