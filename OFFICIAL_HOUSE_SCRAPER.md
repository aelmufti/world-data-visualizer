# 🏛️ Solution OFFICIELLE et GRATUITE - House Scraper

## 🎉 LA MEILLEURE SOLUTION!

Scraping direct depuis le site officiel du gouvernement américain:
- ✅ **100% GRATUIT** - Aucun coût, jamais
- ✅ **100% OFFICIEL** - Source gouvernementale directe
- ✅ **100% À JOUR** - Données en temps réel
- ✅ **Pas d'API key** - Aucune inscription nécessaire
- ✅ **Illimité** - Pas de limite de requêtes

## Source Officielle

**U.S. House of Representatives Financial Disclosure**
- URL: https://disclosures-clerk.house.gov/
- Format: PDFs officiels (PTR - Periodic Transaction Reports)
- Mise à jour: En temps réel quand les politiciens déposent

## Installation (2 minutes)

### Prérequis: pdftotext

Le scraper a besoin de `pdftotext` pour convertir les PDFs en texte.

#### macOS
```bash
brew install poppler
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install poppler-utils
```

#### Vérifier l'installation
```bash
pdftotext -v
```

Devrait afficher la version de pdftotext.

## Utilisation

### Démarrer le serveur
```bash
cd server
npm run dev
```

Le scraper fonctionne automatiquement, aucune configuration nécessaire!

### Tester
```bash
# Obtenir toutes les transactions récentes
curl http://localhost:8000/api/politician-trading/all

# Obtenir les transactions de Nancy Pelosi
curl http://localhost:8000/api/politician-trading/politician/Pelosi

# Vérifier le statut
curl http://localhost:8000/api/politician-trading/status
```

## Comment ça marche

### 1. Recherche des filings
```bash
curl -s "https://disclosures-clerk.house.gov/FinancialDisclosure/ViewMemberSearchResult" \
  -X POST \
  --data "LastName=Pelosi&FilingYear=2026&submitForm=Submit"
```

### 2. Téléchargement des PDFs
```bash
curl -s "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20033725.pdf" \
  -o filing.pdf
```

### 3. Conversion en texte
```bash
pdftotext filing.pdf filing.txt
```

### 4. Parsing des données
Le scraper extrait:
- Nom du politicien
- État et district
- Ticker (GOOGL, AAPL, etc.)
- Type (Stock ou Option)
- Action (Purchase, Sale, Exchange)
- Dates
- Montants
- Notes

## Exemple de Données

```json
{
  "filingId": "20033725",
  "politician": "Nancy Pelosi",
  "state": "CA",
  "district": "11",
  "ticker": "GOOGL",
  "asset": "Alphabet Inc. - Class A Common Stock",
  "type": "ST",
  "action": "S",
  "transactionDate": "01/16/2026",
  "notificationDate": "01/16/2026",
  "amount": "$1,000,001 - $5,000,000",
  "owner": "SP",
  "note": "Exercised 50 call options..."
}
```

## Avantages vs Autres Solutions

| Solution | Coût | Officiel | À jour | Limite |
|----------|------|----------|--------|--------|
| **House Scraper** | **GRATUIT** | **✅ OUI** | **✅ OUI** | **Aucune** |
| Apify | Gratuit | ❌ Non | ✅ Oui | 5K/mois |
| Quiver | $10/mois | ❌ Non | ✅ Oui | Illimité |
| GitHub | Gratuit | ❌ Non | ❌ 2020 | Illimité |

## Performance

- **Premier chargement**: 10-30 secondes (télécharge et parse les PDFs)
- **Chargements suivants**: <100ms (cache 1 heure)
- **Cache**: 1 heure (les données ne changent pas souvent)

## Cache

Les PDFs téléchargés sont mis en cache dans `server/data/house-disclosures/`:
- `{filingId}.pdf` - PDF original
- `{filingId}.txt` - Texte extrait

Cela évite de re-télécharger les mêmes filings.

## API Endpoints

### GET /api/politician-trading/all
Récupère toutes les transactions récentes (50 derniers filings).

**Réponse:**
```json
{
  "trades": [...],
  "dataSource": "house-official",
  "count": 150
}
```

### GET /api/politician-trading/politician/:name
Récupère les transactions d'un politicien spécifique.

**Exemple:**
```bash
curl http://localhost:8000/api/politician-trading/politician/Pelosi?year=2026
```

**Réponse:**
```json
{
  "politician": "Pelosi",
  "year": "2026",
  "trades": [...],
  "count": 18
}
```

### GET /api/politician-trading/status
Vérifie le statut du scraper.

## Dépannage

### Erreur: "pdftotext: command not found"
**Solution**: Installez poppler
```bash
# macOS
brew install poppler

# Linux
sudo apt-get install poppler-utils
```

### Erreur: "No data sources available"
**Solution**: Vérifiez que pdftotext est installé
```bash
which pdftotext
```

### Données vides
**Solution**: 
1. Vérifiez que le site House est accessible
2. Attendez quelques secondes (premier chargement est lent)
3. Vérifiez les logs du serveur

### Cache ne se vide pas
**Solution**: Supprimez le dossier cache
```bash
rm -rf server/data/house-disclosures/*
```

## Limitations

- **Vitesse**: Premier chargement peut prendre 10-30 secondes
- **House seulement**: Pour le Sénat, utilisez Apify ou Quiver
- **Dépendance**: Nécessite pdftotext installé

## Améliorations Futures

1. **Parsing amélioré**: Meilleure extraction des notes
2. **Senate scraper**: Ajouter le scraping du Sénat
3. **Background jobs**: Scraper automatique toutes les heures
4. **Database**: Stocker dans DuckDB pour recherche rapide

## Conclusion

**C'est la MEILLEURE solution!**

- ✅ Gratuit
- ✅ Officiel
- ✅ À jour
- ✅ Illimité
- ✅ Pas d'API key

Seul prérequis: `pdftotext` (installation en 1 commande)

**Recommandation**: Utilisez cette solution pour la House, et Apify (gratuit) pour le Sénat si nécessaire.
