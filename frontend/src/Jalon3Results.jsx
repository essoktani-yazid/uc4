import React, { useState, useEffect, useRef } from 'react';

// Cubic easing for silky smooth transitions
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Hook pour animer un tableau de valeurs numériques avec morphing fluide (650ms)
function useAnimatedArray(targetArray, duration = 650) {
  const [current, setCurrent] = useState(targetArray || []);
  const startRef = useRef(targetArray || []);
  const targetRef = useRef(targetArray || []);
  const startTimeRef = useRef(0);
  const targetKey = JSON.stringify(targetArray);

  useEffect(() => {
    if (!targetArray || targetArray.length === 0) return;

    const start =
      startRef.current && startRef.current.length === targetArray.length
        ? [...startRef.current]
        : new Array(targetArray.length).fill(0);
    const target = [...targetArray];
    targetRef.current = target;
    startTimeRef.current = performance.now();

    let frameId;
    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      const ease = easeOutCubic(progress);

      const next = start.map((sVal, i) => {
        const tVal = target[i] ?? 0;
        return Number((sVal + (tVal - sVal) * ease).toFixed(2));
      });

      setCurrent(next);
      startRef.current = next;

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [targetKey, duration]);

  return current;
}

// Hook pour animer un nombre unique de manière continue (jauges, pourcentages)
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

// Formatters
const fmt = (val, digits = 2) => {
  if (val == null || isNaN(val)) return '—';
  return Number(val).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const pct = (val, digits = 1) => {
  if (val == null || isNaN(val)) return '—';
  return `${fmt(Number(val) * 100, digits)} %`;
};

// Strategic name mappings
const STRATEGY_DETAILS = {
  ajustement_complet: {
    label: 'Ajustement Complet (Fine-Tuning)',
    badge: 'Stratégie Retenue',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Ré-entraînement de toutes les couches du MLP sur les données du Site B. Meilleur gain moyen (+26,6 %) grâce à l’adaptation globale des représentations.',
  },
  une_couche_gelee: {
    label: 'Première Couche Gelée',
    badge: 'Transfert Partiel',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'La première couche de projection apprise sur le Site A est figée. 2 278 paramètres entraînés, gain moyen de +25,1 %.',
  },
  deux_couches_gelees: {
    label: 'Deux Couches Gelées',
    badge: 'Transfert Léger',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    desc: 'Seule la tête finale est entraînée (198 paramètres). Très rapide, préserve les représentations profondes du Site A (+24,1 %).',
  },
  A_direct: {
    label: 'A Direct (Zero-Shot)',
    badge: 'Baseline Transfert',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Modèle entraîné à Ouarzazate (Site A) appliqué sans ré-entraînement à Tarfaya (Site B). Gain de +23,4 % mais sous-estime les brumes marines.',
  },
  B_seul: {
    label: 'B Seul (From Scratch)',
    badge: 'Sans Transfert',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Entraîné uniquement sur le volume réduit du Site B. Sous-performe fortement à horizon court h+1 (-14,6 %) en raison du manque d’historique.',
  },
};

export default function Jalon3Results() {
  // Navigation: 'prod' (Test Production B) | 'vision' (Test Vision Ciel) | 'benchmark' (Synthèse Stratégies)
  const [activeSubTab, setActiveSubTab] = useState('prod');

  // Metadata & Notebook summary
  const [resultsData, setResultsData] = useState(null);
  const [sampleCounts, setSampleCounts] = useState(null);
  const [globalError, setGlobalError] = useState('');

  // 1. Production Test State (Site B, 20 MW)
  const [prodIndex, setProdIndex] = useState(250);
  const [prodResult, setProdResult] = useState(null);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState('');

  // 2. Sky Vision Test State (CNN Multi-tâches)
  const [skySite, setSkySite] = useState('B');
  const [skyIndex, setSkyIndex] = useState(50);
  const [skyMode, setSkyMode] = useState('sample'); // 'sample' | 'upload'
  const [skyUpload, setSkyUpload] = useState(null);
  const [skyResult, setSkyResult] = useState(null);
  const [skyLoading, setSkyLoading] = useState(false);
  const [skyError, setSkyError] = useState('');

  // 3. Benchmark selected strategy
  const [selectedStrategy, setSelectedStrategy] = useState('ajustement_complet');

  const capNominaleB = 20.0; // 20 MW sur Site B

  // === ANIMATIONS FLUIDES POUR LA PRODUCTION ===
  const animFineTuned = useAnimatedArray(prodResult?.fineTunedMW, 650);
  const animZeroShot = useAnimatedArray(prodResult?.zeroShotMW, 650);
  const animActual = useAnimatedArray(prodResult?.actualMW, 650);
  const animReference = useAnimatedArray(prodResult?.referenceMW, 650);

  // Animated KPI numbers
  const meanFT = prodResult?.fineTunedMW ? prodResult.fineTunedMW.reduce((a, b) => a + b, 0) / 6 : 0;
  const meanZS = prodResult?.zeroShotMW ? prodResult.zeroShotMW.reduce((a, b) => a + b, 0) / 6 : 0;
  const meanAct = prodResult?.actualMW ? prodResult.actualMW.reduce((a, b) => a + b, 0) / 6 : 0;

  const animMeanFT = useAnimatedNumber(meanFT, 650, 2);
  const animMeanZS = useAnimatedNumber(meanZS, 650, 2);
  const animMeanAct = useAnimatedNumber(meanAct, 650, 2);
  const animMaeFT = useAnimatedNumber(prodResult?.maeFineTunedMW, 650, 2);
  const animMaeZS = useAnimatedNumber(prodResult?.maeZeroShotMW, 650, 2);

  const transferGain =
    prodResult?.maeZeroShotMW && prodResult?.maeFineTunedMW
      ? ((prodResult.maeZeroShotMW - prodResult.maeFineTunedMW) / (prodResult.maeZeroShotMW || 1)) * 100
      : 26.6;
  const animGain = useAnimatedNumber(transferGain, 650, 1);

  // === ANIMATIONS FLUIDES POUR LA VISION CIEL ===
  const animOccultation = useAnimatedNumber(skyResult?.prediction?.occultation, 650, 4);
  const animCoverage = useAnimatedNumber(skyResult?.prediction?.coverage, 650, 4);
  const animErrOcc = useAnimatedNumber(skyResult?.absoluteError?.occultation, 650, 4);
  const animErrCov = useAnimatedNumber(skyResult?.absoluteError?.coverage, 650, 4);

  // Load sample counts & results data on mount
  useEffect(() => {
    let isMounted = true;

    // Fetch sample counts
    fetch('/api/jalon3/samples')
      .then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error('Réponse serveur non-JSON');
        }
      })
      .then((data) => {
        if (isMounted) setSampleCounts(data);
      })
      .catch((err) => {
        if (isMounted) console.warn('Erreur chargement sample counts:', err);
      });

    // Fetch benchmark results
    fetch('/api/jalon3/results')
      .then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error('Réponse serveur non-JSON');
        }
      })
      .then((data) => {
        if (isMounted) {
          setResultsData(data);
          setGlobalError('');
        }
      })
      .catch((err) => {
        if (isMounted) setGlobalError(err.message);
      });

    // Initial production inference (sample 250 = sunny midday peak)
    executeProductionTest(250);

    // Initial sky inference (sample 50 = clear sky B)
    executeSkyTest(50, 'B', null);

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounce pour inférence temps réel ultra-fluide
  const prodDebounce = useRef(null);
  const runRealtimeProd = (idx) => {
    if (prodDebounce.current) clearTimeout(prodDebounce.current);
    prodDebounce.current = setTimeout(() => {
      executeProductionTest(idx);
    }, 50);
  };

  const skyDebounce = useRef(null);
  const runRealtimeSky = (idx, site, upload) => {
    if (skyDebounce.current) clearTimeout(skyDebounce.current);
    skyDebounce.current = setTimeout(() => {
      executeSkyTest(idx, site, upload);
    }, 50);
  };

  // Helper to run production inference
  const executeProductionTest = async (idx) => {
    setProdLoading(true);
    setProdError('');
    try {
      const res = await fetch('/api/jalon3/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: Number(idx) }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Réponse invalide du serveur (le backend doit être relancé).');
      }
      if (!res.ok) throw new Error(data.detail || 'Erreur lors du calcul de la prévision.');
      setProdResult(data);
    } catch (err) {
      setProdError(err.message);
    } finally {
      setProdLoading(false);
    }
  };

  // Helper to run sky inference
  const executeSkyTest = async (idx, site, uploadBase64) => {
    setSkyLoading(true);
    setSkyError('');
    try {
      const payload = uploadBase64
        ? { index: 0, site, image_base64: uploadBase64 }
        : { index: Number(idx), site };
      const res = await fetch('/api/jalon3/sky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Réponse invalide du serveur.');
      }
      if (!res.ok) throw new Error(data.detail || 'Erreur lors de l’analyse d’image.');
      setSkyResult(data);
    } catch (err) {
      setSkyError(err.message);
    } finally {
      setSkyLoading(false);
    }
  };

  // Handle image upload
  const handleFileUpload = (e) => {
    setSkyError('');
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      setSkyError('Image trop volumineuse : maximum 5 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSkyUpload(reader.result);
      executeSkyTest(0, skySite, reader.result);
    };
    reader.onerror = () => setSkyError('Échec de lecture du fichier.');
    reader.readAsDataURL(file);
  };

  // Random sample pickers
  const pickRandomProdSample = () => {
    const max = sampleCounts?.production || 2178;
    const randomIdx = Math.floor(Math.random() * max);
    setProdIndex(randomIdx);
    executeProductionTest(randomIdx);
  };

  const pickRandomSkySample = () => {
    const max = (sampleCounts?.sky && sampleCounts.sky[skySite]) || 1000;
    const randomIdx = Math.floor(Math.random() * max);
    setSkyIndex(randomIdx);
    setSkyUpload(null);
    executeSkyTest(randomIdx, skySite, null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Sub-Tab Navigation Bar with Smooth Pills */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            {
              id: 'prod',
              label: '1. Test Production (Transfert Site B)',
              badge: '20 MW · MLP',
            },
            {
              id: 'vision',
              label: '2. Test Vision Multi-Tâches',
              badge: 'CNN Partagé',
            },
            {
              id: 'benchmark',
              label: '3. Stratégies de Transfert',
              badge: 'Validation B',
            },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ease-out ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm font-semibold scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors duration-300 ${
                    isActive
                      ? 'bg-teal-700/80 text-teal-100'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Global info pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Site B : Tarfaya (Façade Atlantique)</span>
        </div>
      </div>

      {globalError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{globalError}</span>
          <button
            onClick={() => window.location.reload()}
            className="underline font-semibold hover:text-rose-900"
          >
            Actualiser
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOUS-ONGLET 1: TEST DE PRODUCTION (TRANSFERT DE SITE B)                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'prod' && (
        <div key="tab-prod" className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-fade-in transition-all duration-300">
          {/* Colonne Gauche : Contrôles & Échantillons (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Banc d'Essai Production — Site B
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Évaluation locale : Modèle A direct (Zero-Shot) vs Ajustement B (Fine-Tuning)
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {prodLoading ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      <span className="w-2 h-2 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>Calcul...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Temps Réel</span>
                    </span>
                  )}
                  <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                    20 MW
                  </span>
                </div>
              </div>

              {/* Presets rapides de situations solaires */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Scénarios d'Essai Représentatifs :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Plein Soleil Midi', idx: 250, desc: '19.4 MW · Ciel dégagé' },
                    { label: 'Nuages & Brume', idx: 12, desc: 'Variabilité atlantique' },
                    { label: 'Montée Matinale', idx: 920, desc: 'Début de production' },
                    { label: 'Pic Juin (Max)', idx: 1521, desc: 'Production estivale max' },
                  ].map((preset) => {
                    const isSelected = prodIndex === preset.idx;
                    return (
                      <button
                        key={preset.idx}
                        type="button"
                        onClick={() => {
                          setProdIndex(preset.idx);
                          executeProductionTest(preset.idx);
                        }}
                        className={`text-left p-2.5 rounded-lg border text-xs transition-all duration-300 ease-out ${
                          isSelected
                            ? 'bg-teal-50 border-teal-400 text-teal-900 shadow-xs ring-1 ring-teal-300 scale-[1.01]'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold">{preset.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{preset.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sélection précise par Index & Slider */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    Index de test (avril–juin 2025) :
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={sampleCounts ? sampleCounts.production - 1 : 2178}
                      value={prodIndex}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(
                            Number(e.target.value),
                            sampleCounts ? sampleCounts.production - 1 : 2178
                          )
                        );
                        setProdIndex(val);
                        runRealtimeProd(val);
                      }}
                      className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={pickRandomProdSample}
                      title="Tirer un échantillon au hasard"
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 font-medium text-slate-600 transition-colors"
                    >
                      Aléatoire
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={sampleCounts ? sampleCounts.production - 1 : 2178}
                  value={prodIndex}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProdIndex(val);
                    runRealtimeProd(val);
                  }}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none transition-all"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 (Avril 2025)</span>
                  <span>{sampleCounts ? sampleCounts.production - 1 : 2178} (Juin 2025)</span>
                </div>
              </div>

              {prodError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs animate-fade-in">
                  {prodError}
                </div>
              )}

              {/* Contexte temporel & Historique 24h */}
              {prodResult && (
                <div className="pt-3 border-t border-slate-100 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Horodatage de départ :</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {prodResult.timestamps?.[0] || '—'}
                    </span>
                  </div>

                  {/* Sparkline historique 24h passées avec transitions fluides */}
                  {prodResult.historyMW && prodResult.historyMW.length > 0 && (
                    <div>
                      <span className="text-[11px] font-medium text-slate-600 block mb-1">
                        Historique des 24h Précédentes (Production MW) :
                      </span>
                      <div className="h-10 bg-slate-50 border border-slate-200 rounded p-1 flex items-end gap-0.5">
                        {prodResult.historyMW.map((mw, i) => {
                          const heightPct = Math.min(100, Math.max(4, (mw / capNominaleB) * 100));
                          return (
                            <div
                              key={i}
                              title={`t-${24 - i}h : ${fmt(mw, 1)} MW`}
                              style={{ height: `${heightPct}%` }}
                              className="flex-1 bg-slate-400 hover:bg-teal-500 rounded-t-xs transition-all duration-500 ease-out"
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                        <span>t-24h</span>
                        <span>t-12h</span>
                        <span>t-0h</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Colonne Droite : Visualisation Sticky & Résultats (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-4 xl:sticky xl:top-[60px] self-start z-10">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4 min-h-[460px]">
              {/* Header Graphique */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Courbe Prévisionnelle de Production (Site B)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Comparaison dynamique sur l'horizon t+1h à t+6h
                  </p>
                </div>
                {prodResult && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 transition-all duration-500">
                    MAE B: {fmt(animMaeFT, 2)} MW
                  </span>
                )}
              </div>

              {prodResult ? (
                <>
                  {/* KPI Bento Cards avec Chiffres Animés */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-teal-50/60 p-2.5 rounded-lg border border-teal-200/70 text-center transition-all duration-500">
                      <span className="text-[10px] text-teal-700 block font-medium">Ajusté B (Retenu)</span>
                      <span className="font-mono text-sm font-bold text-teal-900">
                        {fmt(animMeanFT, 2)} MW
                      </span>
                      <span className="text-[9px] text-teal-600 block mt-0.5 font-mono">
                        MAE: {fmt(animMaeFT, 2)} MW
                      </span>
                    </div>

                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/70 text-center transition-all duration-500">
                      <span className="text-[10px] text-amber-700 block font-medium">A Direct (Zero-Shot)</span>
                      <span className="font-mono text-sm font-bold text-amber-900">
                        {fmt(animMeanZS, 2)} MW
                      </span>
                      <span className="text-[9px] text-amber-600 block mt-0.5 font-mono">
                        MAE: {fmt(animMaeZS, 2)} MW
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center transition-all duration-500">
                      <span className="text-[10px] text-slate-600 block font-medium">Production Réelle</span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {fmt(animMeanAct, 2)} MW
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Vérité terrain</span>
                    </div>

                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/70 text-center transition-all duration-500">
                      <span className="text-[10px] text-emerald-700 block font-medium">Gain Transfert</span>
                      <span className="font-mono text-sm font-bold text-emerald-800">
                        +{fmt(animGain, 1)} %
                      </span>
                      <span className="text-[9px] text-emerald-600 block mt-0.5">vs Zero-Shot</span>
                    </div>
                  </div>

                  {/* SVG Chart Comparison avec Courbes Morphing Fluides */}
                  <div className="w-full h-56 relative bg-slate-50/60 rounded-xl p-2 border border-slate-200/80">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 170">
                      {/* Grid Lines */}
                      {[15, 45, 75, 105, 135].map((y) => (
                        <line
                          key={y}
                          x1="35"
                          y1={y}
                          x2="485"
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                        />
                      ))}

                      {/* Y-axis labels */}
                      <text x="30" y="19" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                        20 MW
                      </text>
                      <text x="30" y="79" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                        10 MW
                      </text>
                      <text x="30" y="139" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                        0 MW
                      </text>

                      {/* Reference Persistence Curve (Dashed Slate) Animée */}
                      {animReference.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          points={animReference
                            .map((val, idx) => `${55 + idx * 80},${135 - (val / capNominaleB) * 120}`)
                            .join(' ')}
                        />
                      )}

                      {/* Zero-Shot Curve (Amber) Animée */}
                      {animZeroShot.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          points={animZeroShot
                            .map((val, idx) => `${55 + idx * 80},${135 - (val / capNominaleB) * 120}`)
                            .join(' ')}
                        />
                      )}

                      {/* Actual Ground Truth (Dark Line) Animée */}
                      {animActual.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#1e293b"
                          strokeWidth="2"
                          strokeLinecap="round"
                          points={animActual
                            .map((val, idx) => `${55 + idx * 80},${135 - (val / capNominaleB) * 120}`)
                            .join(' ')}
                        />
                      )}

                      {/* Fine-Tuned Model Curve (Solid Teal) Animée */}
                      {animFineTuned.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#0d9488"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={animFineTuned
                            .map((val, idx) => `${55 + idx * 80},${135 - (val / capNominaleB) * 120}`)
                            .join(' ')}
                        />
                      )}

                      {/* Data dots on Fine-Tuned Curve avec position fluide */}
                      {animFineTuned.map((val, idx) => {
                        const cx = 55 + idx * 80;
                        const cy = 135 - (val / capNominaleB) * 120;
                        return (
                          <g key={`dot-ft-${idx}`}>
                            <circle cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#0d9488" strokeWidth="2.5" />
                          </g>
                        );
                      })}

                      {/* Data dots on Actual Curve */}
                      {animActual.map((val, idx) => {
                        const cx = 55 + idx * 80;
                        const cy = 135 - (val / capNominaleB) * 120;
                        return (
                          <circle key={`dot-act-${idx}`} cx={cx} cy={cy} r="2.5" fill="#1e293b" />
                        );
                      })}

                      {/* X-axis labels (Horizons t+1h à t+6h) */}
                      {[1, 2, 3, 4, 5, 6].map((h, idx) => (
                        <text
                          key={h}
                          x={55 + idx * 80}
                          y="155"
                          fontSize="9"
                          fill="#64748b"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          t+{h}h
                        </text>
                      ))}
                    </svg>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono pt-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-3 h-1 bg-slate-900 rounded"></span>
                      <span>Réel (Vérité)</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-700 font-semibold">
                      <span className="w-3 h-1 bg-teal-600 rounded"></span>
                      <span>Ajusté B (Retenu)</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-3 h-1 bg-amber-500 rounded"></span>
                      <span>A Direct (Zero-Shot)</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-3 h-0.5 border-t border-dashed border-slate-400"></span>
                      <span>Persistance</span>
                    </span>
                  </div>

                  {/* Table détaillée des 6 Horizons avec Valeurs Fluides */}
                  <div className="overflow-x-auto pt-2 border-t border-slate-100">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 px-1">Horizon</th>
                          <th className="py-2 px-1">Heure</th>
                          <th className="py-2 px-1 text-slate-900">Réel MW</th>
                          <th className="py-2 px-1 text-teal-700 font-semibold">Ajusté B MW</th>
                          <th className="py-2 px-1 text-amber-700">A direct MW</th>
                          <th className="py-2 px-1 text-slate-400">Réf. MW</th>
                          <th className="py-2 px-1 text-emerald-700">Écart B</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                          const act = animActual[idx] ?? prodResult.actualMW?.[idx];
                          const ft = animFineTuned[idx] ?? prodResult.fineTunedMW?.[idx];
                          const zs = animZeroShot[idx] ?? prodResult.zeroShotMW?.[idx];
                          const ref = animReference[idx] ?? prodResult.referenceMW?.[idx];
                          const delta = act != null && ft != null ? Math.abs(act - ft) : null;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-1.5 px-1 font-semibold text-slate-700">t+{idx + 1}h</td>
                              <td className="py-1.5 px-1 text-slate-500">
                                {prodResult.timestamps?.[idx]?.split(' ')[1]?.slice(0, 5) || `+${idx + 1}h`}
                              </td>
                              <td className="py-1.5 px-1 font-bold text-slate-800">{fmt(act, 2)}</td>
                              <td className="py-1.5 px-1 text-teal-700 font-bold">{fmt(ft, 2)}</td>
                              <td className="py-1.5 px-1 text-amber-700">{fmt(zs, 2)}</td>
                              <td className="py-1.5 px-1 text-slate-400">{fmt(ref, 2)}</td>
                              <td className="py-1.5 px-1 text-emerald-600 font-semibold">
                                {delta != null ? `${fmt(delta, 2)}` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3 animate-pulse">
                    B
                  </div>
                  <p className="text-xs font-medium text-slate-700">Aucun calcul actif</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Sélectionnez un échantillon ou un scénario ci-contre pour exécuter le test.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOUS-ONGLET 2: TEST VISION MULTI-TÂCHES (CNN CIEL & OCCULTATION)         */}
      {/* ========================================================================= */}
      {activeSubTab === 'vision' && (
        <div key="tab-vision" className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-fade-in transition-all duration-300">
          {/* Colonne Gauche : Paramètres & Sélection d'Image (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Banc d'Essai Vision Multi-Tâches
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estimation conjointe : Occultation du soleil et Couverture nuageuse
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {skyLoading ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      <span className="w-2 h-2 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>Calcul...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Temps Réel</span>
                    </span>
                  )}
                  <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                    CNN Partagé
                  </span>
                </div>
              </div>

              {/* Sélecteur de Site */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Modèle et Site d'Observation :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSkySite('B');
                      executeSkyTest(skyIndex, 'B', skyUpload);
                    }}
                    className={`p-2.5 rounded-lg border text-xs text-left transition-all duration-300 ease-out ${
                      skySite === 'B'
                        ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold ring-1 ring-teal-300 scale-[1.01]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div>Site B — Tarfaya</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Modèle adapté (λ=0,3)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSkySite('A');
                      executeSkyTest(skyIndex, 'A', skyUpload);
                    }}
                    className={`p-2.5 rounded-lg border text-xs text-left transition-all duration-300 ease-out ${
                      skySite === 'A'
                        ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold ring-1 ring-teal-300 scale-[1.01]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div>Site A — Ouarzazate</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Modèle source (λ=0)
                    </div>
                  </button>
                </div>
              </div>

              {/* Source de l'image : Exemples réels vs Upload */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSkyMode('sample');
                      setSkyUpload(null);
                      executeSkyTest(skyIndex, skySite, null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      skyMode === 'sample'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Échantillons du Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkyMode('upload')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      skyMode === 'upload'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Importer une Image
                  </button>
                </div>

                {skyMode === 'sample' ? (
                  <div className="space-y-3">
                    {/* Presets rapides de ciel */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Ciel Dégagé (0%)', idx: 50, desc: 'Sans nuage' },
                        { label: 'Voile Léger (9%)', idx: 300, desc: 'Cirrus partiels' },
                        { label: 'Nuages Épars (34%)', idx: 150, desc: 'Occultation 10%' },
                        { label: 'Couvert (71%)', idx: 500, desc: 'Soleil occulté' },
                      ].map((preset) => {
                        const isSelected = skyIndex === preset.idx && !skyUpload;
                        return (
                          <button
                            key={preset.idx}
                            type="button"
                            onClick={() => {
                              setSkyIndex(preset.idx);
                              setSkyUpload(null);
                              executeSkyTest(preset.idx, skySite, null);
                            }}
                            className={`p-2 rounded-lg border text-left text-xs transition-all duration-300 ease-out ${
                              isSelected
                                ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold ring-1 ring-teal-300 scale-[1.01]'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div>{preset.label}</div>
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5">{preset.desc}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Curseur d'index */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600 font-medium">Index de test ({skySite}) :</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={sampleCounts?.sky?.[skySite] ? sampleCounts.sky[skySite] - 1 : 1000}
                            value={skyIndex}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSkyIndex(val);
                              runRealtimeSky(val, skySite, null);
                            }}
                            className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded transition-colors"
                          />
                          <button
                            type="button"
                            onClick={pickRandomSkySample}
                            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 transition-colors"
                          >
                            Aléatoire
                          </button>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={sampleCounts?.sky?.[skySite] ? sampleCounts.sky[skySite] - 1 : 1000}
                        value={skyIndex}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSkyIndex(val);
                          runRealtimeSky(val, skySite, null);
                        }}
                        className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 transition-colors duration-200">
                      <span className="text-xs font-semibold text-slate-700">
                        Glissez une image ou cliquez pour parcourir
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">PNG ou JPEG (Max 5 Mo)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {skyUpload && (
                      <div className="flex items-center justify-between p-2 bg-teal-50 border border-teal-200 rounded-lg text-xs animate-fade-in">
                        <span className="text-teal-800 font-medium">Image personnalisée prête</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSkyUpload(null);
                            setSkyMode('sample');
                            executeSkyTest(skyIndex, skySite, null);
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

              {skyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs animate-fade-in">
                  {skyError}
                </div>
              )}
            </div>
          </div>

          {/* Colonne Droite : Visualisation Sticky & Diagnostic (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-4 xl:sticky xl:top-[60px] self-start z-10">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4 min-h-[460px]">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Résultats de l'Inférence CNN Multi-Tâches
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Image vue par le réseau de neurones et jauges d'impact
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Site {skySite}
                </span>
              </div>

              {skyResult ? (
                <div className="space-y-4">
                  {/* Visualisation Bento : Image à gauche + Jauges à droite */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Image prétraitée avec transition fluide */}
                    <div className="sm:col-span-5 flex flex-col items-center">
                      <div className="relative w-44 h-44 rounded-xl border-2 border-slate-200 overflow-hidden shadow-xs bg-black flex items-center justify-center transition-all duration-500">
                        {skyResult.image ? (
                          <img
                            src={skyResult.image}
                            alt="Image ciel analysée"
                            className="w-full h-full object-cover transition-opacity duration-500"
                          />
                        ) : (
                          <span className="text-slate-400 text-xs">Aperçu image</span>
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          Luma CNN
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 font-mono">
                        Échantillon #{skyIndex} ({skySite})
                      </span>
                    </div>

                    {/* Jauges Métriques Animées */}
                    <div className="sm:col-span-7 space-y-3">
                      {/* 1. Occultation du Disque Solaire */}
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/90 space-y-1.5 transition-all duration-500">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            Occultation du Disque Solaire
                          </span>
                          <span className="font-mono font-bold text-amber-700 text-sm">
                            {pct(animOccultation)}
                          </span>
                        </div>

                        {/* Barre de progression fluide */}
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, animOccultation * 100))}%`,
                            }}
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              animOccultation > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>
                            Vérité :{' '}
                            {skyResult.truth?.occultation != null
                              ? pct(skyResult.truth.occultation)
                              : 'Non supervisée'}
                          </span>
                          <span>
                            Erreur :{' '}
                            {skyResult.absoluteError?.occultation != null
                              ? pct(animErrOcc)
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* 2. Couverture Nuageuse Globale */}
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/90 space-y-1.5 transition-all duration-500">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            Couverture Nuageuse Globale
                          </span>
                          <span className="font-mono font-bold text-teal-700 text-sm">
                            {skyResult.prediction?.coverage != null
                              ? pct(animCoverage)
                              : 'Non supervisée (λ=0)'}
                          </span>
                        </div>

                        {/* Barre de progression fluide */}
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, animCoverage * 100))}%`,
                            }}
                            className="h-full bg-teal-600 rounded-full transition-all duration-700 ease-out"
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>
                            Vérité :{' '}
                            {skyResult.truth?.coverage != null
                              ? pct(skyResult.truth.coverage)
                              : '—'}
                          </span>
                          <span>
                            Erreur :{' '}
                            {skyResult.absoluteError?.coverage != null
                              ? pct(animErrCov)
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Opérationnel & Impact PV */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 transition-all duration-300">
                    <div className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>Diagnostic Opérationnel Photovoltaïque :</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {skyResult.note || 'Inférence CNN'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {animOccultation > 0.5
                        ? 'Soleil masqué par une masse nuageuse dense : chute sévère de l’irradiance directe (DNI) entraînant une bascule en régime diffus.'
                        : animCoverage > 0.3
                        ? 'Ciel partiellement voilé mais disque solaire dégagé : l’irradiance directe reste exploitable avec atténuation modérée.'
                        : 'Conditions de ciel clair optimales : captation solaire maximale sans perte d’occultation.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3 animate-pulse">
                    CNN
                  </div>
                  <p className="text-xs font-medium text-slate-700">Aucune analyse d'image active</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Choisissez une image ou un exemple de ciel ci-contre pour exécuter l'inférence.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOUS-ONGLET 3: STRATÉGIES DE TRANSFERT & BENCHMARK INTERACTIF             */}
      {/* ========================================================================= */}
      {activeSubTab === 'benchmark' && (
        <div key="tab-bench" className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-fade-in transition-all duration-300">
          {/* Colonne Gauche : Sélecteur Interactif des Stratégies (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Stratégies de Transfert Testées
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validation B (mars 2025) : sélection du modèle retenu
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                  5 Modèles
                </span>
              </div>

              {/* Liste des 5 Stratégies Cliquables */}
              <div className="space-y-2">
                {resultsData?.strategies?.map((strat) => {
                  const key = strat.model;
                  const details = STRATEGY_DETAILS[key] || {
                    label: key,
                    badge: 'Modèle',
                    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
                    desc: '',
                  };
                  const isSelected = selectedStrategy === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedStrategy(key)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-300 ease-out ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-400 shadow-xs ring-1 ring-teal-300 scale-[1.01]'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{details.label}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${details.badgeColor}`}
                        >
                          {details.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{details.desc}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] font-mono">
                        <span className="text-slate-500">Params: {strat.trainableParams}</span>
                        <span className="font-bold text-teal-800">
                          Gain moyen: {pct(strat.gainMean)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Carte des Objectifs Officiels Validés */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-800 block">
                  Bilan des Cibles Officielles (Jalon 3) :
                </span>
                <div className="space-y-1.5">
                  {resultsData?.targets?.map((target, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs font-mono transition-all duration-300"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span className="text-emerald-900 font-sans font-medium text-[11px]">
                          {target['Critère']}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-800">
                          {target['Critère'].includes('Gain')
                            ? pct(target['Résultat'])
                            : fmt(target['Résultat'], 4)}
                        </span>
                        <span className="text-[10px] text-emerald-600 block">
                          Cible {target.Cible}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Graphiques & Métriques Comparatives (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-4 xl:sticky xl:top-[60px] self-start z-10">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Comparatif des Performances par Horizon
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Test B (avril–juin 2025) : RMSE Modèle Retenu vs Persistance
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Gain Global: +33,2 %
                </span>
              </div>

              {/* Bar Chart Fluide : Comparaison des 5 Stratégies de Transfert */}
              <div>
                <span className="text-xs font-semibold text-slate-800 block mb-2">
                  Gain Moyen par Stratégie de Transfert sur la Validation B :
                </span>
                <div className="space-y-2">
                  {resultsData?.strategies?.map((strat) => {
                    const gainVal = Number(strat.gainMean || 0) * 100;
                    const isSelected = selectedStrategy === strat.model;
                    return (
                      <div
                        key={strat.model}
                        onClick={() => setSelectedStrategy(strat.model)}
                        className={`p-2 rounded-lg cursor-pointer transition-all duration-300 ease-out ${
                          isSelected ? 'bg-teal-50/80 border border-teal-200 scale-[1.01]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between text-xs mb-1">
                          <span
                            className={`font-medium transition-colors duration-200 ${
                              isSelected ? 'text-teal-900 font-bold' : 'text-slate-700'
                            }`}
                          >
                            {STRATEGY_DETAILS[strat.model]?.label || strat.model}
                          </span>
                          <span className="font-mono font-bold text-teal-800">
                            +{fmt(gainVal, 1)} %
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${Math.min(100, Math.max(5, gainVal * 3))}%` }}
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              strat.model === 'ajustement_complet'
                                ? 'bg-teal-600'
                                : isSelected
                                ? 'bg-teal-500'
                                : 'bg-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bilan RMSE par Horizon (h+1 à h+6) */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-800 block mb-3">
                  Évolution du RMSE par Horizon (Heures de Jour — Test B) :
                </span>
                <div className="space-y-2.5">
                  {resultsData?.horizons?.map((h) => {
                    const mod = Number(h['RMSE modèle MW']);
                    const ref = Number(h['RMSE référence MW']);
                    const maxVal = Math.max(
                      ...(resultsData.horizons?.map((item) => Number(item['RMSE référence MW'])) || [6])
                    );
                    return (
                      <div key={h.Horizon} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-mono font-bold text-slate-600">t+{h.Horizon}h</span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>Modèle: {fmt(mod, 2)} MW</span>
                            <span className="text-teal-700 font-semibold">
                              Gain: +{fmt(Number(h.Gain) * 100, 1)} %
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${(mod / maxVal) * 100}%` }}
                              className="bg-teal-600 h-full rounded-full transition-all duration-700 ease-out"
                            />
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${(ref / maxVal) * 100}%` }}
                              className="bg-slate-300 h-full rounded-full transition-all duration-700 ease-out"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                  <span>Barre verte : RMSE Modèle B</span>
                  <span>Barre grise : RMSE Persistance Réf.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
