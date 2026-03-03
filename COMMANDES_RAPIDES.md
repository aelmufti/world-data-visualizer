# ⚡ Commandes Rapides

## 🚀 Accès Direct

### Ouvrir l'Application
```bash
open http://localhost:5173
```

### Ouvrir la Carte des Pétroliers
1. Ouvrir http://localhost:5173
2. Cliquer sur **Énergie** (⚡)
3. Cliquer sur **WTI Crude** (🗺️)
4. Ouvrir Console (F12)

### Ouvrir Firestore UI
```bash
open http://127.0.0.1:4000/firestore
```

## 📊 Tester l'API

### Top Articles
```bash
curl 'http://localhost:8000/api/aggregated/top?limit=10' | python3 -m json.tool
```

### Articles par Secteur
```bash
# Énergie
curl 'http://localhost:8000/api/aggregated/sector/energy?limit=10' | python3 -m json.tool

# Technologie
curl 'http://localhost:8000/api/aggregated/sector/technology?limit=10' | python3 -m json.tool

# Finance
curl 'http://localhost:8000/api/aggregated/sector/finance?limit=10' | python3 -m json.tool
```

### Tous les Secteurs
```bash
curl 'http://localhost:8000/api/aggregated/all?topPerSector=5' | python3 -m json.tool
```

## 🔍 Vérifier les Services

### Vérifier les Ports
```bash
lsof -i :5173  # Frontend
lsof -i :8000  # Backend
lsof -i :8080  # Firestore
lsof -i :4000  # Firestore UI
```

### Vérifier les Processus
```bash
ps aux | grep "npm run dev"
ps aux | grep "firebase emulators"
```

## 📝 Voir les Logs

### Logs Firestore
```bash
tail -f server/firestore-debug.log
```

### Logs Firebase
```bash
tail -f server/firebase-debug.log
```

## 🛑 Arrêter les Services

### Arrêter Tout
```bash
# Dans chaque terminal où les services tournent
Ctrl + C
```

### Forcer l'Arrêt
```bash
# Si nécessaire
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:8080 | xargs kill -9  # Firestore
lsof -ti:4000 | xargs kill -9  # Firestore UI
```

## 🔄 Redémarrer un Service

### Frontend
```bash
npm run dev
```

### Backend
```bash
cd server
npm run dev
```

### RSS Worker
```bash
cd server
npm run rss-worker
```

### Firestore Emulator
```bash
cd server
firebase emulators:start --only firestore
```

## 🧪 Tests Rapides

### Test Frontend
```bash
curl -I http://localhost:5173
# Devrait retourner 200 OK
```

### Test Backend
```bash
curl -I http://localhost:8000/api/aggregated/top
# Devrait retourner 200 OK
```

### Test Firestore
```bash
curl -I http://127.0.0.1:8080
# Devrait retourner une réponse
```

## 🗺️ Carte des Pétroliers

### Vérifier la Connexion AIS
Ouvrez la console du navigateur (F12) et cherchez:
```
✅ Connected to AIS Stream
📡 Subscription sent for High Traffic Zones
🚢 Oil tanker detected: [NOM]
```

### Changer les Zones Surveillées
Éditez `src/components/OilTankerMap.tsx` ligne ~60:
```typescript
// Zones à fort trafic (par défaut)
const boundingBoxes = getHighTrafficRegions()

// OU couverture globale
const boundingBoxes = [AIS_REGIONS[0].coordinates]

// OU zone spécifique
const boundingBoxes = [AIS_REGIONS[1].coordinates] // Golfe Persique
```

## 📦 Gestion des Dépendances

### Installer les Dépendances
```bash
# Root
npm install

# Server
cd server && npm install
```

### Mettre à Jour
```bash
npm update
cd server && npm update
```

## 🔧 Build Production

### Build Frontend
```bash
npm run build
```

### Build Backend
```bash
cd server
npm run build
```

### Preview Production
```bash
npm run preview
```

## 🐛 Debug

### Vérifier les Variables d'Environnement
```bash
# Frontend
cat .env

# Backend
cat server/.env
```

### Vérifier la Configuration
```bash
# Package.json
cat package.json | grep scripts

# Vite config
cat vite.config.ts

# TypeScript config
cat tsconfig.json
```

### Nettoyer et Redémarrer
```bash
# Nettoyer les caches
rm -rf node_modules dist .vite
npm install

# Nettoyer Firestore
rm -rf server/firestore-debug.log
```

## 📚 Documentation

### Lire la Documentation
```bash
# Documentation principale
cat readme.md

# Carte des pétroliers
cat MAP_READY.md
cat QUICK_START_MAP.md
cat docs/OIL_TANKER_MAP.md

# État actuel
cat STATUS_FINAL.md
```

## 🎯 Raccourcis Utiles

### Tout en Une Commande
```bash
# Ouvrir tout
open http://localhost:5173 && \
open http://127.0.0.1:4000/firestore && \
curl 'http://localhost:8000/api/aggregated/top?limit=5' | python3 -m json.tool
```

### Vérifier Tout
```bash
echo "Frontend:" && curl -I http://localhost:5173 2>&1 | head -1 && \
echo "Backend:" && curl -I http://localhost:8000/api/aggregated/top 2>&1 | head -1 && \
echo "Firestore:" && curl -I http://127.0.0.1:8080 2>&1 | head -1
```

---

**Gardez ce fichier à portée de main pour un accès rapide! 🚀**
