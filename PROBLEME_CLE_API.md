# 🔑 Problème de Clé API AIS Stream

## ❌ Erreur Actuelle

```
WebSocket connection failed
Code: 1006 (Connection closed abnormally)
```

## 🔍 Diagnostic

Le code **1006** signifie que le serveur AIS Stream **refuse la connexion**. Causes possibles:

### 1. Clé API Invalide ou Expirée
La clé actuelle: `6c13218b128aa83a7ac3d5a8f5ec4c9b30f269dd`

Cette clé peut être:
- ❌ Invalide
- ❌ Expirée
- ❌ Révoquée
- ❌ Pas encore activée

### 2. Compte Non Activé
Le compte aisstream.io nécessite peut-être:
- Confirmation d'email
- Activation manuelle
- Acceptation des conditions

### 3. Quota Dépassé
Le tier gratuit a des limites:
- Nombre de connexions simultanées
- Nombre de requêtes par jour
- Bande passante

## ✅ Solutions

### Solution 1: Vérifier le Compte (Recommandé)

1. **Allez sur https://aisstream.io**
2. **Connectez-vous** avec vos identifiants
3. **Vérifiez le dashboard**:
   - Le compte est-il actif?
   - L'email est-il confirmé?
   - Y a-t-il des messages d'erreur?

### Solution 2: Régénérer la Clé API

1. **Dashboard** → **API Keys**
2. **Supprimer** l'ancienne clé
3. **Créer** une nouvelle clé
4. **Copier** la nouvelle clé
5. **Mettre à jour** `.env`:
   ```env
   VITE_AISSTREAM_API_KEY=nouvelle_cle_ici
   ```
6. **Redémarrer** le serveur:
   ```bash
   Ctrl+C
   npm run dev
   ```

### Solution 3: Créer un Nouveau Compte

Si le compte actuel ne fonctionne pas:

1. **Créer un nouveau compte** sur https://aisstream.io
2. **Confirmer l'email**
3. **Obtenir une nouvelle clé API**
4. **Mettre à jour** `.env`
5. **Redémarrer** le serveur

### Solution 4: Vérifier les Limites

Sur le dashboard aisstream.io:
- Vérifiez le **quota utilisé**
- Vérifiez les **connexions actives**
- Vérifiez les **erreurs récentes**

## 🧪 Test de la Clé API

### Test 1: Via le Dashboard
1. Allez sur https://aisstream.io/dashboard
2. Vérifiez que la clé est listée et active
3. Vérifiez qu'il n'y a pas de message d'erreur

### Test 2: Via la Documentation
1. Allez sur https://aisstream.io/documentation
2. Suivez l'exemple de connexion
3. Testez avec votre clé

### Test 3: Via le Support
Si rien ne fonctionne:
- Contactez le support d'aisstream.io
- Expliquez le code d'erreur 1006
- Demandez si la clé est valide

## 🔄 Alternative: Utiliser Seulement les Données de Démo

En attendant de résoudre le problème, vous pouvez:

1. **Garder les 4 navires de démo**
2. **Désactiver temporairement le WebSocket**
3. **Tester l'interface** sans données réelles

Pour désactiver le WebSocket, commentez le code dans `OilTankerMap.tsx`:

```typescript
// Commentez tout le bloc WebSocket
/*
const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
...
*/
```

## 📊 Informations sur le Tier Gratuit

Le tier gratuit d'aisstream.io offre généralement:
- ✅ Accès aux données AIS mondiales
- ✅ WebSocket en temps réel
- ⚠️ Limites de connexions simultanées
- ⚠️ Limites de bande passante

Vérifiez les limites exactes sur leur site.

## 🆘 Si Rien ne Fonctionne

### Option 1: Utiliser une Alternative

D'autres sources de données AIS:
- **MarineTraffic API** (payant)
- **VesselFinder API** (payant)
- **OpenSeaMap** (communautaire, limité)

### Option 2: Mode Démo Uniquement

Gardez les 4 navires de démonstration et indiquez clairement que c'est un mode démo.

### Option 3: Données Statiques

Créez un fichier JSON avec des positions de navires et simulez le mouvement.

## 📝 Checklist de Dépannage

- [ ] Compte aisstream.io créé et confirmé
- [ ] Email vérifié
- [ ] Clé API visible dans le dashboard
- [ ] Clé API copiée correctement (pas d'espaces)
- [ ] Clé API dans `.env` (racine du projet)
- [ ] Serveur redémarré après modification de `.env`
- [ ] Pas de quota dépassé
- [ ] Pas de message d'erreur sur le dashboard
- [ ] Connexion internet stable
- [ ] Pas de firewall bloquant les WebSockets

## 🎯 Prochaines Étapes

1. **Vérifiez votre compte** sur https://aisstream.io
2. **Régénérez la clé API** si nécessaire
3. **Mettez à jour** `.env` avec la nouvelle clé
4. **Redémarrez** le serveur
5. **Testez** à nouveau la carte

---

**Le code 1006 indique clairement un problème d'authentification avec aisstream.io. Vérifiez votre compte et régénérez la clé API.**
