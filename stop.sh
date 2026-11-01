#!/usr/bin/env bash

# ==============================================================================
# SolarDrâa - Script d'arrêt
# Arrête les processus Backend (FastAPI), Frontend (Vite) et Cloudflare Tunnel
# ==============================================================================

echo "🛑 Arrêt des services SolarDrâa..."

# Arrêt par nom de processus
pkill -f "uvicorn backend.main" 2>/dev/null && echo "✓ Backend FastAPI arrêté"
pkill -f "vite" 2>/dev/null && echo "✓ Frontend Vite arrêté"
pkill -f "cloudflared tunnel" 2>/dev/null && echo "✓ Cloudflare Tunnel arrêté"

# Libération des ports si nécessaire
fuser -k 8000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

rm -f /tmp/cloudflared_solardraa.log

echo "☀️ Tous les services SolarDrâa sont complètement arrêtés."

