#!/bin/bash

# Script pour démarrer tous les services de l'application

echo "🚀 Démarrage de l'application Financial Dashboard..."
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour vérifier si un port est utilisé
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Vérifier les ports
echo "🔍 Vérification des ports..."
if check_port 5173; then
    echo -e "${YELLOW}⚠️  Port 5173 déjà utilisé (Frontend)${NC}"
fi
if check_port 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 déjà utilisé (Backend)${NC}"
fi
if check_port 8080; then
    echo -e "${YELLOW}⚠️  Port 8080 déjà utilisé (Firestore Emulator)${NC}"
fi
echo ""

# Démarrer le frontend
echo -e "${BLUE}📱 Démarrage du Frontend (Vite)...${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend démarré (PID: $FRONTEND_PID)${NC}"
echo ""

# Attendre un peu
sleep 2

# Démarrer le backend
echo -e "${BLUE}🔧 Démarrage du Backend API...${NC}"
cd server
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}"
echo ""

# Attendre un peu
sleep 2

# Démarrer le RSS worker
echo -e "${BLUE}📡 Démarrage du RSS Worker...${NC}"
npm run rss-worker &
WORKER_PID=$!
echo -e "${GREEN}✅ RSS Worker démarré (PID: $WORKER_PID)${NC}"
cd ..
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ Tous les services sont démarrés!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 URLs disponibles:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   Firestore: http://localhost:8080"
echo ""
echo "🗺️  Carte des pétroliers:"
echo "   1. Ouvrez http://localhost:5173"
echo "   2. Secteur Énergie → WTI Crude 🗺️"
echo "   3. Ouvrez la console (F12) pour voir les logs AIS"
echo ""
echo "🛑 Pour arrêter tous les services:"
echo "   Ctrl + C dans ce terminal"
echo ""
echo "📝 Logs disponibles dans RUNNING_STATUS.md"
echo ""

# Attendre que l'utilisateur arrête
wait
