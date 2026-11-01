"""Module de détection d'anomalies thermographiques par Auto-Encodeur (Jalon 2)."""
import base64
import io
from functools import lru_cache
from pathlib import Path
from typing import Literal

import numpy as np
import matplotlib.pyplot as plt
from PIL import Image, UnidentifiedImageError
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/thermo", tags=["thermographie"])

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "uc4_thermographie.npz"
MODELS_DIR = ROOT / "models"

DEFECT_LABELS = {
    0: "Module Sain (Normal)",
    1: "Défaut Étendu (Diode By-pass)",
    2: "Cellules Fissurées (Hotspot)",
    3: "Défaut Global (Salissure / Poussière)",
    4: "Autre Anomalie Thermique",
}

THRESHOLDS = {
    "goulot_16": {"max": 0.4881, "mean": 0.1057, "label": "Auto-Encodeur Goulot 16 (16 variables latentes - Recommandé)"},
    "goulot_32": {"max": 2.0531, "mean": 1.4329, "label": "Auto-Encodeur Goulot 32 (32 variables latentes)"},
    "sans_goulot": {"max": 0.4234, "mean": 0.0177, "label": "Auto-Encodeur Sans Goulot"},
}


@lru_cache(maxsize=1)
def load_thermo_data():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Fichier introuvable: {DATA_PATH}")
    npz = np.load(DATA_PATH)
    x_train = npz["X_train"].astype("float32")
    x_test = npz["X_test"].astype("float32")
    defaut_test = npz["defaut_test"].astype("int32")

    mu = float(x_train.mean())
    sd = float(x_train.std())
    return {
        "x_test": x_test,
        "defaut_test": defaut_test,
        "mu": mu,
        "sd": sd,
        "total": len(x_test),
    }


@lru_cache(maxsize=3)
def load_autoencoder(variant: str = "goulot_16"):
    import tensorflow as tf

    filename_map = {
        "goulot_16": "autoencodeur_goulot_16.keras",
        "goulot_32": "autoencodeur_goulot_32.keras",
        "sans_goulot": "autoencodeur_sans_goulot.keras",
    }
    fname = filename_map.get(variant, "autoencodeur_goulot_16.keras")
    model_path = MODELS_DIR / fname
    if not model_path.exists():
        raise FileNotFoundError(f"Modèle introuvable : {model_path}")
    return tf.keras.models.load_model(str(model_path), compile=False)


def array_to_b64(arr_2d: np.ndarray, cmap_name: str = "inferno", vmin=None, vmax=None) -> str:
    """Convertit une matrice 2D (24, 40) en image PNG base64 avec colormap thermographique."""
    arr = np.asarray(arr_2d, dtype="float32")
    min_val = float(arr.min()) if vmin is None else float(vmin)
    max_val = float(arr.max()) if vmax is None else float(vmax)

    if max_val - min_val > 1e-6:
        normalized = (arr - min_val) / (max_val - min_val)
    else:
        normalized = np.zeros_like(arr)

    normalized = np.clip(normalized, 0.0, 1.0)
    cmap = plt.get_cmap(cmap_name)
    rgba = (cmap(normalized) * 255).astype("uint8")

    # Redimensionnement vers (120, 200) pour affichage net sans flou
    img = Image.fromarray(rgba).resize((200, 120), Image.Resampling.NEAREST)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


class ThermoPredictRequest(BaseModel):
    index: int = Field(default=0, ge=0)
    model_name: Literal["goulot_16", "goulot_32", "sans_goulot"] = "goulot_16"
    image_base64: str | None = None


@router.get("/samples")
def get_thermo_samples():
    """Retourne les métadonnées des échantillons thermographiques."""
    data = load_thermo_data()
    defauts = data["defaut_test"]

    counts = {int(code): int((defauts == code).sum()) for code in range(5)}

    presets = [
        {"label": "Module Sain", "index": 0, "code": 0, "desc": "Panneau homogène sans point chaud"},
        {"label": "Cellule Fissurée (Hotspot)", "index": 1, "code": 2, "desc": "Surchauffe ponctuelle sévère"},
        {"label": "Diode By-pass Défaillante", "index": 19, "code": 1, "desc": "Surchauffe sur un tiers du module"},
        {"label": "Salissure & Poussière", "index": 13, "code": 3, "desc": "Gradient thermique anormal et diffus"},
        {"label": "Autre Anomalie", "index": 15, "code": 4, "desc": "Défaut de connexion thermique"},
    ]

    return {
        "total": data["total"],
        "counts": counts,
        "labels": DEFECT_LABELS,
        "presets": presets,
        "models": THRESHOLDS,
        "mu_celsius": round(data["mu"], 2),
        "sd_celsius": round(data["sd"], 2),
    }


