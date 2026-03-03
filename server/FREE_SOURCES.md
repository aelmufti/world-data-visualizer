# Sources de News Financières GRATUITES

## Option 1: RSS Feeds (Recommandé - 100% Gratuit)

Le worker `rss-worker.ts` utilise ces sources gratuites:

### Sources configurées:
1. **Reuters Business** - https://www.reutersagency.com/feed/
2. **Yahoo Finance** - https://finance.yahoo.com/news/rssindex
3. **MarketWatch** - https://www.marketwatch.com/rss/topstories
4. **Seeking Alpha** - https://seekingalpha.com/feed.xml
5. **CNBC** - https://www.cnbc.com/id/100003114/device/rss/rss.html
6. **Bloomberg** - Flux RSS publics

### Lancer le worker RSS:
```bash
npm run rss-worker
```

## Option 2: APIs Gratuites (avec limites)

### NewsAPI (100 requêtes/jour gratuit)
- URL: https://newsapi.org/
- Inscription: https://newsapi.org/register
- Gratuit: 100 requêtes/jour
- Payant: $449/mois pour 250k requêtes

Configuration:
```bash
NEWS_SOURCE_API_URL=https://newsapi.org/v2/everything
NEWS_SOURCE_API_KEY=votre_clé_ici
```

### Alpha Vantage (500 requêtes/jour gratuit)
- URL: https://www.alphavantage.co/
- Gratuit: 500 requêtes/jour
- Payant: $49-499/mois

### Finnhub (60 requêtes/minute gratuit)
- URL: https://finnhub.io/
- Gratuit: 60 req/min
- Payant: $59-399/mois

## Option 3: Web Scraping (Attention aux CGU)

Scraper directement les sites de news financières:
- Yahoo Finance
- Google Finance
- MarketWatch
- Seeking Alpha

⚠️ Vérifier les conditions d'utilisation de chaque site

## Recommandation

Pour démarrer:
1. **Utiliser le RSS worker** (gratuit, illimité)
2. Compléter avec **NewsAPI gratuit** (100 req/jour)
3. Passer à une API payante seulement si besoin de plus de volume

Le RSS worker peut facilement gérer 1000-5000 articles/jour gratuitement!
