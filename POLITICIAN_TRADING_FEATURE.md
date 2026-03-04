# 🏛️ Politician Trading Feature

## Vue d'ensemble

Nouvelle fonctionnalité permettant de suivre les transactions boursières des membres du Congrès américain (Chambre des représentants et Sénat) en temps réel.

## Sources de données

### APIs utilisées (gratuites, sans clé API)

Les données proviennent de House Stock Watcher et Senate Stock Watcher, mais sont proxifiées via le backend pour éviter les problèmes CORS.

1. **House Stock Watcher**
   - Source: `https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json`
   - Endpoint backend: `http://localhost:8000/api/politician-trading/house`
   - Données: Transactions de la Chambre des représentants

2. **Senate Stock Watcher**
   - Source: `https://senate-stock-watcher-data.s3-us-west-2.amazonaws.com/aggregate/all_transactions.json`
   - Endpoint backend: `http://localhost:8000/api/politician-trading/senate`
   - Données: Transactions du Sénat

3. **Endpoint combiné**
   - Endpoint backend: `http://localhost:8000/api/politician-trading/all`
   - Combine les deux sources en une seule requête

### Architecture Backend

Le backend Express proxifie les requêtes pour:
- Éviter les problèmes CORS
- Implémenter un cache de 5 minutes côté serveur
- Améliorer les performances
- Gérer les erreurs de manière centralisée

## Fonctionnalités

### 1. Transactions Récentes
- Affiche les 100 dernières transactions
- Tri par date décroissante
- Informations affichées:
  - Date de transaction
  - Nom du politicien (cliquable)
  - Description de l'actif
  - Type (achat/vente/échange)
  - Montant
  - Ticker

### 2. Top Traders
- Classement des 15 politiciens les plus actifs
- Métriques:
  - Total de transactions
  - Transactions des 30 derniers jours
  - Action la plus tradée
- Cartes cliquables pour voir le détail

### 3. Recherche
- Recherche par nom de politicien
- Exemples: "Nancy Pelosi", "Paul Pelosi", "Dan Crenshaw"
- Affiche toutes les transactions du politicien
- Compteur de résultats

## Architecture technique

### Backend Proxy (`politician-trading-endpoint.ts`)
```typescript
- GET /api/politician-trading/house: Récupère les données de la Chambre
- GET /api/politician-trading/senate: Récupère les données du Sénat
- GET /api/politician-trading/all: Combine les deux sources
- Cache serveur: 5 minutes
- Gestion CORS automatique
```

### Service Frontend (`politicianTradingService.ts`)
```typescript
- fetchHouseTrades(): Appelle le backend proxy
- fetchSenateTrades(): Appelle le backend proxy
- getAllTrades(): Récupère toutes les données via le backend
- getTradesByPolitician(name): Filtre par politicien
- getRecentTrades(limit): Récupère les N dernières transactions
- getTopTraders(limit): Calcule le classement
- Cache client: 5 minutes
```

### Composant (`PoliticianTradingTab.tsx`)
- Interface utilisateur complète
- 3 vues: Récentes, Top Traders, Recherche
- Gestion du loading et des erreurs
- Navigation fluide entre les vues

### Intégration
- Route: `/politician-trading`
- Navbar: Nouvel onglet "Trading Politique" 🏛️
- Pas de dépendances externes supplémentaires

## Utilisation

1. Cliquer sur l'onglet "Trading Politique" dans la navbar
2. Voir les transactions récentes par défaut
3. Utiliser la barre de recherche pour trouver un politicien spécifique
4. Cliquer sur "Top Traders" pour voir le classement
5. Cliquer sur un nom de politicien pour voir ses transactions

## Exemples de politiciens à rechercher

- **Nancy Pelosi** - Ancienne Speaker de la Chambre, très active
- **Paul Pelosi** - Mari de Nancy Pelosi, trader actif
- **Dan Crenshaw** - Représentant du Texas
- **Josh Gottheimer** - Représentant du New Jersey
- **Tommy Tuberville** - Sénateur de l'Alabama

## Cache et performance

- Cache backend de 5 minutes (NodeCache)
- Cache frontend de 5 minutes
- Chargement via backend proxy pour éviter CORS
- Tri et filtrage côté client pour une navigation rapide
- Endpoint combiné pour réduire les requêtes

## Améliorations futures possibles

1. Graphiques de performance des portfolios
2. Alertes sur les transactions de politiciens spécifiques
3. Analyse des tendances (quels secteurs sont populaires)
4. Comparaison avec la performance du marché
5. Export des données en CSV
6. Filtres avancés (par montant, par type, par date)
7. Intégration avec l'API Quiver Quantitative pour plus de données

## Notes

- Les données proviennent de sources officielles (STOCK Act disclosures)
- Les montants sont des fourchettes (ex: "$1,001 - $15,000")
- Certaines transactions peuvent ne pas avoir de ticker
- Les données sont publiques et légalement accessibles
