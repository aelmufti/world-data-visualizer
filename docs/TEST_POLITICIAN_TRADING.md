# 🧪 Test du Politician Trading Feature

## Étapes de test

### 1. Démarrer le serveur backend

```bash
cd server
npm run dev
```

Vous devriez voir:
```
🚀 Financial News API running on port 8000
```

### 2. Tester les endpoints backend (optionnel)

Ouvrez un nouveau terminal et testez les endpoints:

```bash
# Test endpoint House
curl http://localhost:8000/api/politician-trading/house | jq '. | length'

# Test endpoint Senate
curl http://localhost:8000/api/politician-trading/senate | jq '. | length'

# Test endpoint combiné
curl http://localhost:8000/api/politician-trading/all | jq '. | length'
```

Si `jq` n'est pas installé, vous pouvez simplement:
```bash
curl http://localhost:8000/api/politician-trading/all
```

### 3. Tester l'interface utilisateur

1. Assurez-vous que le frontend est démarré:
```bash
npm run dev
```

2. Ouvrez votre navigateur sur `http://localhost:5173` (ou le port affiché)

3. Cliquez sur l'onglet "🏛️ Trading Politique" dans la navbar

4. Vous devriez voir:
   - Un écran de chargement avec "⏳ Chargement des données..."
   - Puis les transactions récentes s'affichent
   - Aucune erreur 403 dans la console

### 4. Tester les fonctionnalités

#### Transactions Récentes
- ✅ Affiche une liste de transactions
- ✅ Chaque ligne montre: date, politicien, action, type, montant, ticker
- ✅ Les types sont colorés (vert=achat, rouge=vente, orange=échange)

#### Recherche
1. Tapez "Pelosi" dans la barre de recherche
2. Cliquez sur "🔍 Rechercher"
3. ✅ Devrait afficher toutes les transactions de Nancy Pelosi et Paul Pelosi

#### Top Traders
1. Cliquez sur l'onglet "🏆 Top Traders"
2. ✅ Affiche les 15 politiciens les plus actifs
3. ✅ Chaque carte montre: total transactions, transactions récentes (30j), action favorite
4. Cliquez sur une carte
5. ✅ Devrait afficher toutes les transactions de ce politicien

#### Actualiser
1. Cliquez sur le bouton "🔄 Actualiser"
2. ✅ Les données se rechargent
3. ✅ Le bouton affiche "⏳ Chargement..." pendant le chargement

### 5. Vérifier la console

Ouvrez la console du navigateur (F12):
- ✅ Aucune erreur 403 Forbidden
- ✅ Aucune erreur CORS
- ✅ Les requêtes vont vers `http://localhost:8000/api/politician-trading/...`

### 6. Vérifier le cache

1. Rechargez la page
2. Les données devraient se charger instantanément (depuis le cache)
3. Attendez 5 minutes
4. Rechargez la page
5. Les données devraient se recharger (cache expiré)

## Résultats attendus

### ✅ Succès si:
- Aucune erreur 403 dans la console
- Les données s'affichent correctement
- La recherche fonctionne
- Les top traders s'affichent
- Le cache fonctionne (chargement rapide après le premier chargement)

### ❌ Échec si:
- Erreurs 403 Forbidden
- Erreurs CORS
- Aucune donnée ne s'affiche
- Message "Aucune transaction trouvée" alors qu'il devrait y en avoir

## Dépannage

### Problème: Erreur "Failed to fetch"
**Solution**: Vérifiez que le serveur backend est démarré sur le port 8000

### Problème: Erreur 404 sur /api/politician-trading
**Solution**: 
1. Vérifiez que `server/src/politician-trading-endpoint.ts` existe
2. Vérifiez que `server/src/index.ts` importe et utilise le router
3. Redémarrez le serveur backend

### Problème: Données vides
**Solution**: 
1. Testez directement l'endpoint backend avec curl
2. Vérifiez les logs du serveur backend
3. Les APIs sources peuvent être temporairement indisponibles

### Problème: Cache ne fonctionne pas
**Solution**: 
1. Vérifiez que `node-cache` est installé: `npm list node-cache` dans le dossier server
2. Vérifiez les logs du serveur pour voir si le cache est utilisé

## Exemples de politiciens à rechercher

Pour tester la recherche, essayez:
- "Pelosi" (Nancy Pelosi, Paul Pelosi)
- "Crenshaw" (Dan Crenshaw)
- "Tuberville" (Tommy Tuberville)
- "Gottheimer" (Josh Gottheimer)
- "Ocasio" (Alexandria Ocasio-Cortez)

## Performance attendue

- Premier chargement: 2-5 secondes (dépend de la connexion)
- Chargements suivants (cache): < 100ms
- Recherche: Instantanée (filtrage côté client)
- Top Traders: Instantanée (calcul côté client)
