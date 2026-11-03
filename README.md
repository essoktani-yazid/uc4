<div align="center">
  <!-- En-tête créatif -->
  <img src="https://capsule-render.vercel.app/api?type=waving&color=00B4D8&height=150&section=header&text=SOLARDRAA&fontSize=50&fontAlignY=35&fontColor=ffffff" width="100%"/>

  <!-- Animation texte ciblant ce que fait le projet -->
  <img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&weight=700&size=20&duration=3000&pause=1000&color=00B4D8&center=true&vCenter=true&width=650&lines=Plateforme+IA+de+Supervision+Solaire+50+MWc;Pr%C3%A9vision+Multi-Horizon+H1-H6+%26+Vision+du+Ciel;Diagnostic+Thermique+Infrarouge+par+Autoencodeur;Transfer+Learning+Multi-Sites+Ouarzazate-Tarfaya;Architecture+Intelligente+%26+Scalable" alt="Typing SVG" />

  <br/>

  <!-- Badges technologiques et projet -->
  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-00B4D8?style=for-the-badge" alt="Version">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License">
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/TensorFlow_2.16-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
    <img src="https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  </p>
</div>

---

<!-- 1. CE QUE FAIT LE PROJET -->
## À propos du projet

**SolarDrâa** est une plateforme web d'intelligence artificielle de pointe dédiée à la supervision énergétique, à la prévision photovoltaïque multi-horizon ($t+1h$ à $t+6h$) et au diagnostic prédictif de centrales solaires industrielles dans la région de Drâa-Tafilalet (Maroc).

Elle combine l'analyse de séries temporelles météorologiques, la vision par ordinateur appliquée aux caméras grand-angle du ciel (all-sky imagers), la détection thermographique infrarouge de défauts sur panneaux photovoltaïques et l'adaptation de domaine multi-sites (Ouarzazate 50 MWc et Tarfaya 20 MWc).

