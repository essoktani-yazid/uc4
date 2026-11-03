"""Outils des nouvelles cellules uniquement. Les cellules originales restent intactes."""
import os
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')
os.environ.setdefault('OMP_NUM_THREADS', '2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS', '2')
os.environ.setdefault('TF_NUM_INTEROP_THREADS', '2')
from pathlib import Path
import json, time, platform
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, roc_auc_score
try:
    from IPython.display import display
except ImportError:
    display = print

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
RESULTS = DATA / 'jalon3_results'
MODELS = ROOT / 'models'
CAPACITY = {'A': 50., 'B': 20.}
H = 6
SEED = 42

def reset_seed():
    keras.utils.set_random_seed(SEED)
    tf.config.experimental.enable_op_determinism()

def clear_sky(altitude):
    sine = np.maximum(np.sin(np.deg2rad(altitude)), 0.)
    return 1098 * sine * np.exp(-.057 / np.maximum(sine, 1e-6))

def split_dates(dates, site, last_target=None):
    dates = pd.DatetimeIndex(dates)
    last_target = dates if last_target is None else pd.DatetimeIndex(last_target)
    first, second = ('2024-10-01', '2025-01-01') if site == 'A' else ('2025-03-01', '2025-04-01')
    return {'train': np.flatnonzero(last_target < first),
            'val': np.flatnonzero((dates >= first) & (last_target < second)),
            'test': np.flatnonzero(dates >= second)}

def load_examples(site, history=24):
    """Même structure de 47 entrées. t est ici la première heure à prédire."""
    df = pd.read_csv(DATA / f'uc4_site{site}.csv', parse_dates=['horodatage'])
    assert df.horodatage.is_unique and df.horodatage.is_monotonic_increasing
    assert (df.horodatage.diff().dropna() == pd.Timedelta(hours=1)).all()
    t = np.arange(history, len(df) - H + 1)
    future = t[:, None] + np.arange(H)
    past = t[:, None] + np.arange(-24, 0)
    production = df.production.to_numpy() / CAPACITY[site]
    cs = clear_sky(df.hauteur_soleil.to_numpy())
    hour = df.horodatage.dt.hour.to_numpy()[t]
    month = df.horodatage.dt.month.to_numpy()[t]
    calendar = np.column_stack([np.sin(2*np.pi*hour/24), np.cos(2*np.pi*hour/24),
                                np.sin(2*np.pi*month/12), np.cos(2*np.pi*month/12)])
    x = np.column_stack([production[past], cs[future]/1000,
        df.nebulosite_prevue.to_numpy()[future], df.temperature_prevue.to_numpy()[future]/40,
        calendar, df.jours_depuis_nettoyage.to_numpy()[t-1]/30]).astype('float32')
    y = production[future].astype('float32')
    day = df.hauteur_soleil.to_numpy()[future] > 0
    previous_day = production[future-24]
    ref = np.divide(production[t-1, None]*cs[future], cs[t-1, None],
                    out=previous_day.copy(), where=cs[t-1, None] > 1.)
    ref = np.where(day, np.clip(ref, 0, 1), 0).astype('float32')
    parts = split_dates(df.horodatage.to_numpy()[t], site, df.horodatage.to_numpy()[future[:, -1]])
    return dict(X=x, Y=y, day=day, ref=ref, t=t, df=df, site=site, **parts)

def sky_data(site):
    z = np.load(DATA / f'uc4_ciel_{site}.npz')
    df = pd.read_csv(DATA / f'uc4_site{site}.csv', parse_dates=['horodatage'])
    x = z['X'].astype('float32')[..., None] / 255.
    y = np.column_stack([z['couverture'], z['occultation']]).astype('float32')
    return x, y, split_dates(df.horodatage.to_numpy()[z['heure']], site), z['heure']

def subset(values, indices):
    if isinstance(values, dict): return {k: subset(v, indices) for k, v in values.items()}
    if isinstance(values, (list, tuple)): return tuple(subset(v, indices) for v in values)
    return values[indices]

