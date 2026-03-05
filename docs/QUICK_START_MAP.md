# 🚀 Démarrage Rapide - Carte des Pétroliers

## Vous avez déjà configuré la clé API ✅

Voici comment tester la carte:

## 1. Démarrer l'application

```bash
npm run dev
```

## 2. Ouvrir la carte

1. Allez sur http://localhost:5173
2. Cliquez sur le secteur **Énergie** dans la sidebar
3. Cliquez sur la carte **WTI Crude** (avec l'icône 🗺️)
4. La carte s'ouvre en plein écran

## 3. Vérifier la connexion

Ouvrez la console du navigateur (F12) et vous devriez voir:

```
✅ Connected to AIS Stream
📡 Subscription sent - waiting for vessel data...
🚢 Oil tanker detected: [NOM DU NAVIRE] (Type: 80-89)
```

## 4. Que voir sur la carte

- **Marqueurs de navires** 🚢 qui tournent selon leur cap
- **Cliquez sur un navire** pour voir:
  - Nom et MMSI
  - Vitesse et cap
  - Destination et ETA
  - Type de navire

## 5. Temps d'attente

⏱️ **Important**: Les données AIS arrivent en temps réel mais peuvent prendre quelques minutes avant de voir les premiers navires, car:

- Les pétroliers ne transmettent pas tous en même temps
- Le filtre ne garde que les types 80-89 (tankers)
- La couverture dépend des zones maritimes actives

## 6. Optimiser la réception

Pour voir des navires plus rapidement, vous pouvez modifier la zone de couverture dans `OilTankerMap.tsx`:

```typescript
// Au lieu de la couverture globale:
BoundingBoxes: [
  [[-90, -180], [90, 180]]
]

// Essayez une zone spécifique (ex: Golfe Persique):
BoundingBoxes: [
  [[22, 48], [30, 58]]  // [lat_min, lon_min], [lat_max, lon_max]
]

// Ou plusieurs zones actives:
BoundingBoxes: [
  [[22, 48], [30, 58]],   // Golfe Persique
  [[27, -98], [31, -88]], // Golfe du Mexique
  [[50, -2], [52, 2]]     // Manche
]
```

## 7. Debug

Si aucun navire n'apparaît après 5 minutes:

1. **Vérifier la console** pour les erreurs
2. **Vérifier la clé API** dans `.env`
3. **Tester la connexion**:
   ```javascript
   // Dans la console du navigateur
   new WebSocket('wss://stream.aisstream.io/v0/stream')
   ```
4. **Vérifier le quota** sur votre compte aisstream.io

## 8. Zones maritimes actives

Les zones avec le plus de trafic pétrolier:

| Zone | Coordonnées | Description |
|------|-------------|-------------|
| Golfe Persique | 22-30°N, 48-58°E | Export pétrole Moyen-Orient |
| Détroit d'Ormuz | 25-27°N, 56-58°E | Point de passage clé |
| Golfe du Mexique | 27-31°N, 88-98°W | Production US offshore |
| Mer du Nord | 54-62°N, 0-8°E | Production Europe |
| Détroit de Malacca | 1-6°N, 98-105°E | Route Asie |
| Manche | 49-52°N, -2-2°E | Route Europe |

## 9. Statistiques attendues

Avec la couverture globale, vous devriez voir:
- **5-20 pétroliers** dans les premières 10 minutes
- **50+ pétroliers** après 1 heure (limite à 50 dans le code)
- Mises à jour toutes les **2-10 minutes** par navire

## 10. Fonctionnalités

- ✅ Connexion WebSocket en temps réel
- ✅ Filtrage automatique des pétroliers
- ✅ Rotation des icônes selon le cap
- ✅ Popups avec infos détaillées
- ✅ Auto-zoom sur les navires
- ✅ Limite de 50 navires max
- ✅ Indicateur de connexion

## Besoin d'aide?

- Documentation complète: `docs/OIL_TANKER_MAP.md`
- API aisstream.io: https://aisstream.io/documentation
- Support Leaflet: https://leafletjs.com/

---

**Bon voyage! ⚓**