> [!NOTE]
> Pour une analyse approfondie des choix d'ingénierie et des flux de données, consultez la [documentation d'architecture](docs/ARCHITECTURE.md) ainsi que la [spécification d'API](docs/API.md).

<!-- APERÇU VISUEL (CAPTURES D'ÉCRAN) -->
### Aperçu en action

<div align="center">
  <img src="docs/screens/Tableau%20de%20Bord.png" alt="Tableau de bord SolarDrâa" width="95%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
  <p><em>Figure 1 : Tableau de bord principal SolarDrâa — Supervision 50 MWc, jauges de production et inférences directes.</em></p>
</div>

<details>
  <summary><b>🔍 Voir les modules interactifs et bancs d'essai (Captures d'écran détaillées)</b></summary>
  <br/>
  
  <table width="100%">
    <tr>
      <td width="50%" align="center">
        <b>1. Prévision Tabulaire (MLP Base & Enrichi)</b><br/><br/>
        <img src="docs/screens/1.%20Pr%C3%A9vision%20Tabulaire.png" alt="Prévision Tabulaire" width="100%" style="border-radius: 6px;" />
      </td>
      <td width="50%" align="center">
        <b>2. Vision du Ciel (CNN All-Sky Imager)</b><br/><br/>
        <img src="docs/screens/2.%20Vision%20du%20Ciel.png" alt="Vision du Ciel" width="100%" style="border-radius: 6px;" />
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <b>3. Prévision Enrichie Multimodale</b><br/><br/>
        <img src="docs/screens/3.%20Pr%C3%A9vision%20Enrichie.png" alt="Prévision Enrichie" width="100%" style="border-radius: 6px;" />
      </td>
      <td width="50%" align="center">
        <b>4. Dynamique Nuages & Flux Optique</b><br/><br/>
        <img src="docs/screens/4.%20Dynamique%20Nuages.png" alt="Dynamique Nuages" width="100%" style="border-radius: 6px;" />
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <b>5. Diagnostic Thermique (Autoencodeurs)</b><br/><br/>
        <img src="docs/screens/5.%20Diagnostic%20Thermique.png" alt="Diagnostic Thermique" width="100%" style="border-radius: 6px;" />
      </td>
      <td width="50%" align="center">
        <b>6. Transfert de Site (Zero-Shot & Fine-Tuning)</b><br/><br/>
        <img src="docs/screens/6.%20Transfert%20de%20Site.png" alt="Transfert de Site" width="100%" style="border-radius: 6px;" />
      </td>
    </tr>
    <tr>
      <td colspan="2" align="center">
        <b>7. Séries Temporelles Récurrentes (Banc GRU / LSTM / RNN)</b><br/><br/>
        <img src="docs/screens/7.%20S%C3%A9ries%20GRU.png" alt="Séries GRU" width="80%" style="border-radius: 6px;" />
      </td>
    </tr>
  </table>
</details>

---

<!-- 2. POURQUOI LE PROJET EST UTILE -->
## Pourquoi utiliser ce projet ?

L'intégration massive de l'énergie solaire au réseau électrique national exige une anticipation rigoureuse de l'intermittence et une maintenance préventive automatisée. SolarDrâa apporte des solutions concrètes :

- **Prévision Multi-Horizon Robuste ($t+1h$ à $t+6h$) :** Dépassement systématique de la persistance intelligente grâce au couplage de réseaux denses (MLP), de réseaux récurrents (GRU Sequence-to-Sequence) et d'observations météo locales.
- **Fusion Multi-Modale (Vision + Météo) :** Analyse continue de la couverture nuageuse et de l'occultation du disque solaire via caméras hémisphériques couplée aux paramètres physiques d'irradiation ($GHI$, température, salissure).
- **Transfer Learning Multi-Sites ($A \rightarrow B$) :** Déploiement immédiat en mode *Zero-Shot* sur de nouvelles installations (ex: Site B Tarfaya 20 MWc) et ajustement fin (*Fine-Tuning* partiel ou total) dès les premières semaines d'exploitation.
- **Maintenance Prédictive Thermographique :** Détection d'anomalies de cellules photovoltaïques (points chauds, dégradations, salissures) sans supervision par autoencodeurs convolutifs goulot (16 et 32 dimensions latentes).
- **Interface Réactive & Ergonomie Opérateur :** Tableau de bord Bento Grid avec inférence instantanée sans rechargement, animations fluides et visualisation SVG des courbes de charge.

---

### Stack Technique

| Couche | Technologies | Rôle & Usage |
| :--- | :--- | :--- |
| **Backend & API** | `FastAPI`, `Uvicorn`, `Pydantic v2` | Serveur d'API asynchrone, validation stricte des requêtes et sérialisation JSON haute performance |
| **Frontend & UI** | `React 18`, `Vite 5`, `Tailwind CSS`, `Lucide Icons` | Interface monopage (SPA) modulaire, responsive Bento Grid, micro-animations et graphiques SVG |
| **Deep Learning & IA** | `TensorFlow 2.16`, `Keras 3`, `Scikit-Learn`, `Joblib` | Architectures neuronales MLP, CNN Vision, Autoencodeurs d'anomalies et encodeur-décodeur GRU |
| **Données & Tenseurs** | `NumPy`, `Pandas`, `Pillow` | Manipulation matricielle, fenêtrage glissant chronologique et prétraitement d'images |
| **Déploiement & Accès** | `Cloudflare Tunnel`, `Bash` | Script orchestrateur `./start.sh`, arrêt propre `./stop.sh` et exposition publique sécurisée |

---

<!-- 3. COMMENT DÉMARRER -->
## Pour commencer

Suivez ces instructions pour installer, configurer et exécuter la plateforme SolarDrâa en local.

### Prérequis

Assurez-vous de disposer des versions suivantes sur votre environnement :

- **Python :** version 3.10 ou supérieure (`python3 --version`)
- **Node.js :** version 18.0 ou supérieure avec `npm` (`node -v` et `npm -v`)
- **Système :** Linux / macOS / Windows WSL2

---

### Installation et Démarrage Rapide

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/essoktani-yazid/uc4.git
   cd uc4
   ```

2. **Lancement automatique tout-en-un (Recommandé)**
   Exécutez le script d'orchestration situé à la racine du projet :
   ```bash
   chmod +x start.sh stop.sh
   ./start.sh
   ```
   Ce script assure automatiquement :
   - L'activation de l'environnement virtuel Python
   - Le démarrage du backend FastAPI sur `http://localhost:8000`
   - Le démarrage du frontend Vite React sur `http://localhost:5173`
   - L'ouverture d'un tunnel Cloudflare sécurisé générant une URL publique accessible depuis l'extérieur

3. **Lancement manuel séparé (Alternative)**

   - **Démarrer le Backend :**
     ```bash
     source /home/yazid/venv/bin/activate  # ou votre venv local
     pip install -r backend/requirements.txt
     uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
     ```

   - **Démarrer le Frontend :**
     ```bash
     cd frontend
     npm install
     npm run dev
     ```

4. **Arrêt des services**
   Appuyez sur `Ctrl + C` dans le terminal de `start.sh`, ou lancez :
   ```bash
   ./stop.sh
   ```

---

### Exemple d'utilisation de l'API

Une fois le serveur actif, testez une prévision tabulaire par requête HTTP :

```bash
curl -X POST http://localhost:8000/api/predict/tabular \
  -H "Content-Type: application/json" \
  -d '{
    "historique_24h": [0,0,0,0,0,0,1.2,8.4,18.5,29.1,38.4,45.2,48.1,46.3,39.8,28.4,15.2,4.1,0,0,0,0,0,0],
    "ghi_prevue": [850, 890, 840, 720, 510, 240],
    "nebulosite_prevue": [0.1, 0.15, 0.2, 0.25, 0.3, 0.35],
    "temperature_prevue": [24.5, 26.0, 27.2, 27.8, 26.5, 24.0],
    "heure_sin": 0.0,
    "heure_cos": -1.0,
    "mois_sin": -0.5,
    "mois_cos": -0.866,
    "jours_depuis_nettoyage": 4.0,
    "capacite_nominale": 50.0
  }'
```

*Pour explorer l'ensemble des routes et schémas d'inférence, consultez la [Spécification API](docs/API.md) ou la documentation interactive Swagger sur `http://localhost:8000/docs`.*

---

### Structure du projet

```text
.
├── backend/                  # Serveur d'API FastAPI & Logique d'Inférence IA
│   ├── main.py               # Routes d'API REST, modèles Pydantic et instanciation FastAPI
│   ├── jalon3_results.py     # Métriques et analyses comparatives de validation
│   ├── jalon3_testing.py     # Moteur de test interactif pour le transfert de site B
│   ├── jalon4_service.py     # Service de prévision séquentielle récurrente GRU
│   ├── thermography.py       # Détection d'anomalies infrarouges par autoencodeur
│   ├── requirements.txt      # Dépendances Python (FastAPI, TensorFlow, Keras, etc.)
│   └── tests/                # Tests unitaires et vérifications backend
├── frontend/                 # Application Frontend React (Vite & Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx           # Composant racine, navigation Bento Grid et dashboard
│   │   ├── GruSeriesWorkbench.jsx # Banc d'essai interactif séquences GRU
│   │   ├── Jalon3Results.jsx # Interface d'évaluation et transfert de domaine
│   │   ├── ThermographyWorkbench.jsx # Banc d'inspection thermographique
│   │   ├── index.css         # Styles utilitaires Tailwind et animations keyframes
│   │   └── main.jsx          # Point d'entrée React 18 DOM
│   ├── package.json          # Dépendances NPM
│   ├── tailwind.config.js    # Configuration des thèmes et palettes Tailwind
│   └── vite.config.js        # Configuration du bundler Vite
├── data/                     # Datasets de production, météo et matrices de tenseurs (.csv, .npz)
│   ├── uc4_siteA.csv         # Série temporelle météo & production Site A (50 MWc)
│   ├── uc4_siteB.csv         # Série temporelle météo & production Site B (20 MWc)
│   ├── uc4_ciel_A.npz        # Images caméra ciel Site A
│   ├── uc4_ciel_B.npz        # Images caméra ciel Site B
│   └── uc4_thermographie.npz # Échantillons thermographiques de panneaux photovoltaïques
├── models/                   # Poids des réseaux de neurones Keras et scalers
│   ├── mlp_base.keras        # Modèle tabulaire standard MLP Site A
│   ├── mlp_enrichi.keras     # Modèle tabulaire enrichi (horizons et angles solaires)
│   ├── modele_ciel.keras     # Classificateur CNN de nébulosité all-sky
│   ├── cnn_mouvement.keras   # Estimateur CNN de dynamique des nuages
│   ├── autoencodeur_goulot_16.keras # Autoencodeur 16 dimensions pour détection de défauts
│   ├── encdec_gru.keras      # Modèle Encodeur-Décodeur récurrent GRU
│   └── scaler_base.pkl       # Scalers normalisateurs Scikit-Learn
├── docs/                     # Documentation technique et captures d'écran
│   ├── ARCHITECTURE.md       # Architecture système, flux Mermaid et conception
│   ├── API.md                # Référence complète des endpoints REST
│   └── screens/              # Captures d'écran haute définition de l'interface
├── start.sh                  # Script de démarrage unifié (FastAPI + Vite + Cloudflare Tunnel)
├── stop.sh                   # Script d'arrêt propre des processus d'arrière-plan
├── LICENSE                   # Licence logicielle MIT
└── README.md                 # Documentation principale
```

---

<!-- 4. AIDE & SUPPORT -->
## Aide et Support

Vous avez une question sur l'architecture, la modélisation ou le déploiement de SolarDrâa ?
- **Documentation technique :** Consultez les documents détaillés dans le dossier [`docs/`](docs/).
- **Spécification d'API :** Accédez à la documentation OpenAPI interactive sur [`http://localhost:8000/docs`](http://localhost:8000/docs).
- **Contact direct :** N'hésitez pas à me joindre via LinkedIn ou par l'intermédiaire de mon portfolio.

---

<!-- 5. CONTRIBUTION & AUTEUR -->
## Contribuer

Les contributions, suggestions d'amélioration et signalements de bugs sont les bienvenus :
1. **Forkez** le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/OptimisationModeles`)
3. Commitez vos modifications (`git commit -m 'feat: optimisation de la couche d'attention GRU'`)
4. Pushez vers votre branche (`git push origin feature/OptimisationModeles`)
5. Ouvrez une **Pull Request**

---

## Auteur

<div align="center">

**Yazid ESSOKTANI**  
*Full-Stack Web & AI Developer*

[![Portfolio](https://img.shields.io/badge/Portfolio-essoktani.tech-00B4D8?style=for-the-badge&logo=google-chrome&logoColor=white)](https://www.essoktani.tech/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Yazid_ESSOKTANI-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yazid-essoktani-337549251)
[![GitHub](https://img.shields.io/badge/GitHub-@essoktani--yazid-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/essoktani-yazid)

</div>

---

## Licence

Distribué sous la licence **MIT**. Consultez le fichier [`LICENSE`](LICENSE) pour plus d'informations.
