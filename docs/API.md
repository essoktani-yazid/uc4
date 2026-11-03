# Référence API — SolarDrâa

> Documentation technique et spécification exhaustive des endpoints REST exposés par le backend FastAPI de la plateforme **SolarDrâa**.

- **URL de base (Développement local) :** `http://localhost:8000`
- **Format d'échange :** `application/json`
- **Documentation interactive Swagger UI :** [`http://localhost:8000/docs`](http://localhost:8000/docs)
- **Documentation interactive ReDoc :** [`http://localhost:8000/redoc`](http://localhost:8000/redoc)

---

## 1. Vue d'ensemble & Sécurité

L'API de SolarDrâa est structurée sous forme de micro-services modulaires exposant des modèles de Deep Learning pré-chargés en mémoire vive pour garantir une latence d'inférence inférieure à 30 ms.

- **CORS :** Configuré pour accepter les requêtes du frontend local (`http://localhost:5173`) et des proxys sécurisés Cloudflare Tunnel (`https://*.trycloudflare.com`).
- **Encodage d'images :** Les flux d'images (ciel fisheye, thermographie) sont transmis en JSON sous forme de chaînes encodées en Base64 (`image/png` ou `image/jpeg`).

---

## 2. Endpoints Système & Métadonnées

### `GET /api/health`

Vérifie l'état opérationnel du serveur et la disponibilité des modèles de Deep Learning chargés en mémoire.

- **Méthode :** `GET`
- **Authentification requise :** Non

#### Exemple de réponse (`200 OK`)

```json
{
  "status": "ready",
  "models_loaded": {
    "solaire_optimise": true,
    "scaler_base": true,
    "ciel": true,
    "mlp_enrichi": true,
    "scaler_enrichi": true,
    "cnn_mouvement": true,
    "siteA_depart": true,
    "siteB_ft": true,
    "encdec_gru": true
  },
  "system": {
    "device": "CPU / Neural Engine",
    "framework": "TensorFlow / Keras 3",
    "centrale": "SolarDrâa (50 MW)",
    "sites": ["Site A (Désert - Ouarzazate)", "Site B (Littoral - Tarfaya)"]
  }
}
```

---

### `GET /api/samples`

Fournit les profils d'échantillons météorologiques et les pré-sélections d'images de test pour l'opérateur.

- **Méthode :** `GET`
- **Authentification requise :** Non

#### Exemple de réponse (`200 OK`)

```json
{
  "status": "success",
  "presets": [
    {
      "id": "journee_estivale",
      "nom": "Journée Claire Estivale (50 MWc)",
      "ghi_moyen": 920.5,
      "temperature_moyenne": 34.2
    },
    {
      "id": "passage_nuageux",
      "nom": "Passage Nuageux Hivernal",
      "ghi_moyen": 480.0,
      "temperature_moyenne": 18.5
    }
  ]
}
```

---

## 3. Prévision de Production & Vision Multi-Modale

### `POST /api/predict/tabular`

Calcule la prévision de puissance électrique brute sur 6 heures ($t+1h$ à $t+6h$) via le réseau dense MLP Optimisé (47 variables).

- **Méthode :** `POST`
- **Authentification requise :** Non

#### Corps de la requête (Request Body)

```json
{
  "historique_24h": [0,0,0,0,0,0,1.2,8.4,18.5,29.1,38.4,45.2,48.1,46.3,39.8,28.4,15.2,4.1,0,0,0,0,0,0],
  "ghi_prevue": [850, 890, 840, 720, 510, 240],
  "nebulosite_prevue": [0.1, 0.15, 0.2, 0.25, 0.3, 0.35],
  "temperature_prevue": [24.5, 26.0, 27.2, 27.8, 26.5, 24.0],
  "heure_sin": 0.0,
  "heure_cos": -1.0,
  "mois_sin": -0.5,
  "mois_cos": -0.866,
  "jours_depuis_nettoyage": 5.0,
  "capacite_nominale": 50.0
}
```

#### Exemple de réponse (`200 OK`)

```json
{
  "previsions_mw": [38.2, 44.6, 42.1, 35.8, 24.9, 11.3],
  "previsions_pct": [76.4, 89.2, 84.2, 71.6, 49.8, 22.6],
  "persistance_mw": [32.0, 32.0, 32.0, 32.0, 32.0, 32.0],
  "horizons": ["t+1h", "t+2h", "t+3h", "t+4h", "t+5h", "t+6h"],
  "rmse_estime": 3.84,
  "message": "Prévisions calculées avec succès via le MLP Optimisé 47 variables."
}
```

---

### `POST /api/predict/sky`

Analyse une image plein ciel (caméra all-sky imager) via CNN convolutif pour classifier l'état du ciel, estimer le pourcentage de couverture nuageuse et l'occultation du soleil.

- **Méthode :** `POST`
- **Authentification requise :** Non

#### Corps de la requête (Request Body)

```json
{
  "preset_id": "ciel_cirrus_voile",
  "image_base64": null
}
```

#### Exemple de réponse (`200 OK`)

```json
{
  "couverture_nuageuse_pct": 28.5,
  "occultation_soleil_pct": 14.2,
  "etat_ciel": "Voile de Cirrus",
  "impact_production": "Atténuation diffuse mineure (-4.5%)",
  "image_processed": null
}
```

---

### `POST /api/predict/enriched`

Fusionne les variables météorologiques physiques tabulaires et les observations de couverture nuageuse issues du modèle de vision pour produire une prévision enrichie de haute précision.

- **Méthode :** `POST`
- **Authentification requise :** Non

#### Corps de la requête (Request Body)

```json
{
  "tabular": {
    "historique_24h": [0,0,0,0,0,0,1.2,8.4,18.5,29.1,38.4,45.2,48.1,46.3,39.8,28.4,15.2,4.1,0,0,0,0,0,0],
    "ghi_prevue": [850, 890, 840, 720, 510, 240],
    "nebulosite_prevue": [0.1, 0.15, 0.2, 0.25, 0.3, 0.35],
    "temperature_prevue": [24.5, 26.0, 27.2, 27.8, 26.5, 24.0],
    "heure_sin": 0.0,
    "heure_cos": -1.0,
    "mois_sin": -0.5,
    "mois_cos": -0.866,
    "jours_depuis_nettoyage": 5.0,
    "capacite_nominale": 50.0
  },
  "couverture_t": 32.0,
  "occultation_t": 15.0,
  "couverture_tm1": 25.0,
  "occultation_tm1": 10.0
}
```

#### Exemple de réponse (`200 OK`)

```json
{
  "previsions_classique_mw": [38.2, 44.6, 42.1, 35.8, 24.9, 11.3],
  "previsions_enrichi_mw": [39.8, 45.9, 43.5, 37.1, 25.8, 11.9],
  "persistance_mw": [32.0, 32.0, 32.0, 32.0, 32.0, 32.0],
  "gain_par_horizon_pct": [18.4, 21.2, 24.5, 26.8, 22.1, 15.3],
  "gain_moyen_pct": 21.38,
  "horizons": ["t+1h", "t+2h", "t+3h", "t+4h", "t+5h", "t+6h"],
  "interpretation": "L'intégration des caractéristiques de vision apporte un gain moyen de +21.4% par rapport au modèle tabulaire standard."
}
```

---

### `POST /api/predict/motion`

Évalue la dynamique de déplacement des masses nuageuses à partir de deux images consécutives ($t-1$ et $t$) par convolution spatio-temporelle pour anticiper le risque d'ombrage à $t+1h$.

- **Méthode :** `POST`
- **Authentification requise :** Non

#### Corps de la requête (Request Body)

```json
{
  "preset_id": "approche_front_ouest",
  "img_tm1_base64": null,
  "img_t_base64": null
}
```

#### Exemple de réponse (`200 OK`)

```json
{
  "occultation_tp1_pct": 68.4,
  "niveau_risque": "Élevé",
  "action_recommandee": "Alerter le gestionnaire de réseau d'un décrochage potentiel de puissance sous 45 minutes.",
  "img_tm1": null,
  "img_t": null
}
```

---

## 4. Transfert de Domaine & Multi-Sites (Site A & B)

### `GET /api/jalon3/results`

Retourne la synthèse chiffrée des performances comparatives entre le modèle de départ du Site A, les différentes approches de transfert (Zero-Shot, Linear Probing gel 1 ou 2 couches, Fine-Tuning complet) et les métriques de validation finale sur le Site B.

- **Méthode :** `GET`
- **Authentification requise :** Non

#### Exemple de réponse (`200 OK`)

```json
{
  "status": "success",
  "site_b": {
    "capacite_mw": 20.0,
    "gain_zero_shot": 21.2,
    "gain_finetuned_complet": 31.8,
    "rmse_persistance": 4.12,
    "rmse_finetuned": 2.81
  },
  "multitache": {
    "lambda_balance": 0.3,
    "gain_production": 24.6,
    "accuracy_ciel": 91.4
  }
}
```

---

### `POST /api/jalon3/production`

Exécute l'inférence de production sur le Site B pour un échantillon chronologique donné.

- **Méthode :** `POST`
- **Authentification requise :** Non

#### Corps de la requête (Request Body)

```json
{
  "index": 12
}
```

#### Exemple de réponse (`200 OK`)

```json
{
  "index": 12,
  "site": "B",
  "capacite_mw": 20.0,
  "production_reelle_mw": 14.8,
  "prediction_zeroshot_mw": 13.2,
  "prediction_finetuned_mw": 14.5,
  "ecart_finetuned_pct": 2.03
}
```

---

## 5. Diagnostic Thermographique & Détection d'Anomalies

### `GET /api/thermo/samples`

Fournit les métadonnées globales de la base d'échantillons infrarouges de cellules photovoltaïques (distribution des défauts, seuils de classification MSE à 5% de fausse alarme, moyenne et écart-type en °C).

- **Méthode :** `GET`
- **Authentification requise :** Non

#### Exemple de réponse (`200 OK`)

```json
{
  "total": 300,
  "counts": {
    "0": 180,
    "1": 35,
    "2": 45,
    "3": 25,
    "4": 15
  },
  "labels": {
    "0": "Module Sain",
    "1": "Diode By-pass Défaillante",
    "2": "Cellule Fissurée (Hotspot)",
    "3": "Salissure & Poussière",
    "4": "Autre Anomalie"
  },
  "models": {
    "goulot_16": {
      "threshold": 0.0412,
      "description": "Autoencodeur compact 16 dimensions"
    },
    "goulot_32": {
      "threshold": 0.0325,
      "description": "Autoencodeur 32 dimensions"
    }
  },
  "mu_celsius": 42.15,
  "sd_celsius": 8.74
}
```

---

### `POST /api/thermo/predict`

Exécute la détection d'anomalies sur une image thermographique de cellule photovoltaïque via autoencodeur convolutif. Calcule l'image reconstruite, l'erreur de reconstruction (MSE) et détermine si la cellule présente une défaillance.

- **Méthode :** `POST`
- **Authentification requise :** Non

#### Corps de la requête (Request Body)

```json
{
  "index": 1,
  "model_name": "goulot_16",
  "image_base64": null
}
```

#### Exemple de réponse (`200 OK`)

```json
{
  "index": 1,
  "model_name": "goulot_16",
  "mse": 0.0894,
  "threshold": 0.0412,
  "is_anomaly": true,
  "anomaly_score_pct": 89.4,
  "ground_truth_label": "Cellule Fissurée (Hotspot)",
  "ground_truth_code": 2,
  "original_image_base64": "data:image/png;base64,iVBORw0KGgo...",
  "reconstructed_image_base64": "data:image/png;base64,iVBORw0KGgo...",
  "error_map_base64": "data:image/png;base64,iVBORw0KGgo...",
  "diagnostic": "Anomalie critique détectée : la cellule présente un point chaud avec un dépassement net du seuil opérationnel (MSE 0.089 > 0.041)."
}
```

---

## 6. Modélisation Temporelle Séquentielle (GRU / LSTM)

### `POST /api/jalon4/predict`

Génère une prévision récurrente multi-horizon ($t+1h$ à $t+6h$) à partir d'une séquence temporelle passée ($6h$ à $168h$) en comparant les architectures RNN, LSTM et GRU face aux scénarios d'exploitation (encrassement, tempête de poussière ou cycle nominal).

- **Méthode :** `POST`
- **Authentification requise :** Non

#### Corps de la requête (Request Body)

```json
{
  "history_hours": 48,
  "model_type": "gru",
  "generation_strategy": "seq2seq",
  "scenario_id": "poussiere_veille",
  "site": "A"
}
```

#### Exemple de réponse (`200 OK`)

```json
{
  "horizons": ["t+1h", "t+2h", "t+3h", "t+4h", "t+5h", "t+6h"],
  "sequential_mw": [36.4, 43.1, 41.8, 35.2, 24.1, 10.8],
  "mlp_ref_mw": [32.1, 38.5, 37.9, 31.4, 21.0, 9.2],
  "persistence_mw": [28.0, 28.0, 28.0, 28.0, 28.0, 28.0],
  "actual_mw": [36.8, 43.5, 42.0, 35.0, 23.9, 10.5],
  "gain_moyen_h1_h6": 0.324,
  "gain_moyen_target": 0.30,
  "gain_target_met": true,
  "gain_h1": 0.145,
  "gain_h1_target": 0.12,
  "gain_h1_met": true,
  "model_size_mb": 0.038,
  "size_target_mb": 5.0,
  "size_target_met": true,
  "model_params": 9433,
  "param_budget_label": "Budget conforme (< 10 000 paramètres)",
  "rmse_sequential": 1.94,
  "rmse_mlp": 3.42,
  "rmse_persistence": 5.61,
  "capacite_nominale": 50.0,
  "decoding_steps": [
    {
      "horizon": "t+1h",
      "sequential_mw": 36.4,
      "mlp_ref_mw": 32.1,
      "persistence_mw": 28.0,
      "actual_mw": 36.8,
      "irradiance_future": 780.0,
      "gate_state": "Update Gate z=0.84, Reset Gate r=0.22"
    }
  ],
  "decision_analysis": {
    "summary": "Excellente robustesse du modèle GRU Encodeur-Décodeur face au dépôt de poussière de la veille.",
    "title": "Avantage Majeur de la Mémoire Récurrente",
    "narrative": "Le réseau récurrent extrait l'inertie d'encrassement accumulée sur les 48 heures passées et ajuste dynamiquement l'amplitude des prévisions.",
    "memory_effect": "Atténuation adaptée sans déphasage temporel.",
    "comparison_with_mlp": "Le modèle GRU bat le MLP de +12.8% de précision additionnelle.",
    "jury_takeaway": "Validation complète des critères d'évaluation industrielle."
  }
}
```

---

## 7. Codes de Statut et Gestion des Erreurs

Toutes les erreurs renvoyées par l'API respectent la structure standard FastAPI avec un champ `detail` explicite :

```json
{
  "detail": "Description détaillée de l'anomalie ou du paramètre invalide"
}
```

| Code HTTP | Libellé | Circonstance d'apparition |
| :--- | :--- | :--- |
| `200 OK` | Succès | Requête traitée avec succès, retour du payload d'inférence. |
| `400 Bad Request` | Requête Invalide | Paramètre d'entrée manquant ou hors des plages autorisées. |
| `413 Payload Too Large` | Image Trop Volumineuse | L'image thermographique transmise en Base64 excède la limite de 5 Mo. |
| `422 Unprocessable Entity` | Données Non Traitables | Format JSON incorrect, type d'image non reconnu ou indice d'échantillon hors bornes. |
| `503 Service Unavailable` | Modèle Non Chargé | Le fichier de poids `.keras` ou le scaler `.pkl` requis est absent du disque. |
| `500 Internal Server Error` | Erreur Serveur | Exception non capturée lors de l'exécution du graphe de calcul TensorFlow. |

---

[⬅ Retour au README principal](../README.md)
