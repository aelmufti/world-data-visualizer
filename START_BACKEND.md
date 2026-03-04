# Démarrage du Backend

## Problème actuel
Les erreurs WebSocket indiquent que le backend n'est pas démarré :
- `WebSocket connection to 'ws://localhost:8001/' failed`
- `WebSocket connection to 'ws://localhost:8000/api/ais-stream' failed`

## Solution : Démarrer le serveur backend

### Option 1 : Démarrage rapide avec le script
```bash
./start-all.sh
```

### Option 2 : Démarrage manuel du serveur
```bash
cd server
npm run dev
```

Le serveur devrait démarrer sur :
- API HTTP : `http://localhost:8000`
- WebSocket Stock Market : `ws://localhost:8001`
- WebSocket AIS : `ws://localhost:8000/api/ais-stream`

## Vérification
Une fois le serveur démarré, vous devriez voir :
- ✅ Les erreurs WebSocket disparaissent
- ✅ Les données de marché se chargent
- ✅ La recherche d'actions fonctionne
- ✅ Les graphiques s'affichent

## Commandes utiles

### Démarrer uniquement le frontend
```bash
npm run dev
```

### Démarrer uniquement le backend
```bash
cd server
npm run dev
```

### Démarrer les deux (recommandé)
```bash
./start-all.sh
```

## Ports utilisés
- Frontend (Vite) : `http://localhost:5173`
- Backend API : `http://localhost:8000`
- Backend WebSocket : `ws://localhost:8001`
