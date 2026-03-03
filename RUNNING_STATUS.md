# 🚀 Application en Cours d'Exécution

## ✅ Tous les Services Actifs

### 1. Frontend (Vite) - Port 5173
- **Status**: ✅ Running
- **URL**: http://localhost:5173
- **Commande**: `npm run dev`
- **Logs**: Terminal 38

### 2. Backend API - Port 8000
- **Status**: ✅ Running
- **URL**: http://localhost:8000
- **Commande**: `npm run dev` (dans server/)
- **Logs**: Terminal 41
- **Firestore**: Émulateur sur localhost:8080

### 3. RSS Worker
- **Status**: ✅ Running
- **Commande**: `npm run rss-worker` (dans server/)
- **Logs**: Terminal 42
- **Feeds**: 20 sources RSS surveillées
- **Articles**: ~82 articles récupérés

## 🗺️ Carte des Pétroliers

La carte est maintenant **active et connectée** à aisstream.io!

### Comment y accéder:
1. Ouvrez http://localhost:5173
2. Cliquez sur le secteur **Énergie** (⚡)
3. Cliquez sur la carte **WTI Crude** (avec l'icône 🗺️)
4. La carte s'ouvre en plein écran

### Ce qui se passe:
- ✅ Connexion WebSocket à aisstream.io
- ✅ Surveillance de 4 zones à fort trafic pétrolier
- ✅ Filtrage automatique des pétroliers (types 80-89)
- ✅ Affichage en temps réel sur la carte

### Console du navigateur (F12):
Vous verrez:
```
✅ Connected to AIS Stream
📡 Subscription sent for High Traffic Zones - waiting for vessel data...
🚢 Oil tanker detected: [NOM DU NAVIRE] (Type: 80-89)
```

### Zones surveillées:
- 🌊 **Golfe Persique** (22-30°N, 48-58°E)
- 🌊 **Golfe du Mexique** (27-31°N, 88-98°W)
- 🌊 **Mer du Nord** (54-62°N, 0-8°E)
- 🌊 **Détroit de Malacca** (1-6°N, 98-105°E)

### Temps d'attente:
- **1-5 min**: 0-5 navires
- **10 min**: 5-15 navires
- **30 min**: 15-30 navires
- **1 heure**: 30-50 navires (limite)

## 📊 Endpoints API Disponibles

### Articles par secteur
```bash
curl "http://localhost:8000/api/aggregated/sector/energy?limit=15"
curl "http://localhost:8000/api/aggregated/sector/technology?limit=15"
```

### Top articles globaux
```bash
curl "http://localhost:8000/api/aggregated/top?limit=30"
```

### Tous les secteurs
```bash
curl "http://localhost:8000/api/aggregated/all?topPerSector=10"
```

## 🔍 Vérification Rapide

### Frontend
```bash
curl http://localhost:5173
# Devrait retourner du HTML
```

### Backend
```bash
curl http://localhost:8000/api/aggregated/top?limit=5
# Devrait retourner du JSON avec des articles
```

## 🛑 Arrêter les Services

Pour arrêter tous les services:
```bash
# Dans le terminal où vous avez lancé les commandes
Ctrl + C (dans chaque terminal)
```

Ou utilisez les commandes Kiro pour arrêter les processus.

## 📝 Logs en Temps Réel

### Frontend (Terminal 38)
```bash
# Voir les logs Vite
```

### Backend (Terminal 41)
```bash
# Voir les requêtes API
# Voir les erreurs Firestore
```

### RSS Worker (Terminal 42)
```bash
# Voir l'ingestion des articles
# Voir les erreurs de feeds
```

## 🎯 Prochaines Actions

1. **Tester la carte**: Ouvrez http://localhost:5173 → Énergie → WTI Crude
2. **Ouvrir la console**: F12 pour voir les logs AIS
3. **Attendre les navires**: 5-10 minutes pour voir les premiers pétroliers
4. **Explorer les données**: Cliquez sur les marqueurs pour voir les détails

## 🐛 Dépannage

### Carte ne charge pas
- Vérifiez que le frontend tourne sur :5173
- Vérifiez la console pour les erreurs
- Vérifiez que la clé API est dans `.env`

### Pas de navires
- Attendez 5-10 minutes
- Vérifiez les logs de la console
- Vérifiez la connexion WebSocket

### Erreurs API
- Vérifiez que le backend tourne sur :8000
- Vérifiez que Firestore émulateur est actif
- Vérifiez les logs du terminal 41

## 📚 Documentation

- `MAP_READY.md` - Configuration de la carte
- `QUICK_START_MAP.md` - Guide de démarrage
- `docs/OIL_TANKER_MAP.md` - Documentation complète
- `readme.md` - Documentation générale

---

**Tout est opérationnel! Profitez de votre carte des pétroliers en temps réel! 🚢⚓**

*Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}*
