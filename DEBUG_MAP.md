# 🐛 Debug - Carte des Pétroliers

## Problème: Rien ne s'affiche sur la carte

### Solutions Appliquées

1. ✅ **Ajout de données de démonstration**
   - 4 navires de démo chargés immédiatement
   - Les données réelles s'ajouteront au fur et à mesure

2. ✅ **CSS Leaflet ajouté**
   - Ajouté dans `index.html` via CDN
   - Déjà importé dans `src/main.tsx`

3. ✅ **Messages de debug améliorés**
   - Console indique le chargement des données
   - Interface indique "demo data + live stream"

## Vérifications à Faire

### 1. Ouvrir la Console du Navigateur (F12)

Vous devriez voir:
```
📍 Demo vessels loaded (4 tankers)
✅ Connected to AIS Stream
📡 Subscription sent for High Traffic Zones - waiting for vessel data...
💡 Demo vessels shown initially. Real AIS data will appear as it arrives.
```

### 2. Vérifier les Erreurs

Cherchez dans la console:
- ❌ Erreurs Leaflet
- ❌ Erreurs de chargement CSS
- ❌ Erreurs WebSocket
- ❌ Erreurs de rendu React

### 3. Vérifier le Réseau (Onglet Network)

- Leaflet CSS chargé? (leaflet.css)
- WebSocket connecté? (wss://stream.aisstream.io)
- Tiles de carte chargées? (tile.openstreetmap.org)

### 4. Vérifier l'État React

Dans la console:
```javascript
// Vérifier si le composant est monté
document.querySelector('.leaflet-container')
```

Devrait retourner un élément, pas `null`.

## Causes Possibles

### A. Carte Grise/Vide
**Cause**: CSS Leaflet non chargé
**Solution**: 
- Vérifier que le CSS est chargé dans Network
- Rafraîchir la page (Cmd+R ou Ctrl+R)
- Vider le cache (Cmd+Shift+R ou Ctrl+Shift+R)

### B. Pas de Marqueurs
**Cause**: Données non chargées
**Solution**:
- Vérifier la console pour "Demo vessels loaded"
- Vérifier que `vessels.length` > 0
- Attendre 2-3 secondes après ouverture

### C. Erreur "Cannot read property of undefined"
**Cause**: Leaflet non initialisé
**Solution**:
- Vérifier que react-leaflet est installé
- Redémarrer le serveur dev

### D. Carte ne s'ouvre pas
**Cause**: Erreur dans App.tsx
**Solution**:
- Vérifier la console pour erreurs React
- Vérifier que le clic sur WTI Crude fonctionne

## Tests Rapides

### Test 1: Vérifier l'Installation
```bash
npm list leaflet react-leaflet
```

Devrait afficher:
```
leaflet@1.9.x
react-leaflet@4.2.1
```

### Test 2: Vérifier le Build
```bash
npm run build
```

Devrait compiler sans erreurs.

### Test 3: Vérifier les Imports
Dans la console du navigateur:
```javascript
// Vérifier que Leaflet est chargé
typeof L !== 'undefined'
```

Devrait retourner `true`.

## Actions Correctives

### Si la carte est toujours vide:

1. **Rafraîchir la page**
   ```
   Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
   ```

2. **Redémarrer le serveur**
   ```bash
   # Arrêter le serveur (Ctrl+C)
   npm run dev
   ```

3. **Vérifier les logs du serveur**
   Cherchez des erreurs dans le terminal où tourne `npm run dev`

4. **Vérifier la clé API**
   ```bash
   cat .env | grep VITE_AISSTREAM_API_KEY
   ```

5. **Tester avec les DevTools**
   ```javascript
   // Dans la console
   console.log(import.meta.env.VITE_AISSTREAM_API_KEY)
   ```

## Checklist de Debug

- [ ] Console ouverte (F12)
- [ ] Onglet Console vérifié
- [ ] Onglet Network vérifié
- [ ] Onglet Elements vérifié (chercher `.leaflet-container`)
- [ ] Page rafraîchie (Cmd+Shift+R)
- [ ] Serveur redémarré
- [ ] Build réussi
- [ ] Clé API présente dans .env

## Logs Attendus

### Console - Succès
```
📍 Demo vessels loaded (4 tankers)
✅ Connected to AIS Stream
📡 Subscription sent for High Traffic Zones - waiting for vessel data...
💡 Demo vessels shown initially. Real AIS data will appear as it arrives.
```

### Console - Erreur Commune
```
❌ WebSocket connection error: [détails]
```
→ Vérifier la clé API

```
Error: Cannot find module 'leaflet'
```
→ Réinstaller: `npm install leaflet react-leaflet@4.2.1 --legacy-peer-deps`

```
Uncaught TypeError: Cannot read property 'lat' of undefined
```
→ Problème de données, vérifier le code

## Contact

Si le problème persiste après toutes ces vérifications:
1. Copiez les logs de la console
2. Copiez les erreurs du terminal
3. Vérifiez les fichiers modifiés

---

**Dernière mise à jour**: Ajout de données de démo + CSS Leaflet dans index.html
