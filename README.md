# ☀️ SolarDrâa — Plateforme de Prévision Photovoltaïque Intelligente

**SolarDrâa** est une plateforme complète d'Intelligence Artificielle pour la prévision de production solaire et la surveillance de centrales photovoltaïques dans la région de Drâa-Tafilalet (Maroc).

Le projet intègre les 4 jalons de Deep Learning (MLP, Vision par ordinateur, Transfer Learning / Multi-tâches, et Modélisation temporelle GRU) au sein d'une interface web moderne et interactive couplée à une API FastAPI performante.

---

## 🎯 Architecture & Jalons Deep Learning

1. **Jalon 1 : Prévoir la production avec un MLP**
   - Modèle MLP Base (47 variables météorologiques et calendaires).
   - Modèle MLP Enrichi (51 variables avec horizon temporel, azimut, zénith).
   - Baseline : Persistance intelligente.

2. **Jalon 2 : Vision par ordinateur & Ciel**
   - Classification de la couverture nuageuse (Clair, Cirrus, Cumulus, Stratus) par CNN.
   - Détection d'anomalies de salissure et dégradation par Autoencodeur convolutif sur images thermographiques infrarouges.

3. **Jalon 3 : Transfer Learning & CNN Multi-tâches**
   - CNN Multi-tâches estimant simultanément la production et le niveau de salissure.
   - Adaptation au Site B via Transfer Learning et Fine-Tuning.

4. **Jalon 4 : Séries temporelles & Séquences (Encoder-Decoder GRU)**
   - Modélisation séquentielle récurrente GRU pour prévisions multi-horizons avec gestion de la dynamique temporelle.

---

## 🏗️ Structure du Projet

```
UC4/
├── backend/                  # API Backend (FastAPI, PyTorch / Keras, Inférence)
│   ├── main.py               # Routes API REST (/api/predict, /api/sky, /api/thermography...)
│   └── inference.py          # Logique de chargement des modèles et calculs
├── frontend/                 # Application Frontend React (Vite, Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx           # Interface principale SolarDrâa (Bento Grid, onglets)
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── data/                     # Données météo, séries temporelles et images (.npz, .csv)
├── models/                   # Modèles entraînés (.keras, .pkl)
├── Jalon 1...4/              # Notebooks Jupyter d'entraînement, sujets et rapports
├── start.sh                  # Script de démarrage tout-en-un (Backend + Frontend + Cloudflare)
├── stop.sh                   # Script d'arrêt propre des services
└── README.md
```

---

## 🚀 Démarrage Rapide

### Prérequis
- Python 3.10+ avec un environnement virtuel configuré
- Node.js 18+ et `npm`

### Lancement en un clic
Exécutez simplement le script `start.sh` à la racine :

```bash
./start.sh
```

Le script démarre automatiquement :
1. Le **Backend FastAPI** sur `http://localhost:8000` (Documentation sur `/docs`)
2. Le **Frontend React** sur `http://localhost:5173`
3. Le **Tunnel Cloudflare** fournissant une URL publique sécurisée en `https://*.trycloudflare.com` accessible depuis n'importe quel appareil.

### Arrêt de l'application
- Appuyez sur `Ctrl + C` dans le terminal du script, **ou**
- Exécutez `./stop.sh` à tout moment.

---

## 👤 Auteur
- **Yazid ESSOKTANI** ([essoktani-yazid](https://github.com/essoktani-yazid))
