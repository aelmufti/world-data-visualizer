# ✅ Carte des Pétroliers - Prête à l'Emploi

## Configuration Terminée

Votre carte interactive des pétroliers est maintenant **entièrement configurée** et prête à recevoir des données AIS en temps réel!

## Ce qui a été fait

### 1. Code WebSocket Activé ✅
- Connexion automatique à aisstream.io
- Filtrage des pétroliers (types 80-89)
- Logging détaillé dans la console

### 2. Zones Géographiques Optimisées ✅
Par défaut, la carte surveille les **4 zones à fort trafic**:
- 🌊 Golfe Persique (export pétrole Moyen-Orient)
- 🌊 Golfe du Mexique (production US)
- 🌊 Mer du Nord (production Europe)
- 🌊 Détroit de Malacca (route Asie)

### 3. Interface Améliorée ✅
- Compteur de navires en temps réel
- Indicateur de connexion
- Sélecteur de région (pour référence)

## Démarrage

```bash
npm run dev
```

Puis:
1. Ouvrez http://localhost:5173
2. Secteur **Énergie** → Carte **WTI Crude** 🗺️
3. Ouvrez la console (F12) pour voir les logs

## Ce que vous verrez dans la console

```
✅ Connected to AIS Stream
📡 Subscription sent for High Traffic Zones - waiting for vessel data...
🚢 Oil tanker detected: [NOM] (Type: 80)
🚢 Oil tanker detected: [NOM] (Type: 84)
...
```

## Temps d'attente estimé

| Temps | Navires attendus |
|-------|------------------|
| 1-2 min | 0-2 navires |
| 5 min | 3-8 navires |
| 10 min | 8-15 navires |
| 30 min | 20-40 navires |
| 1 heure | 40-50 navires (max) |

⚠️ **Note**: Les données AIS sont en temps réel. Si peu de navires transmettent dans les zones surveillées, il peut y avoir un délai.

## Fichiers Créés

```
src/components/
├── OilTankerMap.tsx          # Composant principal (WebSocket actif)
└── aisRegions.ts             # Zones géographiques prédéfinies

docs/
└── OIL_TANKER_MAP.md         # Documentation complète

QUICK_START_MAP.md            # Guide de démarrage
MAP_READY.md                  # Ce fichier
```

## Personnalisation Rapide

### Changer les zones surveillées

Dans `OilTankerMap.tsx`, ligne ~60:

```typescript
// Option 1: Zones à fort trafic (par défaut)
const boundingBoxes = getHighTrafficRegions()

// Option 2: Couverture globale
const boundingBoxes = [AIS_REGIONS[0].coordinates]

// Option 3: Zone spécifique (ex: Golfe Persique uniquement)
const boundingBoxes = [AIS_REGIONS[1].coordinates]

// Option 4: Zones personnalisées
const boundingBoxes = [
  [[22, 48], [30, 58]],   // Golfe Persique
  [[27, -98], [31, -88]]  // Golfe du Mexique
]
```

### Augmenter la limite de navires

Ligne ~90:

```typescript
return [...filtered, vessel].slice(-50) // Changez 50 à 100 ou plus
```

### Filtrer d'autres types de navires

Ligne ~85:

```typescript
// Actuellement: pétroliers uniquement (80-89)
if (metadata.ShipType >= 80 && metadata.ShipType <= 89)

// Pour tous les cargos (70-79):
if (metadata.ShipType >= 70 && metadata.ShipType <= 79)

// Pour tous les navires:
if (metadata.ShipType)
```

## Types de Navires AIS

| Code | Type |
|------|------|
| 70-79 | Cargo ships |
| 80-89 | Tankers (votre filtre actuel) |
| 90-99 | Other types |

## Dépannage

### Aucun navire après 10 minutes

1. **Vérifier la console** - Y a-t-il des erreurs?
2. **Vérifier la clé API** - Est-elle valide dans `.env`?
3. **Tester la connexion**:
   ```javascript
   // Dans la console du navigateur
   fetch('https://stream.aisstream.io/v0/stream')
   ```
4. **Essayer une zone plus large**:
   ```typescript
   const boundingBoxes = [AIS_REGIONS[0].coordinates] // Global
   ```

### Erreur de connexion WebSocket

- Vérifiez votre connexion internet
- Vérifiez que la clé API est correcte
- Consultez le statut d'aisstream.io

### Navires ne s'affichent pas sur la carte

- Vérifiez que `vessels.length > 0` dans la console
- Vérifiez les coordonnées (lat/lon doivent être valides)
- Essayez de rafraîchir la page

## Ressources

- 📖 [Documentation complète](docs/OIL_TANKER_MAP.md)
- 🚀 [Guide de démarrage](QUICK_START_MAP.md)
- 🌐 [API aisstream.io](https://aisstream.io/documentation)
- 🗺️ [Leaflet docs](https://leafletjs.com/)

## Prochaines Étapes

Vous pouvez maintenant:
- ✅ Tester la carte en temps réel
- ✅ Ajuster les zones géographiques
- ✅ Personnaliser l'affichage
- ✅ Ajouter des filtres supplémentaires
- ✅ Intégrer avec d'autres données (prix du pétrole, etc.)

## Support

Si vous rencontrez des problèmes:
1. Consultez les logs de la console
2. Vérifiez `QUICK_START_MAP.md`
3. Lisez `docs/OIL_TANKER_MAP.md`

---

**Tout est prêt! Lancez `npm run dev` et testez votre carte! 🚢⚓**
