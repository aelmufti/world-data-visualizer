# 🆓 Solution GRATUITE: Apify pour les Données de Trading Politique

## ✅ MEILLEURE OPTION GRATUITE

**Apify** offre un tier gratuit avec 5,000 résultats par mois - parfait pour obtenir des données actuelles (2024-2025) GRATUITEMENT!

## Pourquoi Apify?

- ✅ **GRATUIT**: 5,000 résultats/mois sans carte de crédit
- ✅ **Données actuelles**: 2024-2025 (pas de données de 2020!)
- ✅ **House + Senate**: Les deux chambres du Congrès
- ✅ **Fiable**: Scraper maintenu et mis à jour
- ✅ **Facile**: Configuration en 5 minutes

## Configuration (5 minutes)

### Étape 1: Créer un compte Apify

1. Allez sur [https://apify.com](https://apify.com)
2. Cliquez sur "Sign up" (gratuit)
3. Créez votre compte (email + mot de passe)
4. Pas besoin de carte de crédit! 🎉

### Étape 2: Obtenir votre clé API

1. Une fois connecté, allez dans **Settings** (⚙️)
2. Cliquez sur **Integrations**
3. Trouvez votre **API Token**
4. Copiez-le (commence par `apify_api_...`)

### Étape 3: Configurer votre app

Ajoutez la clé dans `server/.env`:

```env
APIFY_API_KEY=apify_api_votre_cle_ici
```

### Étape 4: Redémarrer le serveur

```bash
cd server
npm run dev
```

### Étape 5: Vérifier

```bash
curl http://localhost:8000/api/politician-trading/status
```

Devrait afficher:
```json
{
  "apifyConfigured": true,
  "dataSource": "Apify (FREE tier - current data)",
  "recommendation": "Using Apify free tier"
}
```

## C'est tout! 🎉

Vous avez maintenant accès à des données actuelles de 2024-2025 GRATUITEMENT!

## Limites du Tier Gratuit

- **5,000 résultats/mois**: Largement suffisant pour une app personnelle
- **Pas de carte de crédit requise**
- **Pas d'expiration**: Gratuit pour toujours

### Calcul d'utilisation

- 1 chargement de page = ~1,000 transactions
- 5 chargements par mois = OK
- Si vous dépassez: Les données anciennes (GitHub) seront utilisées automatiquement

## Comparaison des Options

| Option | Coût | Données | Limite |
|--------|------|---------|--------|
| **Apify** | **GRATUIT** | **2024-2025** | **5K/mois** |
| Quiver | $10/mois | 2024-2025 | Illimité |
| GitHub | Gratuit | 2020 | Illimité |

## Recommandation

**Utilisez Apify!** C'est gratuit et vous donne des données actuelles.

## Upgrade si nécessaire

Si vous dépassez 5,000 résultats/mois:
- **Option 1**: Payer Apify (~$5-10/mois pour plus)
- **Option 2**: Passer à Quiver ($10/mois illimité)
- **Option 3**: Optimiser (cache plus long, moins de requêtes)

## Fonctionnalités Apify

Le scraper Apify récupère:
- ✅ Transactions récentes (6 derniers mois par défaut)
- ✅ House + Senate
- ✅ Tous les détails: ticker, montant, date, politicien
- ✅ Métadonnées: filing ID, PDF quality, etc.

## Format des Données

```json
{
  "id": "unique-id",
  "Owner": "Self",
  "Asset": "Apple Inc. Common Stock",
  "Ticker": "AAPL",
  "Transaction_Type": "Purchase",
  "Date": "2024-01-15",
  "Amount_Range": "$1,001-$15,000",
  "First_Name": "Nancy",
  "Last_Name": "Pelosi",
  "State_District": "CA-11",
  "House": "House"
}
```

## Dépannage

### Erreur: "Apify API key not configured"
**Solution**: Vérifiez que `APIFY_API_KEY` est dans `server/.env`

### Erreur: "Apify run timeout"
**Solution**: Le scraper prend 30-60 secondes la première fois. Réessayez.

### Données toujours de 2020
**Solution**: 
1. Vérifiez que la clé API est correcte
2. Redémarrez le serveur
3. Videz le cache (attendez 5 minutes)

## Support

- **Documentation Apify**: [https://docs.apify.com](https://docs.apify.com)
- **Actor Congress**: [https://apify.com/johnvc/us-congress-financial-disclosures-and-stock-trading-data](https://apify.com/johnvc/us-congress-financial-disclosures-and-stock-trading-data)

## Exemples de Politiciens (2024-2025)

Avec Apify, vous verrez des trades récents comme:
- Tommy Tuberville - Apple (Jan 2026)
- Nancy Pelosi - Microsoft (Dec 2025)
- Dan Crenshaw - Tesla (Nov 2025)
- Bill Hagerty - EQT Corp (Aug 2025)

Au lieu de:
- Vieux trades de 2020
- Politiciens qui ne sont plus en fonction

## Conclusion

**Apify = Solution parfaite et GRATUITE** pour obtenir des données actuelles de trading politique!

Pas besoin de payer $10/mois pour Quiver si vous utilisez Apify. 🎉
