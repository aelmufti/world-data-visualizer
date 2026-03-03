# Configuration Firebase

## Option 1: Utiliser gcloud CLI (Recommandé pour dev local)

1. Installer gcloud CLI:
```bash
brew install --cask google-cloud-sdk
```

2. S'authentifier:
```bash
gcloud auth application-default login
gcloud config set project world-data-visualizer
```

3. Relancer le seed:
```bash
node dist/seed.js
```

## Option 2: Utiliser une clé de service (Service Account)

1. Aller sur Firebase Console: https://console.firebase.google.com/project/world-data-visualizer/settings/serviceaccounts/adminsdk

2. Cliquer sur "Generate new private key"

3. Télécharger le fichier JSON et le sauvegarder comme `serviceAccountKey.json` dans le dossier `server/`

4. Mettre à jour `.env`:
```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

5. Relancer le seed

## Option 3: Utiliser Firestore en mode émulateur (pour dev sans credentials)

1. Installer Firebase tools:
```bash
npm install -g firebase-tools
```

2. Démarrer l'émulateur:
```bash
firebase emulators:start --only firestore
```

3. Mettre à jour le code pour pointer vers l'émulateur
