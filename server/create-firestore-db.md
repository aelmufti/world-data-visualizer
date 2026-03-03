# Créer la base de données Firestore

## Étapes:

1. Ouvrir la console Firebase:
   https://console.firebase.google.com/project/world-data-visualizer/firestore

2. Cliquer sur "Create database" (Créer une base de données)

3. Choisir le mode:
   - **Production mode** (recommandé) - avec règles de sécurité
   - ou **Test mode** (pour dev rapide) - accès ouvert temporairement

4. Choisir la région:
   - Recommandé: `us-central1` ou la région la plus proche

5. Cliquer sur "Enable" (Activer)

6. Attendre quelques secondes que la base soit créée

7. Relancer le seed:
   ```bash
   node dist/seed.js
   ```

## Alternative: Utiliser l'émulateur Firestore (sans créer de vraie DB)

Si vous voulez tester localement sans créer de base de données cloud:

```bash
# Installer firebase-tools
npm install -g firebase-tools

# Démarrer l'émulateur
firebase emulators:start --only firestore
```

Puis modifier le code pour utiliser l'émulateur (voir firebase-emulator.ts)
