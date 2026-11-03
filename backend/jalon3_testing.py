"""Inférence des modèles finaux avec le prétraitement exact du notebook."""
import base64
import importlib.util
import io
from functools import lru_cache
from pathlib import Path
from typing import Literal

import numpy as np
from PIL import Image, UnidentifiedImageError
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix='/api/jalon3')
ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / 'models'


@lru_cache(maxsize=1)
def resources():
    from backend import jalon3_tools
    jalon3_tools.DATA = ROOT / 'data'
    jalon3_tools.MODELS = MODELS_DIR
    return jalon3_tools


@lru_cache(maxsize=6)
def model(name):
    from tensorflow import keras
    return keras.models.load_model(MODELS_DIR / name, compile=False)


@lru_cache(maxsize=1)
def examples():
    import joblib
    return resources().load_examples('B'), joblib.load(MODELS_DIR / 'ajout_j1_scaler.joblib')


@lru_cache(maxsize=2)
def sky(site):
    return resources().sky_data(site)


class SampleRequest(BaseModel):
    index: int = Field(default=0, ge=0)


class SkyRequest(SampleRequest):
    site: Literal['A', 'B'] = 'B'
    image_base64: str | None = None


def index_in_test(data, index):
    indices = data['test']
    if index >= len(indices):
        raise HTTPException(422, detail=f'Indice hors limites : 0 à {len(indices)-1}.')
    return int(indices[index])


@router.get('/samples')
def sample_counts():
    data, _ = examples()
    return {'production': len(data['test']), 'sky': {site: len(sky(site)[2]['test']) for site in ['A', 'B']}}


@router.post('/production')
def predict_production(req: SampleRequest):
    data, scaler = examples()
    i = index_in_test(data, req.index)
    x = scaler.transform(data['X'][i:i+1])
    day = data['day'][i]
    def forecast(name):
        value = np.asarray(model(name)(x, training=False))[0]
        return (np.where(day, np.clip(value, 0, 1), 0) * 20).tolist()
    direct = forecast('ajout_j1_mlp.keras')
    tuned = forecast('ajout_j3_transfert.keras')
    actual = data['Y'][i] * 20
    start = int(data['t'][i])
    def mae(values):
        return float(np.mean(np.abs(np.asarray(values)[day] - actual[day]))) if day.any() else None
    return {'site': 'B', 'partition': 'test, avril–juin 2025',
            'timestamps': data['df'].horodatage.iloc[start:start+6].astype(str).tolist(),
            'historyMW': data['df'].production.iloc[start-24:start].tolist(),
            'zeroShotMW': direct, 'fineTunedMW': tuned, 'actualMW': actual.tolist(),
            'referenceMW': (data['ref'][i]*20).tolist(), 'day': day.tolist(),
            'maeZeroShotMW': mae(direct), 'maeFineTunedMW': mae(tuned),
            'note': 'MAE locale sur les heures de jour de cet exemple ; elle ne remplace pas les scores globaux.'}


@router.post('/sky')
def predict_sky(req: SkyRequest):
    truth = None
    if req.image_base64 is not None:
        if len(req.image_base64) > 7_000_000:
            raise HTTPException(413, detail='Image trop volumineuse (maximum 5 Mo).')
        try:
            raw = base64.b64decode(req.image_base64.split(',')[-1], validate=True)
            if len(raw) > 5_000_000:
                raise HTTPException(413, detail='Image trop volumineuse.')
            with Image.open(io.BytesIO(raw)) as source:
                if source.width * source.height > 20_000_000:
                    raise ValueError('Dimensions excessives')
                expected = model('j3_cnn_B_simple.keras' if req.site == 'B' else 'ajout_j3_multitache.keras').input_shape
                image = source.convert('L').resize((expected[2], expected[1]))
                x = np.asarray(image, dtype='float32')[None, ..., None] / 255
        except (ValueError, UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise HTTPException(422, detail='Image invalide. Importez une image PNG ou JPEG du ciel.') from exc
    else:
        images, labels, parts, _ = sky(req.site)
        i = index_in_test(parts, req.index)
        x = images[i:i+1]
        image = Image.fromarray(np.rint(x[0, ..., 0]*255).astype('uint8'))
        truth = {'coverage': float(labels[i, 0]), 'occultation': float(labels[i, 1])}
    name = 'j3_cnn_B_simple.keras' if req.site == 'B' else 'ajout_j3_multitache.keras'
    occ, cov = model(name)(x, training=False)
    predicted = {'occultation': float(np.asarray(occ).ravel()[0]),
                 'coverage': float(np.asarray(cov).ravel()[0]) if req.site == 'B' else None}
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    errors = {key: abs(value-truth[key]) for key, value in predicted.items() if value is not None} if truth else None
    return {'site': req.site, 'prediction': predicted, 'truth': truth, 'absoluteError': errors,
            'image': 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode(),
            'note': 'Sur A, λ=0 : couverture non supervisée, estimation masquée.' if req.site == 'A' else
                    'Import : vérité terrain inconnue, erreur non calculable. Une photographie hors distribution peut donner une estimation peu fiable.' if truth is None else
                    'Exemple du test B ; erreur absolue locale, sans unité.'}
