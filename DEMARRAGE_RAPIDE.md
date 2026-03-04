# 🚀 Démarrage Rapide - Market Intelligence

## ⚠️ Problème actuel : Backend non démarré

Vous voyez des erreurs WebSocket car le serveur backend n'est pas en cours d'exécution.

## ✅ Solution en 2 étapes

### Étape 1 : Ouvrir un nouveau terminal
Dans votre IDE ou terminal, ouvrez un **nouveau terminal** (gardez celui du frontend ouvert).

### Étape 2 : Démarrer le backend
```bash
cd server
npm run dev
```

Vous devriez voir :
```
✅ Database initialized
🚀 Server running on http://localhost:8000
📡 Stock Market WebSocket server running on ws://localhost:8001
```

## 🎯 Vérification

Une fois le backend démarré, **rechargez la page** dans votre navigateur.

Vous devriez voir :
- ✅ Plus d'erreurs WebSocket dans la console
- ✅ Le message d'avertissement orange disparaît
- ✅ La recherche d'actions fonctionne
- ✅ Les données de marché se chargent

## 📋 Commandes utiles

### Tout démarrer en une commande (recommandé)
```bash
./start-all.sh
```

### Démarrer séparément

**Terminal 1 - Frontend :**
```bash
npm run dev
```

**Terminal 2 - Backend :**
```bash
cd server
npm run dev
```

## 🔧 Dépannage

### Le backend ne démarre pas ?

1. **Vérifier les dépendances :**
   ```bash
   cd server
   npm install
   ```

2. **Vérifier le fichier .env :**
   ```bash
   cd server
   cp .env.example .env
   ```

3. **Vérifier les ports :**
   - Port 8000 doit être libre (API)
   - Port 8001 doit être libre (WebSocket)

### Tuer un processus qui bloque un port

**macOS/Linux :**
```bash
# Trouver le processus sur le port 8000
lsof -ti:8000 | xargs kill -9

# Trouver le processus sur le port 8001
lsof -ti:8001 | xargs kill -9
```

**Windows :**
```bash
# Trouver le processus
netstat -ano | findstr :8000

# Tuer le processus (remplacer PID par le numéro)
taskkill /PID <PID> /F
```

## 📊 Fonctionnalités disponibles après démarrage

- 🔍 **Recherche d'actions** : Barre de recherche avec suggestions
- 📈 **Graphiques en temps réel** : Candlestick charts avec 11 timeframes
- 🗺️ **Carte thermique** : Visualisation du marché avec D3.js
- 📊 **Comparaison** : Comparer jusqu'à 4 actions
- 👁️ **Watchlist** : Suivre vos actions favorites
- 🔔 **Alertes** : Notifications de prix
- 📰 **Actualités** : Flux d'actualités financières

## 💡 Astuce

Pour éviter de démarrer manuellement à chaque fois, utilisez :
```bash
./start-all.sh
```

Ce script démarre automatiquement le frontend ET le backend !
