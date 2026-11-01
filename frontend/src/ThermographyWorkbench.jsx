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

  // Seuil interactif ajustable par l'utilisateur pour tester la sensibilité
  const [customThreshold, setCustomThreshold] = useState(0.4881);

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

      // Met à jour le seuil par défaut du modèle choisi
      if (data.metrics?.seuil_max_5fa) {
        setCustomThreshold(data.metrics.seuil_max_5fa);
      }
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

  // Décision basée sur le seuil actif (par défaut ou ajusté au slider)
  const scoreMaxActuel = result?.metrics?.score_max || 0;
  const isAnomaly = scoreMaxActuel >= customThreshold;

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
                Contrôle qualité & détection de défauts (Jalon 2)
              </p>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
              Goulot 16
            </span>
          </div>

          {/* 1. Sélection Rapide de Modèle */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Variante Auto-Encodeur :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'goulot_16', label: 'Goulot 16', sub: 'Retenu (16 lat.)' },
                { id: 'goulot_32', label: 'Goulot 32', sub: '32 latents' },
                { id: 'sans_goulot', label: 'Sans Goulot', sub: 'Baseline' },
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
                    className={`p-2 rounded-lg border text-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold ring-1 ring-teal-300'
                        : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{m.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Source de Test : Échantillons vs Import */}
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
                1 500 Échantillons Réels
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
                Importer Image
              </button>
            </div>

            {sourceMode === 'sample' ? (
              <div className="space-y-3">
                {/* 5 Presets de Cas Réels */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Cas de Test Types (Ensemble de Test) :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Module Sain', idx: 0, tag: 'Sain #0', color: 'text-emerald-700 border-emerald-200 bg-emerald-50/40' },
                      { label: 'Cellule Fissurée', idx: 1, tag: 'Hotspot #1', color: 'text-rose-700 border-rose-200 bg-rose-50/40' },
                      { label: 'Diode By-pass', idx: 19, tag: 'Diode #19', color: 'text-amber-700 border-amber-200 bg-amber-50/40' },
                      { label: 'Salissure / Poussière', idx: 13, tag: 'Salissure #13', color: 'text-amber-700 border-amber-200 bg-amber-50/40' },
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
                          className={`p-2 rounded-lg border text-left transition-all duration-200 ${
                            isSelected
                              ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold ring-1 ring-teal-300'
                              : `${preset.color} hover:bg-slate-100`
                          }`}
                        >
                          <div className="text-xs font-bold">{preset.label}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">{preset.tag}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slider d'Index Précis */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Index de test :</span>
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
                        className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={pickRandomSample}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 font-medium"
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
                    className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>Index 0</span>
                    <span>Index 1499</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 transition">
                  <span className="text-xs font-semibold text-slate-700">
                    Glissez une image thermique ou cliquez
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG / JPEG (Max 5 Mo)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {customUpload && (
                  <div className="flex items-center justify-between p-2 bg-teal-50 border border-teal-200 rounded-lg text-xs">
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

          {/* 3. Sensibilité / Seuil de Détection Réglable */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Seuil de Détection Alarme :</span>
              <span className="font-mono font-bold text-teal-800">
                {fmt(customThreshold, 4)}
              </span>
            </div>
            <input
              type="range"
              min={0.10}
              max={2.00}
              step={0.01}
              value={customThreshold}
              onChange={(e) => setCustomThreshold(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.10 (Sensible)</span>
              <button
                type="button"
                onClick={() => setCustomThreshold(result?.metrics?.seuil_max_5fa || 0.4881)}
                className="underline text-teal-600 hover:text-teal-800"
              >
                Réinitialiser Seuil 5% FA ({fmt(result?.metrics?.seuil_max_5fa || 0.4881, 4)})
              </button>
              <span>2.00 (Tolérant)</span>
            </div>
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
                <span>Calcul Auto-Encodeur en cours...</span>
              </span>
            ) : (
              <span>Exécuter le Test de Détection</span>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLONNE DROITE: VISUALISATION & BANC D'ESSAI 100% TEST (7 cols) - STICKY    */}
      {/* ========================================================================= */}
      <div className="xl:col-span-7 flex flex-col gap-4 xl:sticky xl:top-[60px] self-start z-10">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4 min-h-[460px]">
          {/* Header Visualisation avec Grand Verdict Pass/Fail */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Banc d'Essai Thermographique (Test en Direct)
              </h3>
              <p className="text-[11px] text-slate-500">
                Échantillon #{result?.index ?? sampleIndex} · {modelVariant.replace('_', ' ').toUpperCase()}
              </p>
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all duration-300 ${
                  isAnomaly
                    ? 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isAnomaly ? 'bg-rose-600 animate-ping' : 'bg-emerald-600'}`}></span>
                <span>{isAnomaly ? 'DÉFAUT DÉTECTÉ' : 'MODULE CONFORME'}</span>
              </div>
            )}
          </div>

          {result ? (
            <div className="space-y-4">
              {/* 4 KPI Bento Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                  className={`p-2.5 rounded-lg border text-center transition-all duration-500 ${
                    isAnomaly ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/80 border-emerald-200'
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
                    Seuil: {fmt(customThreshold, 4)}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center transition-all duration-500">
                  <span className="text-[10px] text-slate-600 block font-medium">Erreur Moyenne</span>
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {fmt(animScoreMean, 4)}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                    Réf: {fmt(result.metrics?.seuil_mean_5fa, 4)}
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
                  <span className="text-[10px] text-teal-700 block font-medium">Confiance Alerte</span>
                  <span className="font-mono text-sm font-bold text-teal-900">
                    {fmt(animConfidence, 1)} %
                  </span>
                  <span className="text-[9px] text-teal-600 block mt-0.5 font-mono">
                    ΔT: +{fmt(animDeltaTemp, 1)} °C
                  </span>
                </div>
              </div>

              {/* Triptyque Thermographique Bento */}
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
                    Pic: {fmt(result.temperatures_celsius?.original_max, 1)} °C
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
                    {modelVariant.toUpperCase()}
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
                      {isAnomaly ? 'Défaut localisé' : 'Conforme'}
                    </span>
                  </span>
                  <div className="w-full aspect-[40/24] rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-black">
                    <img
                      src={result.images?.error_heatmap}
                      alt="Carte d'erreur de reconstruction"
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 font-mono">
                    Err: {fmt(result.metrics?.score_max, 3)}
                  </span>
                </div>
              </div>

              {/* Jauge Comparative : Score vs Seuil Actif */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-sans font-semibold text-slate-700">
                    Positionnement par rapport au Seuil :
                  </span>
                  <span className={`font-bold ${isAnomaly ? 'text-rose-700' : 'text-emerald-700'}`}>
                    Score: {fmt(animScoreMax, 4)} (Seuil: {fmt(customThreshold, 4)})
                  </span>
                </div>

                <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(5, (animScoreMax / (customThreshold * 2.5)) * 100))}%`,
                    }}
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isAnomaly ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  <div
                    style={{ left: '40%' }}
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
                    title={`Seuil actif : ${fmt(customThreshold, 4)}`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.0 (Sain)</span>
                  <span className="font-bold text-slate-700">▲ Seuil ({fmt(customThreshold, 3)})</span>
                  <span>{fmt(customThreshold * 2.5, 2)} (Défaut Critique)</span>
                </div>
              </div>

              {/* Tableau de Contrôle Qualité 100% Test */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Test de Contrôle</th>
                      <th className="py-2 px-3">Valeur Mesurée</th>
                      <th className="py-2 px-3">Valeur Seuil</th>
                      <th className="py-2 px-3">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium font-sans text-slate-800">
                        Erreur Maximale (S_max)
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{fmt(scoreMaxActuel, 4)}</td>
                      <td className="py-2 px-3 text-slate-500">{fmt(customThreshold, 4)}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            scoreMaxActuel >= customThreshold
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {scoreMaxActuel >= customThreshold ? 'NON CONFORME' : 'CONFORME'}
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium font-sans text-slate-800">
                        Erreur Moyenne (S_moy)
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {fmt(result.metrics?.score_mean, 4)}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {fmt(result.metrics?.seuil_mean_5fa, 4)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (result.metrics?.score_mean || 0) >= (result.metrics?.seuil_mean_5fa || 0.1)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {(result.metrics?.score_mean || 0) >= (result.metrics?.seuil_mean_5fa || 0.1)
                            ? 'ATTÉNUATION'
                            : 'CONFORME'}
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium font-sans text-slate-800">
                        Vérité Terrain (Corrigé)
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {result.ground_truth?.label || 'Image Utilisateur'}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {result.ground_truth?.is_anomaly ? 'Code ≠ 0' : 'Code = 0'}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {result.ground_truth?.is_anomaly === isAnomaly ? 'ACCORD 100%' : 'DISCORDANCE'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3 animate-pulse">
                AE
              </div>
              <p className="text-xs font-medium text-slate-700">Aucun calcul actif</p>
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