def as_dataset(x, y=None, shuffle=False, batch=64):
    if isinstance(x, list): x = tuple(x)
    ds = tf.data.Dataset.from_tensor_slices(x if y is None else (x, y))
    if shuffle:
        n = len(next(iter(y.values()))) if isinstance(y, dict) else len(y)
        ds = ds.shuffle(n, seed=SEED)
    options = tf.data.Options()
    options.threading.private_threadpool_size = 2
    return ds.batch(batch).with_options(options)

def fit_model(model, x, y, train_idx, val_idx, epochs=100, batch=64, monitor='val_loss'):
    callbacks = [keras.callbacks.EarlyStopping(monitor=monitor, mode='min', patience=12, restore_best_weights=True, min_delta=1e-6),
                 keras.callbacks.ReduceLROnPlateau(monitor=monitor, mode='min', patience=5, factor=.5, min_lr=1e-6)]
    start = time.perf_counter()
    history = model.fit(as_dataset(subset(x, train_idx), subset(y, train_idx), True, batch),
                        validation_data=as_dataset(subset(x, val_idx), subset(y, val_idx), batch=batch),
                        epochs=epochs, callbacks=callbacks, verbose=0)
    return history.history, time.perf_counter() - start

def predict_model(model, x):
    parts = []
    size = len(x[0]) if isinstance(x, (list, tuple)) else len(x)
    for start in range(0, size, 512):
        out = model(subset(x, slice(start, start+512)), training=False)
        parts.append([v.numpy() for v in out] if isinstance(out, (list, tuple)) else out.numpy())
    if isinstance(parts[0], list): return [np.concatenate([p[i] for p in parts]) for i in range(len(parts[0]))]
    return np.concatenate(parts)

def score_forecast(examples, prediction, indices):
    y, day, ref = [examples[key][indices] for key in ['Y', 'day', 'ref']]
    prediction = np.where(day, np.clip(prediction, 0, 1), 0)
    cap = CAPACITY[examples['site']]
    rmse = np.array([np.sqrt(np.mean((prediction[day[:, h], h]-y[day[:, h], h])**2))*cap for h in range(H)])
    baseline = np.array([np.sqrt(np.mean((ref[day[:, h], h]-y[day[:, h], h])**2))*cap for h in range(H)])
    gain = 1-rmse/baseline
    return {'gain1h': float(gain[0]), 'gain6h': float(gain[-1]), 'gainMean': float(gain.mean()), 'rmse1hMW': float(rmse[0])}

def save_table(rows, name):
    table = pd.DataFrame(rows)
    table.to_csv(RESULTS / f'{name}.csv', index=False)
    display(table.round(4))
    return table

def plot_learning(history, name):
    plt.figure(figsize=(7, 3))
    plt.plot(history['loss'], label='Train')
    plt.plot(history['val_loss'], label='Validation')
    plt.title(name); plt.xlabel('Époque'); plt.ylabel('Perte'); plt.legend()
    plt.tight_layout(); plt.savefig(RESULTS / f'{name}.png', dpi=120); plt.show()

def export_forecast(examples, prediction, name):
    idx = examples['test']
    prediction = np.where(examples['day'][idx], np.clip(prediction, 0, 1), 0)
    metrics = score_forecast(examples, prediction, idx)
    np.savez_compressed(RESULTS / f'{name}_predictions.npz', prediction=prediction,
                        target=examples['Y'][idx], reference=examples['ref'][idx], day=examples['day'][idx])
    save_table([metrics], name)
    return metrics

def make_sequence(examples, length):
    df = examples['df']; t = examples['t']
    hour = df.horodatage.dt.hour.to_numpy()
    known = np.column_stack([clear_sky(df.hauteur_soleil.to_numpy())/1000,
              df.nebulosite_prevue, df.temperature_prevue/40,
              np.sin(2*np.pi*hour/24), np.cos(2*np.pi*hour/24)]).astype('float32')
    history = np.column_stack([df.production/CAPACITY[examples['site']], known]).astype('float32')
    return [np.stack([history[i-length:i] for i in t]), np.stack([known[i:i+H] for i in t])]

reset_seed()
