# Sécurité - Protection des Clés API

## ✅ Fichiers Protégés

Le `.gitignore` est configuré pour bloquer automatiquement:

### Variables d'environnement
- `.env` (tous les dossiers)
- `.env.local`, `.env.*.local`
- Tous les fichiers `*.env` SAUF `.env.example`

### Clés API et Credentials
- `API_KEY.txt`
- `serviceAccountKey.json`
- `*-key.json`
- `*-credentials.json`
- `firebase-adminsdk-*.json`

### Google Cloud
- `gcloud-credentials.json`
- `application_default_credentials.json`

### Firebase
- `.firebase/`
- Tous les logs Firebase

## 🔒 Bonnes Pratiques

1. **Ne jamais commit de clés API**
   - Toujours utiliser `.env` pour les secrets
   - Commit uniquement `.env.example` avec des valeurs factices

2. **Vérifier avant de commit**
   ```bash
   git status
   git diff --cached
   ```

3. **Tester la protection**
   ```bash
   git check-ignore -v server/API_KEY.txt
   # Doit afficher: server/.gitignore:14:API_KEY.txt
   ```

4. **Si vous avez déjà commité une clé par erreur**
   ```bash
   # Supprimer du dernier commit
   git rm --cached fichier_sensible
   git commit --amend
   
   # Révoquer la clé immédiatement!
   # Générer une nouvelle clé
   ```

## 📝 Configuration Actuelle

### Fichiers à commit (exemples uniquement)
- ✅ `.env.example`
- ✅ `server/.env.example`

### Fichiers JAMAIS commités
- ❌ `.env`
- ❌ `server/.env`
- ❌ `server/API_KEY.txt`
- ❌ `serviceAccountKey.json`

## 🚨 En cas de fuite de clé

1. **Révoquer immédiatement** la clé compromise
2. Générer une nouvelle clé
3. Mettre à jour `.env` localement
4. Nettoyer l'historique Git si nécessaire:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch chemin/vers/fichier" \
     --prune-empty --tag-name-filter cat -- --all
   ```

## ✅ Vérification

Pour vérifier que tout est protégé:
```bash
# Vérifier qu'aucun fichier sensible n'est staged
git status --porcelain | grep -E "(\.env$|API_KEY|key\.json|credentials)"

# Si la commande ne retourne rien, c'est bon!
```
