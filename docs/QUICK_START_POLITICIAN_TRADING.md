# 🚀 Quick Start - Politician Trading

## En 3 étapes

### 1️⃣ Démarrer le backend
```bash
cd server
npm run dev
```

Attendez de voir:
```
🚀 Financial News API running on port 8000
```

### 2️⃣ Démarrer le frontend
Dans un nouveau terminal:
```bash
npm run dev
```

### 3️⃣ Utiliser la fonctionnalité
1. Ouvrez votre navigateur sur `http://localhost:5173`
2. Cliquez sur l'onglet **"🏛️ Trading Politique"** dans la navbar
3. Explorez les transactions des politiciens américains!

## 🎯 Que faire ensuite?

### Voir les transactions récentes
Par défaut, vous verrez les 100 dernières transactions du Congrès.

### Rechercher un politicien
1. Tapez un nom dans la barre de recherche (ex: "Pelosi")
2. Cliquez sur "🔍 Rechercher"
3. Voyez toutes les transactions de ce politicien

### Voir les top traders
1. Cliquez sur l'onglet "🏆 Top Traders"
2. Voyez les 15 politiciens les plus actifs
3. Cliquez sur une carte pour voir les détails

## ❓ Problèmes?

### Le backend ne démarre pas
```bash
cd server
npm install
npm run dev
```

### Erreur 403 ou CORS
Vérifiez que le backend est bien démarré sur le port 8000.

### Aucune donnée
Les APIs sources peuvent être temporairement indisponibles. Réessayez dans quelques minutes.

## 📚 Plus d'infos

- **Documentation complète**: `POLITICIAN_TRADING_FEATURE.md`
- **Guide de test**: `TEST_POLITICIAN_TRADING.md`
- **Résumé technique**: `POLITICIAN_TRADING_SUMMARY.md`
- **Fix CORS**: `POLITICIAN_TRADING_FIX.md`

## 🎉 C'est tout!

Vous pouvez maintenant suivre les transactions boursières des membres du Congrès américain en temps réel.
