# ✅ Vérification Rapide - Carte des Pétroliers

## Étapes de Vérification

### 1. Ouvrir l'Application
```
http://localhost:5173
```

### 2. Naviguer vers la Carte
1. Cliquer sur **Énergie** ⚡ (dans la sidebar gauche)
2. Cliquer sur la carte **WTI Crude** (avec l'icône 🗺️)
3. Une fenêtre modale devrait s'ouvrir en plein écran

### 3. Ouvrir la Console (F12)
- **Mac**: Cmd + Option + J
- **Windows**: Ctrl + Shift + J
- **Ou**: Clic droit → Inspecter → Console

### 4. Vérifier les Messages

Vous devriez voir dans la console:
```
📍 Demo vessels loaded (4 tankers)
✅ Connected to AIS Stream
📡 Subscription sent for High Traffic Zones - waiting for vessel data...
💡 Demo vessels shown initially. Real AIS data will appear as it arrives.
```

### 5. Vérifier la Carte

Sur la carte, vous devriez voir:
- ✅ Fond de carte (OpenStreetMap)
- ✅ 4 marqueurs de navires 🚢
- ✅ Contrôles de zoom (+/-)
- ✅ Compteur "4 vessels tracked"

### 6. Tester l'Interaction

- Cliquer sur un marqueur 🚢
- Une popup devrait s'ouvrir avec:
  - Nom du navire
  - MMSI
  - Vitesse
  - Cap
  - Destination
  - ETA

### 7. Vérifier les Emplacements

Les 4 navires de démo sont situés:
1. **CRUDE CARRIER 1** - Golfe du Mexique (Houston)
2. **VLCC PACIFIC** - Golfe Persique (vers Singapore)
3. **SUEZMAX ATLANTIC** - Manche (vers Rotterdam)
4. **AFRAMAX NORTH** - Mer du Nord (Stavanger)

## Si Rien ne S'Affiche

### Problème: Carte Grise/Vide

**Vérification 1**: CSS Leaflet
```javascript
// Dans la console
document.querySelector('link[href*="leaflet"]')
```
Devrait retourner un élément `<link>`, pas `null`.

**Solution**: Rafraîchir avec cache vidé
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

### Problème: Pas de Marqueurs

**Vérification 2**: Données chargées
```javascript
// Dans la console, cherchez le message
"📍 Demo vessels loaded (4 tankers)"
```

**Solution**: Attendre 2-3 secondes, ou fermer/rouvrir la carte

### Problème: Erreurs dans la Console

**Erreur Commune 1**: `Cannot find module 'leaflet'`
```bash
npm install leaflet react-leaflet@4.2.1 --legacy-peer-deps
npm run dev
```

**Erreur Commune 2**: `WebSocket connection error`
```bash
# Vérifier la clé API
cat .env | grep VITE_AISSTREAM_API_KEY
```

**Erreur Commune 3**: `Uncaught TypeError`
```bash
# Redémarrer le serveur
# Terminal: Ctrl+C puis npm run dev
```

## Tests Techniques

### Test 1: Vérifier Leaflet
```javascript
// Console du navigateur
typeof L !== 'undefined'
// Devrait retourner: true
```

### Test 2: Vérifier le Composant
```javascript
// Console du navigateur
document.querySelector('.leaflet-container')
// Devrait retourner: <div class="leaflet-container">
```

### Test 3: Vérifier les Tiles
```javascript
// Console du navigateur
document.querySelectorAll('.leaflet-tile').length
// Devrait retourner: un nombre > 0
```

### Test 4: Vérifier les Marqueurs
```javascript
// Console du navigateur
document.querySelectorAll('.leaflet-marker-icon').length
// Devrait retourner: 4
```

## Actions Correctives Rapides

### Action 1: Rafraîchir
```
Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
```

### Action 2: Redémarrer le Serveur
```bash
# Dans le terminal où tourne npm run dev
Ctrl+C
npm run dev
```

### Action 3: Vider le Cache du Navigateur
```
Chrome: Paramètres → Confidentialité → Effacer les données
Firefox: Préférences → Vie privée → Effacer l'historique
Safari: Développement → Vider les caches
```

### Action 4: Rebuild
```bash
npm run build
npm run dev
```

## Résultat Attendu

Après ces vérifications, vous devriez voir:

```
┌─────────────────────────────────────────────┐
│  🚢 Oil Tanker Tracking - WTI Crude        │
│  Live AIS data from oil tankers worldwide   │
│  ● Connected • 4 vessels tracked            │
│  • Showing demo data + live stream          │
├─────────────────────────────────────────────┤
│                                             │
│         [Carte avec 4 navires 🚢]          │
│                                             │
│  - Golfe du Mexique: 1 navire              │
│  - Golfe Persique: 1 navire                │
│  - Manche: 1 navire                         │
│  - Mer du Nord: 1 navire                    │
│                                             │
└─────────────────────────────────────────────┘
```

## Temps d'Attente pour Données Réelles

- **Immédiat**: 4 navires de démo
- **1-5 min**: Premiers navires réels (si disponibles)
- **10-30 min**: 10-30 navires réels
- **1 heure**: 30-50 navires réels (limite)

## Support

Si après toutes ces vérifications la carte ne s'affiche toujours pas:

1. **Copiez les logs de la console** (F12 → Console → Clic droit → Save as)
2. **Copiez les erreurs du terminal** (où tourne npm run dev)
3. **Vérifiez** `DEBUG_MAP.md` pour plus de détails

---

**La carte devrait maintenant afficher 4 navires de démonstration immédiatement! 🚢**
