import React, { useState, useEffect, useRef } from 'react';

// Cubic easing for silky smooth transitions
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Hook pour animer un nombre unique de manière continue (650ms)
function useAnimatedNumber(targetNumber, duration = 650, decimals = 2) {
  const [current, setCurrent] = useState(Number(targetNumber || 0));
  const startRef = useRef(Number(targetNumber || 0));
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (targetNumber === null || targetNumber === undefined || isNaN(targetNumber)) return;
    const start = startRef.current;
    const target = Number(targetNumber);
    startTimeRef.current = performance.now();

    let frameId;
    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      const ease = easeOutCubic(progress);
      const next = Number((start + (target - start) * ease).toFixed(decimals));

      setCurrent(next);
      startRef.current = next;

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [targetNumber, duration, decimals]);

  return current;
}

const fmt = (val, digits = 2) => {
  if (val == null || isNaN(val)) return '—';
  return Number(val).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export default function ThermographyWorkbench() {
  const [samplesMeta, setSamplesMeta] = useState(null);
  const [modelVariant, setModelVariant] = useState('goulot_16'); // 'goulot_16' | 'goulot_32' | 'sans_goulot'
  const [sourceMode, setSourceMode] = useState('sample'); // 'sample' | 'upload'
  const [sampleIndex, setSampleIndex] = useState(1); // 1 = Cellule Fissurée (Hotspot)
  const [customUpload, setCustomUpload] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Animated KPI numbers
  const animScoreMax = useAnimatedNumber(result?.metrics?.score_max, 650, 4);
  const animScoreMean = useAnimatedNumber(result?.metrics?.score_mean, 650, 4);
  const animConfidence = useAnimatedNumber(result?.metrics?.confidence_pct, 650, 1);
  const animMaxTemp = useAnimatedNumber(result?.temperatures_celsius?.original_max, 650, 1);
  const animMeanTemp = useAnimatedNumber(result?.temperatures_celsius?.original_mean, 650, 1);
  const animDeltaTemp = useAnimatedNumber(result?.temperatures_celsius?.max_delta_temp, 650, 1);

  // Load sample metadata on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/thermo/samples')
      .then(async (res) => {
        const text = await res.text();
        return JSON.parse(text);
      })
      .then((data) => {
        if (isMounted) setSamplesMeta(data);
      })
      .catch((err) => {
        if (isMounted) console.warn('Erreur chargement metadata thermo:', err);
      });

    // Initial inference on Cellule Fissurée (Index 1) with autoencodeur_goulot_16
    executeInference(1, 'goulot_16', null);

    return () => {
      isMounted = false;
    };
  }, []);

  const executeInference = async (idx, model, uploadB64) => {
    setLoading(true);
    setError('');
    try {
      const payload = uploadB64
        ? { index: 0, model_name: model, image_base64: uploadB64 }
        : { index: Number(idx), model_name: model };

      const res = await fetch('/api/thermo/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Réponse serveur non-JSON.');
      }

      if (!res.ok) throw new Error(data.detail || 'Erreur lors de l’inférence thermographique.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      setError('Image trop volumineuse : maximum 5 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomUpload(reader.result);
      executeInference(0, modelVariant, reader.result);
    };
    reader.onerror = () => setError('Lecture du fichier impossible.');
    reader.readAsDataURL(file);
  };

  const pickRandomSample = () => {
    const total = samplesMeta?.total || 1500;
    const rnd = Math.floor(Math.random() * total);
    setSampleIndex(rnd);
    setCustomUpload(null);
    executeInference(rnd, modelVariant, null);
  };

  const isAnomaly = result?.metrics?.is_anomaly;
  const seuilMax = result?.metrics?.seuil_max_5fa || 0.4881;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-fade-in transition-all duration-300">
      {/* ========================================================================= */}
      {/* COLONNE GAUCHE: CONTRÔLES & SÉLECTION D'ÉCHANTILLON (5 cols)               */}
      {/* ========================================================================= */}
      <div className="xl:col-span-5 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Banc d'Essai Auto-Encodeur Thermique
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Détection d'anomalies sur panneaux solaires par reconstruction (Jalon 2)
              </p>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
              Goulot 16
            </span>
          </div>

          {/* 1. Sélection de la Variante d'Auto-Encodeur */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Modèle d'Auto-Encodeur Convolutif :
            </label>
            <div className="space-y-1.5">
              {[
                {
                  id: 'goulot_16',
                  label: 'Auto-Encodeur Goulot 16 (16 variables latentes)',
                  badge: 'Recommandé',
                  badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
                  desc: 'Compression maximale : 16 dimensions au goulot. Excellente séparation des anomalies ponctuelles (hotspots, micro-fissures).',
                },
                {
                  id: 'goulot_32',
                  label: 'Auto-Encodeur Goulot 32 (32 variables latentes)',
                  badge: 'Jalon 2',
                  badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
                  desc: 'Compromis 32 dimensions : reconstruit plus fidèlement les motifs thermiques complexes.',
                },
                {
                  id: 'sans_goulot',
                  label: 'Auto-Encodeur Sans Goulot',
                  badge: 'Baseline',
                  badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
                  desc: 'Pas de goulot d’étranglement sévère. Risque de sur-apprentissage et mémorisation des défauts.',
                },
              ].map((m) => {
                const isSelected = modelVariant === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModelVariant(m.id);
                      executeInference(sampleIndex, m.id, customUpload);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all duration-300 ease-out ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-400 text-teal-900 shadow-xs ring-1 ring-teal-300 scale-[1.005]'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{m.label}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Source de l'Image Thermique : Échantillons Test vs Import */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mb-3">
              <button
                type="button"
                onClick={() => {
                  setSourceMode('sample');
                  setCustomUpload(null);
                  executeInference(sampleIndex, modelVariant, null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  sourceMode === 'sample'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Échantillons du Test (1 500)
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('upload')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  sourceMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Importer une Image
              </button>
            </div>

            {sourceMode === 'sample' ? (
              <div className="space-y-3">
                {/* Presets par type de défaut officiel */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Scénarios et Types de Défauts :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Module Sain', idx: 0, code: 0, color: 'text-emerald-700', desc: 'Normal · Homogène' },
                      { label: 'Cellule Fissurée', idx: 1, code: 2, color: 'text-rose-700', desc: 'Hotspot ponctuel' },
                      { label: 'Diode By-pass', idx: 19, code: 1, color: 'text-amber-700', desc: 'Défaut étendu' },
                      { label: 'Salissure / Poussière', idx: 13, code: 3, color: 'text-amber-700', desc: 'Gradient diffus' },
                    ].map((preset) => {
                      const isSelected = sampleIndex === preset.idx && !customUpload;
                      return (
                        <button
                          key={preset.idx}
                          type="button"
                          onClick={() => {
                            setSampleIndex(preset.idx);
                            setCustomUpload(null);
                            executeInference(preset.idx, modelVariant, null);
                          }}
                          className={`p-2 rounded-lg border text-left text-xs transition-all duration-300 ease-out ${
                            isSelected
                              ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold ring-1 ring-teal-300 scale-[1.01]'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className={`font-semibold ${preset.color}`}>{preset.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">{preset.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sélecteur d'index & Slider */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Index de test (0 à 1 499) :</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={samplesMeta ? samplesMeta.total - 1 : 1499}
                        value={sampleIndex}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(Number(e.target.value), 1499));
                          setSampleIndex(val);
                        }}
                        className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded transition-colors"
                      />
                      <button
                        type="button"
                        onClick={pickRandomSample}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 transition-colors"
                      >
                        Aléatoire
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={samplesMeta ? samplesMeta.total - 1 : 1499}
                    value={sampleIndex}
                    onChange={(e) => setSampleIndex(Number(e.target.value))}
                    onMouseUp={() => executeInference(sampleIndex, modelVariant, null)}
                    onTouchEnd={() => executeInference(sampleIndex, modelVariant, null)}
                    className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>Index 0</span>
                    <span>Index 1499</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 transition-colors duration-200">
                  <span className="text-xs font-semibold text-slate-700">
                    Glissez une image thermique ou cliquez pour parcourir
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">PNG ou JPEG (Max 5 Mo)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {customUpload && (
                  <div className="flex items-center justify-between p-2 bg-teal-50 border border-teal-200 rounded-lg text-xs animate-fade-in">
                    <span className="text-teal-800 font-medium">Image personnalisée chargée</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomUpload(null);
                        setSourceMode('sample');
                        executeInference(sampleIndex, modelVariant, null);
                      }}
                      className="text-teal-700 underline text-xs"
                    >
                      Effacer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bouton d'action */}
          <button
            type="button"
            onClick={() => executeInference(sampleIndex, modelVariant, customUpload)}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Inférence Auto-Encodeur en cours...</span>
              </span>
            ) : (
              <span>Analyser l'Image Thermique ({modelVariant.replace('_', ' ').toUpperCase()})</span>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs animate-fade-in">
              {error}
            </div>
          )}

          {/* Explication succincte du principe */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700 block mb-0.5">Principe de Détection (Jalon 2) :</span>
            L'auto-encodeur convolutif est entraîné exclusivement sur les modules sains. Le goulot d'étranglement (16 neurones) empêche la réplication des anomalies. Tout point chaud ou cellule fissurée génère une forte erreur résiduelle $|X - \hat{X}|$.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLONNE DROITE: VISUALISATION THERMIQUE & DÉTECTION (7 cols) - STICKY     */}
      {/* ========================================================================= */}
      <div className="xl:col-span-7 flex flex-col gap-4 xl:sticky xl:top-[60px] self-start z-10">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4 min-h-[460px]">
          {/* Header Visualisation avec Statut */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Visualisation Thermographique & Reconstruction
              </h3>
              <p className="text-[11px] text-slate-500">
                Comparaison Image Infrarouge vs Reconstruite vs Carte d'Erreur
              </p>
            </div>

            {result && (
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border transition-all duration-500 ${
                  isAnomaly
                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAnomaly ? 'bg-rose-600' : 'bg-emerald-600'}`}></span>
                <span>{isAnomaly ? '🚨 Anomalie Détectée' : '✅ Module Sain'}</span>
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4">
              {/* 4 KPI Bento Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                  className={`p-2.5 rounded-lg border text-center transition-all duration-500 ${
                    isAnomaly ? 'bg-rose-50/70 border-rose-200' : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <span className="text-[10px] text-slate-600 block font-medium">Score Erreur Max</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      isAnomaly ? 'text-rose-800' : 'text-emerald-800'
                    }`}
                  >
                    {fmt(animScoreMax, 4)}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                    Seuil: {fmt(seuilMax, 4)}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center transition-all duration-500">
                  <span className="text-[10px] text-slate-600 block font-medium">Erreur Moyenne</span>
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {fmt(animScoreMean, 4)}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                    Seuil: {fmt(result.metrics?.seuil_mean_5fa, 4)}
                  </span>
                </div>

                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/70 text-center transition-all duration-500">
                  <span className="text-[10px] text-amber-700 block font-medium">Température Max</span>
                  <span className="font-mono text-sm font-bold text-amber-900">
                    {fmt(animMaxTemp, 1)} °C
                  </span>
                  <span className="text-[9px] text-amber-600 block mt-0.5 font-mono">
                    Moy: {fmt(animMeanTemp, 1)} °C
                  </span>
                </div>

                <div className="bg-teal-50/60 p-2.5 rounded-lg border border-teal-200/70 text-center transition-all duration-500">
                  <span className="text-[10px] text-teal-700 block font-medium">Confiance Alarme</span>
                  <span className="font-mono text-sm font-bold text-teal-900">
                    {fmt(animConfidence, 1)} %
                  </span>
                  <span className="text-[9px] text-teal-600 block mt-0.5">
                    {result.metrics?.severity || 'Normale'}
                  </span>
                </div>
              </div>

              {/* Triptyque Thermographique Bento : Original vs Reconstruit vs Erreur */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Image Originale */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between w-full px-1">
                    <span>1. Infrarouge (X)</span>
                    <span className="text-[9px] font-mono text-slate-400">Drone</span>
                  </span>
                  <div className="w-full aspect-[40/24] rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-black">
                    <img
                      src={result.images?.original}
                      alt="Image thermique originale"
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    Max: {fmt(result.temperatures_celsius?.original_max, 1)} °C
                  </span>
                </div>

                {/* 2. Image Reconstruite */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between w-full px-1">
                    <span>2. Reconstruit (X̂)</span>
                    <span className="text-[9px] font-mono text-teal-700">Auto-Encodeur</span>
                  </span>
                  <div className="w-full aspect-[40/24] rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-black">
                    <img
                      src={result.images?.reconstructed}
                      alt="Image thermique reconstruite"
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    Goulot: {result.model_name === 'goulot_16' ? '16 var.' : result.model_name === 'goulot_32' ? '32 var.' : 'Sans goulot'}
                  </span>
                </div>

                {/* 3. Carte d'Erreur Résiduelle */}
                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center transition-colors duration-500 ${
                    isAnomaly ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between w-full px-1">
                    <span>3. Erreur |X - X̂|</span>
                    <span className={`text-[9px] font-mono font-bold ${isAnomaly ? 'text-rose-700' : 'text-slate-500'}`}>
                      {isAnomaly ? 'Défaut localisé' : 'Résidu minime'}
                    </span>
                  </span>
                  <div className="w-full aspect-[40/24] rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-black">
                    <img
                      src={result.images?.error_heatmap}
                      alt="Carte d'erreur de reconstruction"
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    Err Max: {fmt(result.metrics?.score_max, 3)}
                  </span>
                </div>
              </div>

              {/* Jauge Comparative : Score vs Seuil 5% Fausse Alerte */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-sans font-semibold text-slate-700">
                    Seuil de Détection (Sensibilité 5% Fausses Alertes) :
                  </span>
                  <span className={`font-bold ${isAnomaly ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {fmt(animScoreMax, 4)} / {fmt(seuilMax, 4)}
                  </span>
                </div>

                {/* Barre avec marqueur de seuil */}
                <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  {/* Valeur actuelle */}
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(5, (animScoreMax / (seuilMax * 2.5)) * 100))}%`,
                    }}
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isAnomaly ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  {/* Ligne repère seuil (à 40% de la largeur) */}
                  <div
                    style={{ left: '40%' }}
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
                    title={`Seuil d'alerte : ${fmt(seuilMax, 4)}`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.0 (Sain)</span>
                  <span className="font-bold text-slate-700">▲ Seuil alerte ({fmt(seuilMax, 3)})</span>
                  <span>{fmt(seuilMax * 2.5, 2)} (Critique)</span>
                </div>
              </div>

              {/* Diagnostic Opérationnel & Vérité Terrain */}
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all duration-300 ${
                  isAnomaly
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>Diagnostic Opérationnel Panneau :</span>
                  {result.ground_truth?.label && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                      Vérité : {result.ground_truth.label}
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed">{result.diagnostic}</p>
                {result.temperatures_celsius?.max_delta_temp != null && (
                  <div className="text-[10px] font-mono pt-1 border-t border-slate-200/50 flex justify-between text-slate-600">
                    <span>Écart max thermique : ΔT = +{fmt(animDeltaTemp, 1)} °C</span>
                    <span>Modèle : {result.model_name === 'goulot_16' ? 'Auto-Encodeur Goulot 16' : result.model_name}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3 animate-pulse">
                AE
              </div>
              <p className="text-xs font-medium text-slate-700">Aucune analyse active</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                Sélectionnez un échantillon ci-contre pour exécuter l'auto-encodeur.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
