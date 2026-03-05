# 🔑 Comment Ajouter Votre Clé API AIS Stream

## Problème Actuel

La console affiche:
```
❌ AIS Stream API key not configured. Add VITE_AISSTREAM_API_KEY to .env
```

C'est pourquoi vous ne voyez que 4 navires de démo et aucune donnée réelle.

## Solution en 3 Étapes

### Étape 1: Obtenir une Clé API (Gratuite)

1. Allez sur **https://aisstream.io**
2. Cliquez sur **"Sign Up"** ou **"Get Started"**
3. Créez un compte (email + mot de passe)
4. Confirmez votre email
5. Connectez-vous et allez dans **"API Keys"** ou **"Dashboard"**
6. Copiez votre clé API (elle ressemble à: `abc123def456...`)

### Étape 2: Ajouter la Clé dans .env

Ouvrez le fichier `.env` à la racine du projet et ajoutez votre clé:

```env
# AIS Stream API pour suivi des pétroliers en temps réel
# Inscription gratuite sur: https://aisstream.io
VITE_AISSTREAM_API_KEY=VOTRE_CLE_ICI
```

**Exemple**:
```env
VITE_AISSTREAM_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901
```

### Étape 3: Redémarrer le Serveur

**Important**: Les variables d'environnement ne sont chargées qu'au démarrage!

```bash
# Dans le terminal où tourne npm run dev
Ctrl + C

# Puis relancer
npm run dev
```

## Vérification

### 1. Vérifier que la Clé est Bien Ajoutée

```bash
cat .env | grep VITE_AISSTREAM_API_KEY
```

Devrait afficher:
```
VITE_AISSTREAM_API_KEY=votre_cle_ici
```

### 2. Ouvrir l'Application

```
http://localhost:5173
```

### 3. Ouvrir la Carte

1. Secteur **Énergie** ⚡
2. Carte **WTI Crude** 🗺️
3. Ouvrir la console (F12)

### 4. Vérifier les Messages

Vous devriez maintenant voir:
```
📍 Demo vessels loaded (4 tankers)
✅ Connected to AIS Stream
📡 Subscription sent for Global - waiting for vessel data...
💡 Demo vessels shown initially. Real AIS data will appear as it arrives.
```

**Plus de message d'erreur!**

### 5. Attendre les Données Réelles

Après 1-10 minutes, vous verrez:
```
🚢 Vessel detected: [NOM DU NAVIRE] (Type: 70-89)
🚢 Vessel detected: [NOM DU NAVIRE] (Type: 70-89)
...
```

Et le compteur passera de "4 vessels tracked" à "5, 6, 7..." navires.

## Tier Gratuit d'AIS Stream

Le tier gratuit vous donne:
- ✅ Accès à toutes les données AIS mondiales
- ✅ WebSocket en temps réel
- ✅ Pas de limite de temps
- ⚠️ Limite de requêtes (généralement suffisante pour usage personnel)

## Dépannage

### La clé ne fonctionne pas

1. **Vérifier qu'elle est bien copiée** (pas d'espaces avant/après)
2. **Vérifier qu'elle commence par VITE_** (important pour Vite)
3. **Redémarrer le serveur** (Ctrl+C puis npm run dev)
4. **Vider le cache du navigateur** (Cmd+Shift+R)

### Toujours le message d'erreur

```bash
# Vérifier que la variable est chargée
# Dans la console du navigateur:
console.log(import.meta.env.VITE_AISSTREAM_API_KEY)
```

Si ça affiche `undefined`:
- La clé n'est pas dans `.env`
- Ou le serveur n'a pas été redémarré
- Ou le nom de la variable est incorrect

### Erreur "Invalid API Key"

```
❌ WebSocket connection error: Invalid API Key
```

- Vérifiez que la clé est correcte
- Vérifiez qu'elle est active sur aisstream.io
- Essayez de régénérer une nouvelle clé

## Commandes Rapides

### Ajouter la Clé (Ligne de Commande)

```bash
# Remplacez VOTRE_CLE par votre vraie clé
echo "VITE_AISSTREAM_API_KEY=VOTRE_CLE" >> .env
```

### Vérifier la Clé

```bash
cat .env | grep VITE_AISSTREAM_API_KEY
```

### Redémarrer le Serveur

```bash
# Arrêter (Ctrl+C) puis:
npm run dev
```

## Résultat Attendu

Après avoir ajouté la clé et redémarré:

```
┌─────────────────────────────────────────────┐
│  Console du Navigateur (F12)                │
├─────────────────────────────────────────────┤
│  📍 Demo vessels loaded (4 tankers)         │
│  ✅ Connected to AIS Stream                 │
│  📡 Subscription sent for Global            │
│  💡 Demo vessels shown initially...         │
│                                             │
│  [Après 1-10 minutes]                       │
│  🚢 Vessel detected: MAERSK EMMA (Type: 70)│
│  🚢 Vessel detected: PACIFIC STAR (Type: 80)│
│  🚢 Vessel detected: CRUDE KING (Type: 84)  │
│  ...                                        │
└─────────────────────────────────────────────┘

Carte: 4 → 5 → 8 → 15 → 30+ navires
```

---

**Une fois la clé ajoutée, vous verrez des dizaines de navires en temps réel! 🚢⚓**
