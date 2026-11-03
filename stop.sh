#!/usr/bin/env bash

# ==============================================================================
# SolarDrâa - Script d'arrêt
# Arrête les processus Backend (FastAPI), Frontend (Vite) et Cloudflare Tunnel
# ==============================================================================

echo "🛑 Arrêt des services SolarDrâa..."

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_ROOT/logs/solardraa.pids"

# Arrêt par fichier de PIDs si existant
if [ -f "$PID_FILE" ]; then
    for pid in $(cat "$PID_FILE" 2>/dev/null); do
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    rm -f "$PID_FILE"
fi

# Arrêt par nom de processus
pkill -f "uvicorn backend.main" 2>/dev/null && echo "✓ Backend FastAPI arrêté"
pkill -f "vite" 2>/dev/null && echo "✓ Frontend Vite arrêté"
pkill -f "cloudflared tunnel" 2>/dev/null && echo "✓ Cloudflare Tunnel arrêté"

# Libération des ports si nécessaire
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true

rm -f /tmp/cloudflared_solardraa.log

echo "☀️  Tous les services SolarDrâa sont complètement arrêtés."

