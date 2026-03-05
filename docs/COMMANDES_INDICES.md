# 🚀 Commandes Rapides - Indices Boursiers

## Démarrage

### Backend
```bash
cd server
npm run dev
```
Le serveur démarre sur `http://localhost:8000`

### Frontend
```bash
npm run dev
```
L'application démarre sur `http://localhost:5173`

## Tests API

### Test de Santé
```bash
curl http://localhost:8000/api/health
```

### Un Seul Indice
```bash
# S&P 500
curl "http://localhost:8000/api/quote/^GSPC"

# NASDAQ
curl "http://localhost:8000/api/quote/^IXIC"

# DOW Jones
curl "http://localhost:8000/api/quote/^DJI"
```

### Plusieurs Indices
```bash
# 3 indices US
curl "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI"

# Tous les indices (10)
curl "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI,^RUT,^VIX,^FCHI,^GDAXI,^FTSE,^N225,000001.SS"
```

### Avec Formatage JSON
```bash
curl -s "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI" | python3 -m json.tool
```

### Avec Extraction de Données
```bash
# Afficher seulement les prix
curl -s "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI" | \
  python3 -c "import sys, json; [print(f\"{q['symbol']}: {q['price']}\") for q in json.load(sys.stdin)]"

# Afficher avec variations
curl -s "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI" | \
  python3 -c "import sys, json; [print(f\"{q['symbol']:10} {q['price']:>10.2f} {q['changePercent']:>+7.2f}%\") for q in json.load(sys.stdin)]"
```

## Tests Automatisés

### Script de Test Complet
```bash
./test-all-indices.sh
```

### Page de Test HTML
```bash
# macOS
open test-indexes.html

# Linux
xdg-open test-indexes.html

# Windows
start test-indexes.html
```

## Développement

### Vérifier les Diagnostics
```bash
# Vérifier les erreurs TypeScript
npm run type-check

# Vérifier le linting
npm run lint
```

### Rebuild
```bash
# Backend
cd server
npm run build

# Frontend
npm run build
```

## Débogage

### Logs Backend
```bash
# Voir les logs en temps réel
cd server
npm run dev | grep -i "quote\|index\|market"
```

### Tester un Symbole Spécifique
```bash
# Fonction helper
test_symbol() {
  echo "Testing $1..."
  curl -s "http://localhost:8000/api/quote/$1" | python3 -m json.tool
}

# Utilisation
test_symbol "^GSPC"
test_symbol "^IXIC"
test_symbol "BTC-USD"
```

### Vérifier le Cache
```bash
# Première requête (lente)
time curl -s "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI" > /dev/null

# Deuxième requête (rapide, depuis le cache)
time curl -s "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI" > /dev/null
```

## Monitoring

### Surveiller les Requêtes
```bash
# Surveiller les logs du backend
cd server
npm run dev 2>&1 | grep -E "GET|POST|quote"
```

### Tester la Performance
```bash
# Test de charge simple
for i in {1..10}; do
  curl -s "http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI" > /dev/null &
done
wait
echo "10 requêtes parallèles terminées"
```

## Nettoyage

### Vider le Cache Backend
```bash
# Redémarrer le backend
cd server
npm run dev
# Le cache est vidé au redémarrage
```

### Nettoyer les Dépendances
```bash
# Backend
cd server
rm -rf node_modules
npm install

# Frontend
rm -rf node_modules
npm install
```

## Raccourcis Utiles

### Alias Bash (à ajouter dans ~/.bashrc ou ~/.zshrc)
```bash
# Démarrer le backend
alias backend="cd server && npm run dev"

# Démarrer le frontend
alias frontend="npm run dev"

# Tester les indices
alias test-indices="./test-all-indices.sh"

# Tester l'API
alias test-api="curl -s 'http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI' | python3 -m json.tool"
```

### Scripts NPM Personnalisés (à ajouter dans package.json)
```json
{
  "scripts": {
    "test:indices": "./test-all-indices.sh",
    "test:api": "curl -s 'http://localhost:8000/api/quotes?symbols=^GSPC,^IXIC,^DJI'",
    "dev:all": "concurrently \"cd server && npm run dev\" \"npm run dev\""
  }
}
```

## Symboles Fréquents

### Indices US
```bash
^GSPC    # S&P 500
^IXIC    # NASDAQ
^DJI     # DOW Jones
^RUT     # Russell 2000
^VIX     # VIX (volatilité)
```

### Indices Europe
```bash
^FCHI    # CAC 40 (France)
^GDAXI   # DAX (Allemagne)
^FTSE    # FTSE 100 (UK)
```

### Indices Asie
```bash
^N225       # Nikkei 225 (Japon)
000001.SS   # Shanghai Composite (Chine)
^HSI        # Hang Seng (Hong Kong)
```

### Cryptos
```bash
BTC-USD  # Bitcoin
ETH-USD  # Ethereum
```

### Matières Premières
```bash
CL=F     # Pétrole WTI
GC=F     # Or
SI=F     # Argent
```

## Aide Rapide

### Problème: Backend ne démarre pas
```bash
cd server
rm -rf node_modules
npm install
npm run dev
```

### Problème: Indices ne s'affichent pas
```bash
# 1. Vérifier le backend
curl http://localhost:8000/api/health

# 2. Tester l'API
curl "http://localhost:8000/api/quotes?symbols=^GSPC"

# 3. Vérifier la console du navigateur
# Ouvrir DevTools (F12) et regarder les erreurs
```

### Problème: Rate Limit Yahoo Finance
```bash
# Attendre quelques minutes
# Ou augmenter le cache dans server/src/market-data.ts
# cacheDuration = 5 * 60 * 1000; // 5 minutes
```

## Documentation

- **Guide Complet**: `INDICES_YAHOO_FINANCE.md`
- **Guide Démarrage**: `GUIDE_INDICES.md`
- **Symboles**: `SYMBOLES_YAHOO_FINANCE.md`
- **Résumé**: `RESUME_CORRECTIONS.md`
- **Ce Fichier**: `COMMANDES_INDICES.md`
