# 🏛️ Politician Trading Feature - Guide Complet

## 🎉 Solution GRATUITE Disponible!

Obtenez des données actuelles de trading politique (2024-2025) **GRATUITEMENT** avec Apify!

## Options Disponibles

### Option 1: Apify (RECOMMANDÉ - GRATUIT) ⭐

**Meilleur choix pour la plupart des utilisateurs**

- ✅ **100% GRATUIT**: 5,000 résultats/mois
- ✅ **Données actuelles**: 2024-2025
- ✅ **Pas de carte de crédit**
- ✅ **House + Senate**

**Configuration**: Voir `APIFY_FREE_SETUP.md`

### Option 2: Quiver Quant (Payant)

**Pour usage intensif**

- 💰 **$10/mois**
- ✅ **Données actuelles**: 2024-2025
- ✅ **Illimité**
- ✅ **API professionnelle**

**Configuration**: Voir `POLITICIAN_TRADING_API_SETUP.md`

### Option 3: GitHub (Gratuit mais obsolète)

**Fallback automatique**

- ✅ **Gratuit**
- ❌ **Données de 2020**
- ⚠️  **Obsolète**

## Quick Start (5 minutes)

### Avec Apify (Gratuit)

```bash
# 1. S'inscrire sur https://apify.com (gratuit)
# 2. Obtenir votre API token (Settings → Integrations)
# 3. Ajouter dans server/.env:
echo "APIFY_API_KEY=apify_api_votre_cle" >> server/.env

# 4. Redémarrer le serveur
cd server
npm run dev

# 5. Ouvrir l'app et aller sur "Trading Politique"
```

### Sans API (Données 2020)

```bash
# Rien à faire - utilise GitHub automatiquement
# Affiche un avertissement sur les données obsolètes
```

## Fonctionnalités

### Interface Utilisateur
- 📊 **Transactions Récentes**: 100 dernières transactions
- 🏆 **Top Traders**: 15 politiciens les plus actifs
- 🔍 **Recherche**: Par nom de politicien
- ⚠️  **Avertissements**: Détection automatique des données obsolètes
- 🔄 **Actualisation**: Bouton pour recharger les données

### Données Affichées
- Date de transaction
- Nom du politicien
- Ticker (symbole boursier)
- Type (Achat/Vente/Échange)
- Montant (fourchette)
- Description de l'actif

## Architecture

```
Frontend (React)
    ↓
Backend Express (Port 8000)
    ↓
Priorité 1: Apify (gratuit, actuel)
Priorité 2: Quiver (payant, actuel)
Priorité 3: GitHub (gratuit, 2020)
```

## Fichiers Importants

### Backend
- `server/src/politician-trading-endpoint.ts` - API proxy
- `server/src/index.ts` - Configuration routes

### Frontend
- `src/components/PoliticianTradingTab.tsx` - Interface
- `src/services/politicianTradingService.ts` - Service données
- `src/App.tsx` - Routing
- `src/components/Navbar.tsx` - Navigation

### Documentation
- `APIFY_FREE_SETUP.md` - **Guide Apify (GRATUIT)**
- `POLITICIAN_TRADING_API_SETUP.md` - Guide Quiver (payant)
- `SOLUTION_GRATUITE_APIFY.md` - Résumé solution gratuite
- `README_POLITICIAN_TRADING.md` - Ce fichier

## Vérification

### Vérifier le statut
```bash
curl http://localhost:8000/api/politician-trading/status
```

### Tester les données
```bash
curl http://localhost:8000/api/politician-trading/all | jq '.[0]'
```

## Dépannage

### Données toujours de 2020
**Solution**: Configurez `APIFY_API_KEY` dans `server/.env`

### Erreur "No data sources available"
**Solution**: Au moins une source doit être configurée (Apify recommandé)

### Le serveur ne démarre pas
**Solution**: 
```bash
cd server
npm install
npm run dev
```

## Comparaison Détaillée

| Critère | Apify | Quiver | GitHub |
|---------|-------|--------|--------|
| **Coût** | Gratuit | $10/mois | Gratuit |
| **Données** | 2024-2025 | 2024-2025 | 2020 |
| **Limite** | 5K/mois | Illimité | Illimité |
| **Setup** | 5 min | 5 min | Aucun |
| **Carte bancaire** | Non | Oui | Non |
| **Recommandé** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |

## Exemples de Politiciens

Recherchez ces noms pour voir des transactions:
- **Tommy Tuberville** - Très actif
- **Nancy Pelosi** - Célèbre pour ses trades
- **Paul Pelosi** - Mari de Nancy
- **Dan Crenshaw** - Représentant Texas
- **Bill Hagerty** - Sénateur Tennessee

## Utilisation Typique

### Scénario 1: Usage Personnel
- **Solution**: Apify (gratuit)
- **Limite**: 5K/mois = ~5 chargements
- **Coût**: $0

### Scénario 2: App Publique
- **Solution**: Quiver ($10/mois)
- **Limite**: Illimité
- **Coût**: $10/mois

### Scénario 3: Demo/Test
- **Solution**: GitHub (fallback)
- **Limite**: Illimité
- **Coût**: $0
- **Note**: Données de 2020

## Support

### Questions Apify
- Documentation: https://docs.apify.com
- Actor: https://apify.com/johnvc/us-congress-financial-disclosures-and-stock-trading-data

### Questions Quiver
- Site: https://api.quiverquant.com
- Documentation: https://www.quiverquant.com/api

### Questions Code
- Voir les fichiers de documentation
- Vérifier les logs du serveur

## Prochaines Étapes

1. **Choisir votre option**:
   - Gratuit → Apify
   - Illimité → Quiver
   - Test → GitHub (automatique)

2. **Configurer** (si Apify/Quiver):
   - S'inscrire
   - Obtenir clé API
   - Ajouter dans `.env`
   - Redémarrer

3. **Utiliser**:
   - Ouvrir l'app
   - Cliquer "Trading Politique"
   - Explorer les données!

## Conclusion

La fonctionnalité est **complète et production-ready** avec 3 options:

1. **Apify** (gratuit) - Recommandé pour 99% des cas
2. **Quiver** (payant) - Pour usage intensif
3. **GitHub** (fallback) - Automatique si rien configuré

**Recommandation**: Utilisez Apify (gratuit) pour des données actuelles!

---

**Status**: ✅ COMPLET avec solution gratuite
**Dernière mise à jour**: 2026
