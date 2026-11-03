#!/usr/bin/env bash

# ==============================================================================
# SolarDrâa - Script de démarrage en arrière-plan (Mode Détaché / Daemon -d)
# Démarre Backend (FastAPI), Frontend (Vite) et Tunnel Cloudflare en tâche de fond.
# Les processus continuent de tourner indépendamment du terminal appelant.
# ==============================================================================

set -e

# Répertoire racine du projet (détection dynamique)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Dossier des logs et PIDs
LOGS_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOGS_DIR"

PID_FILE="$LOGS_DIR/solardraa.pids"

# Vérification si l'application est déjà en cours d'exécution
if [ -f "$PID_FILE" ]; then
    ALREADY_RUNNING=0
    for pid in $(cat "$PID_FILE" 2>/dev/null); do
        if ps -p "$pid" > /dev/null 2>&1; then
            ALREADY_RUNNING=1
            break
        fi
    done
    if [ "$ALREADY_RUNNING" -eq 1 ]; then
        echo "⚠️  SolarDrâa est déjà en cours d'exécution en arrière-plan (PIDs: $(cat "$PID_FILE"))."
        echo "   Pour redémarrer, exécutez d'abord : ./stop.sh"
        exit 0
    fi
fi

# Libération préventive des ports si des processus orphelins existent
fuser -k 8000/tcp >/dev/null 2>&1 || true
fuser -k 5173/tcp >/dev/null 2>&1 || true

echo "☀️  Démarrage de SolarDrâa en mode détaché (Daemon / -d)..."

# Détection de l'environnement virtuel Python
if [ -d "$PROJECT_ROOT/venv" ]; then
    source "$PROJECT_ROOT/venv/bin/activate"
elif [ -d "/home/yazid/venv" ]; then
    source "/home/yazid/venv/bin/activate"
elif [ -d "$PROJECT_ROOT/.venv" ]; then
    source "$PROJECT_ROOT/.venv/bin/activate"
else
    echo "⚠️  Aucun environnement virtuel détecté, utilisation du Python système."
fi

# 1. Démarrage du Backend FastAPI en arrière-plan (sans reload en mode daemon pour stabilité)
echo "▶ 1/3 Démarrage du Backend FastAPI (port 8000)..."
nohup uvicorn backend.main:app --host 0.0.0.0 --port 8000 > "$LOGS_DIR/backend.log" 2>&1 < /dev/null &
BACKEND_PID=$!
disown "$BACKEND_PID" 2>/dev/null || true
echo "✓ Backend actif en arrière-plan (PID: $BACKEND_PID) -> logs/backend.log"

# 2. Démarrage du Frontend React (Vite) en arrière-plan
echo "▶ 2/3 Démarrage du Frontend Vite React (port 5173)..."
cd "$PROJECT_ROOT/frontend"
nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 < /dev/null &
FRONTEND_PID=$!
disown "$FRONTEND_PID" 2>/dev/null || true
cd "$PROJECT_ROOT"
echo "✓ Frontend actif en arrière-plan (PID: $FRONTEND_PID) -> logs/frontend.log"

# 3. Détection et Démarrage du Tunnel Cloudflare
echo "▶ 3/3 Démarrage du Tunnel Cloudflare (Accès Public)..."
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

rm -f "$LOGS_DIR/cloudflare.log"
nohup "$CLOUDFLARED_BIN" tunnel --url http://localhost:5173 > "$LOGS_DIR/cloudflare.log" 2>&1 < /dev/null &
CLOUDFLARED_PID=$!
disown "$CLOUDFLARED_PID" 2>/dev/null || true
echo "✓ Cloudflare Tunnel actif en arrière-plan (PID: $CLOUDFLARED_PID) -> logs/cloudflare.log"

# Enregistrement des PIDs pour un arrêt propre
echo "$BACKEND_PID $FRONTEND_PID $CLOUDFLARED_PID" > "$PID_FILE"

# Attente et extraction du lien public Cloudflare
echo -n "⏳ Initialisation des services et génération du lien public"
PUBLIC_URL=""
for i in {1..20}; do
    if [ -f "$LOGS_DIR/cloudflare.log" ]; then
        PUBLIC_URL=$(grep -m 1 -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' "$LOGS_DIR/cloudflare.log" 2>/dev/null || true)
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
echo "☀️  SOLARDRÂA — EN COURS D'EXÉCUTION (MODE DÉTACHÉ / DAEMON)"
echo "=================================================================="
echo "  💻 Frontend Local   : http://localhost:5173"
echo "  ⚙️  Backend API      : http://localhost:8000"
echo "  📚 Documentation API: http://localhost:8000/docs"
if [ -n "$PUBLIC_URL" ]; then
    echo "  🌐 Accès Public     : $PUBLIC_URL"
else
    echo "  🌐 Accès Public     : Vérification dans logs/cloudflare.log"
fi
echo "------------------------------------------------------------------"
echo "  📂 Fichiers de Journalisation (Logs) :"
echo "     • Backend   : tail -f $LOGS_DIR/backend.log"
echo "     • Frontend  : tail -f $LOGS_DIR/frontend.log"
echo "     • Tunnel    : tail -f $LOGS_DIR/cloudflare.log"
echo "------------------------------------------------------------------"
echo "  🛑 Commande d'arrêt : ./stop.sh"
echo "=================================================================="
echo ""