@router.post("/predict")
def predict_thermo(req: ThermoPredictRequest):
    """Effectue l'inférence par l'auto-encodeur sur une image thermique."""
    data = load_thermo_data()
    mu = data["mu"]
    sd = data["sd"]

    is_custom_upload = req.image_base64 is not None
    ground_truth_code = None
    ground_truth_label = None

    if is_custom_upload:
        try:
            raw = base64.b64decode(req.image_base64.split(",")[-1], validate=True)
            if len(raw) > 5_000_000:
                raise HTTPException(413, detail="Image trop volumineuse (maximum 5 Mo).")
            with Image.open(io.BytesIO(raw)) as source:
                gray = source.convert("L").resize((40, 24))
                # Conversion approximative en degrés Celsius centrée sur la moyenne
                temp_arr = np.asarray(gray, dtype="float32") / 255.0 * 30.0 + (mu - 15.0)
        except (ValueError, UnidentifiedImageError, OSError) as exc:
            raise HTTPException(422, detail="Image invalide. Importez une image PNG ou JPEG.") from exc
    else:
        idx = req.index
        if idx >= data["total"]:
            raise HTTPException(422, detail=f"Index hors limites (0 à {data['total'] - 1}).")
        temp_arr = data["x_test"][idx]  # forme (24, 40) en °C
        ground_truth_code = int(data["defaut_test"][idx])
        ground_truth_label = DEFECT_LABELS.get(ground_truth_code, "Inconnu")

    # Normalisation Z-score identique au notebook
    norm_input = ((temp_arr - mu) / sd).reshape(1, 24, 40, 1)

    # Inférence auto-encodeur
    model = load_autoencoder(req.model_name)
    norm_rec = np.asarray(model(norm_input, training=False))[0]  # forme (24, 40, 1)

    # Dénormalisation de la reconstruction
    rec_temp_arr = (norm_rec[..., 0] * sd) + mu

    # Carte d'erreur de reconstruction (valeurs normalisées pour le score)
    err_map = np.abs(norm_input[0, ..., 0] - norm_rec[..., 0])

    score_max = float(np.max(err_map))
    score_mean = float(np.mean(err_map))

    seuil_info = THRESHOLDS.get(req.model_name, THRESHOLDS["goulot_16"])
    seuil_max = seuil_info["max"]
    seuil_mean = seuil_info["mean"]

    is_anomaly = score_max >= seuil_max

    # Confiance de détection
    ratio = score_max / seuil_max
    if is_anomaly:
        confidence = min(99.0, max(60.0, 50.0 + (ratio - 1.0) * 35.0))
    else:
        confidence = min(99.0, max(60.0, 50.0 + (1.0 - ratio) * 45.0))

    # Génération des images colorisées base64
    original_b64 = array_to_b64(temp_arr, cmap_name="inferno")
    reconstructed_b64 = array_to_b64(rec_temp_arr, cmap_name="inferno")
    error_b64 = array_to_b64(err_map, cmap_name="hot", vmin=0.0, vmax=max(3.0, float(score_max)))

    # Diagnostic textuel synthétique
    if is_anomaly:
        if score_max >= seuil_max * 2.5:
            severity = "Critique"
            diag = "Point chaud majeur ou diode défaillante détectée : surchauffe thermique localisée nécessitant une intervention."
        else:
            severity = "Modérée"
            diag = "Anomalie thermique détectée dépassant le seuil de fausse alerte à 5 % (cellule fissurée ou accumulation de salissure)."
    else:
        severity = "Normale"
        diag = "Module thermique sain : la reconstruction par l'auto-encodeur est fidèle, pas de surchauffe anormale constatée."

    return {
        "index": req.index if not is_custom_upload else None,
        "model_name": req.model_name,
        "is_custom_upload": is_custom_upload,
        "ground_truth": {
            "code": ground_truth_code,
            "label": ground_truth_label,
            "is_anomaly": ground_truth_code != 0 if ground_truth_code is not None else None,
        },
        "metrics": {
            "score_max": round(score_max, 4),
            "score_mean": round(score_mean, 4),
            "seuil_max_5fa": round(seuil_max, 4),
            "seuil_mean_5fa": round(seuil_mean, 4),
            "is_anomaly": is_anomaly,
            "confidence_pct": round(confidence, 1),
            "severity": severity,
        },
        "temperatures_celsius": {
            "original_min": round(float(temp_arr.min()), 1),
            "original_max": round(float(temp_arr.max()), 1),
            "original_mean": round(float(temp_arr.mean()), 1),
            "reconstructed_mean": round(float(rec_temp_arr.mean()), 1),
            "max_delta_temp": round(float(np.max(np.abs(temp_arr - rec_temp_arr))), 1),
        },
        "images": {
            "original": original_b64,
            "reconstructed": reconstructed_b64,
            "error_heatmap": error_b64,
        },
        "diagnostic": diag,
    }
