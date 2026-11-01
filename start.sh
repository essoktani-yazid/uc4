#!/usr/bin/env bash

# ==============================================================================
# SolarDrâa - Script de démarrage complet
# Démarre Backend (FastAPI), Frontend (Vite/React) et Tunnel Cloudflare (Accès Public)
# ==============================================================================

# Arrêt propre de tous les processus lors de Ctrl+C ou sortie
cleanup() {
    echo ""
    echo "🛑 Arrêt des services SolarDrâa (Backend, Frontend, Cloudflare Tunnel)..."
    kill "$BACKEND_PID" "$FRONTEND_PID" "$CLOUDFLARED_PID" $(jobs -p) 2>/dev/null
    rm -f /tmp/cloudflared_solardraa.log
    echo "✓ Tous les services sont arrêtés."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "☀️  Démarrage de SolarDrâa..."

# Répertoire racine du projet
PROJECT_ROOT="/home/yazid/Desktop/UC4"
cd "$PROJECT_ROOT" || exit 1

# 1. Démarrage du Backend FastAPI
echo "▶ 1/3 Démarrage du Backend FastAPI..."
source /home/yazid/venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
echo "✓ Backend actif (PID: $BACKEND_PID)"

# 2. Démarrage du Frontend React (Vite)
echo "▶ 2/3 Démarrage du Frontend Vite (React)..."
cd "$PROJECT_ROOT/frontend" || exit 1
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend actif (PID: $FRONTEND_PID)"

# 3. Démarrage du Tunnel Cloudflare (Accès Public)
echo "▶ 3/3 Démarrage du Tunnel Cloudflare..."

# Détection de l'exécutable cloudflared
if command -v cloudflared &> /dev/null; then
    CLOUDFLARED_BIN="cloudflared"
elif [ -f "$HOME/.local/bin/cloudflared" ]; then
    CLOUDFLARED_BIN="$HOME/.local/bin/cloudflared"
elif [ -f "/tmp/cloudflared" ]; then
    CLOUDFLARED_BIN="/tmp/cloudflared"
else
    echo "ℹ Installation temporaire de cloudflared..."
    mkdir -p "$HOME/.local/bin"
    curl -sSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o "$HOME/.local/bin/cloudflared"
    chmod +x "$HOME/.local/bin/cloudflared"
    CLOUDFLARED_BIN="$HOME/.local/bin/cloudflared"
fi

rm -f /tmp/cloudflared_solardraa.log
$CLOUDFLARED_BIN tunnel --url http://localhost:5173 > /tmp/cloudflared_solardraa.log 2>&1 &
CLOUDFLARED_PID=$!

# Attente et extraction du lien public
echo -n "⏳ Génération du lien d'accès public"
PUBLIC_URL=""
for i in {1..20}; do
    if [ -f /tmp/cloudflared_solardraa.log ]; then
        PUBLIC_URL=$(grep -m 1 -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/cloudflared_solardraa.log 2>/dev/null)
        if [ -n "$PUBLIC_URL" ]; then
            break
        fi
    fi
    echo -n "."
    sleep 1
done
echo ""

echo ""
echo "=================================================================="
echo "☀️  SOLARDRÂA — PLATEFORME OPÉRATIONNELLE"
echo "=================================================================="
echo "  💻 Frontend Local   : http://localhost:5173"
echo "  ⚙️  Backend API      : http://localhost:8000"
echo "  📚 Documentation API: http://localhost:8000/docs"
if [ -n "$PUBLIC_URL" ]; then
    echo "  🌐 Accès Public     : $PUBLIC_URL"
else
    echo "  🌐 Accès Public     : Vérification en cours dans /tmp/cloudflared_solardraa.log"
fi
echo "=================================================================="
echo "💡 Appuyez sur [Ctrl + C] dans ce terminal pour tout arrêter."
echo "=================================================================="
echo ""

wait
