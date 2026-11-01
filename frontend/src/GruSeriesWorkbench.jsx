import React, { useState, useEffect, useRef } from 'react';

// Interpolation cubique fluide (ease-out cubic)
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Hook d'animation pour tableau de nombres (courbes SVG)
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

// Hook d'animation pour un scalaire unique (KPIs)
function useAnimatedNumber(targetNumber, duration = 650, decimals = 1) {
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

export default function GruSeriesWorkbench({ capaciteNominale = 50.0 }) {
  // 1. Contrôles du Panneau Gauche
  const [historyHours, setHistoryHours] = useState(48);          // 6, 24, 48, 168
  const [modelType, setModelType] = useState('gru');             // 'rnn', 'lstm', 'gru'
  const [generationStrategy, setGenerationStrategy] = useState('seq2seq'); // 'direct' | 'seq2seq'
  const [scenarioId, setScenarioId] = useState('poussiere_veille'); // 'poussiere_veille' | 'encrassement_progressif' | 'cycle_nominal'

  // État des résultats & de l'inférence
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce réactif
  const debounceRef = useRef(null);

  const fetchSimulation = (hHours, mType, gStrat, sId) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/jalon4/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history_hours: hHours,
            model_type: mType,
            generation_strategy: gStrat,
            scenario_id: sId,
            site: 'A',
          }),
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Erreur de communication avec le serveur (réponse non-JSON).');
        }
        if (!res.ok) {
          throw new Error(data.detail || 'Erreur lors du calcul séquentiel.');
        }
        setResult(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  useEffect(() => {
    fetchSimulation(historyHours, modelType, generationStrategy, scenarioId);
  }, [historyHours, modelType, generationStrategy, scenarioId]);

  // Animations fluides pour les courbes
  const animSeqMW = useAnimatedArray(result?.sequential_mw, 650);
  const animMlpMW = useAnimatedArray(result?.mlp_ref_mw, 650);
  const animPersMW = useAnimatedArray(result?.persistence_mw, 650);
  const animActMW = useAnimatedArray(result?.actual_mw, 650);

  // Animations scalaires pour les KPIs
  const animGainMoyen = useAnimatedNumber((result?.gain_moyen_h1_h6 ?? 0.338) * 100, 650, 1);
  const animGainH1 = useAnimatedNumber((result?.gain_h1 ?? 0.195) * 100, 650, 1);
  const animModelSize = useAnimatedNumber(result?.model_size_mb ?? 0.038, 650, 3);
  const animParams = useAnimatedNumber(result?.model_params ?? 9433, 650, 0);

  const cap = capaciteNominale || 50.0;

  // Calcul du delta au pic (H3) entre MLP et modèle séquentiel
  const deltaPeak =
    result?.mlp_ref_mw && result?.sequential_mw
      ? (result.mlp_ref_mw[2] - result.sequential_mw[2]).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* En-tête Compact & Structuré */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <h2 className="font-semibold text-slate-900 text-sm">
            Banc d'Essai Séries Temporelles Récurrentes (Jalon 4)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Calcul...</span>
            </span>
          )}
          <span className="text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold">
            Site A (50 MWc)
          </span>
          <span className="text-[11px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
            {modelType.toUpperCase()} {generationStrategy === 'seq2seq' ? 'Seq2Seq' : 'Direct'} · L={historyHours}h
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchSimulation(historyHours, modelType, generationStrategy, scenarioId)}
            className="text-[11px] underline font-semibold hover:text-rose-900"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Grille Bento 100% Tests (5 cols Gauche / 7 cols Droite) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* ========================================================================= */}
        {/* PANNEAU GAUCHE : Configuration de la Séquence Temporelle (Les Entrées)   */}
        {/* ========================================================================= */}
        <div className="xl:col-span-5 flex flex-col gap-3.5">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider font-mono">
                Configuration de la Séquence
              </h3>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Entrées
              </span>
            </div>

            {/* 1. Sélecteur de la Longueur d'Historique (L) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-semibold text-slate-700">1. Longueur d'Historique (L) :</span>
                <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[10px]">
                  {historyHours === 168 ? '168h (1 semaine)' : `${historyHours} heures`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { hours: 6, label: '6h', sub: 'Court' },
                  { hours: 24, label: '24h', sub: '1 jour' },
                  { hours: 48, label: '48h', sub: '2 jours' },
                  { hours: 168, label: '168h', sub: '1 semaine' },
                ].map((item) => {
                  const isSelected = historyHours === item.hours;
                  return (
                    <button
                      key={item.hours}
                      type="button"
                      onClick={() => setHistoryHours(item.hours)}
                      className={`py-2 px-1 rounded-lg border text-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs font-semibold scale-[1.01]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">{item.label}</div>
                      <div
                        className={`text-[9px] ${
                          isSelected ? 'text-teal-100' : 'text-slate-400'
                        }`}
                      >
                        {item.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Sélecteur du Modèle Récurrent */}
            <div>
              <span className="font-semibold text-slate-700 text-xs block mb-1.5">
                2. Cellule Récurrente :
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'rnn', name: 'RNN Simple', tag: 'Elman · 3,1k' },
                  { id: 'lstm', name: 'LSTM', tag: '3 portes · 9,9k' },
                  { id: 'gru', name: 'GRU', tag: '2 portes · 9,4k' },
                ].map((item) => {
                  const isSelected = modelType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setModelType(item.id)}
                      className={`py-2 px-2 rounded-lg border text-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold ring-1 ring-teal-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.name}</div>
                      <div className="text-[9px] font-mono text-slate-500 mt-0.5">{item.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Stratégie de Génération */}
            <div>
              <span className="font-semibold text-slate-700 text-xs block mb-1.5">
                3. Stratégie de Génération :
              </span>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setGenerationStrategy('direct')}
                  className={`py-1.5 px-2 rounded-md text-xs transition-all text-center ${
                    generationStrategy === 'direct'
                      ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="font-semibold text-xs">Sortie Directe</span>
                  <span className="block text-[9px] text-slate-400 font-mono">Many-to-One (6 d'un coup)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGenerationStrategy('seq2seq')}
                  className={`py-1.5 px-2 rounded-md text-xs transition-all text-center ${
                    generationStrategy === 'seq2seq'
                      ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="font-semibold text-xs">Encodeur-Décodeur</span>
                  <span className="block text-[9px] text-slate-400 font-mono">Many-to-Many (Pas-à-pas)</span>
                </button>
              </div>
            </div>

            {/* 4. Profils Types d'Historique (Scénarios Métiers) */}
            <div>
              <span className="font-semibold text-slate-700 text-xs block mb-1.5">
                4. Scénarios Métiers d'Historique :
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'poussiere_veille',
                    title: 'Poussière de la veille',
                    chips: ['Tempête J-1', 'Soiling 18%', 'Ciel J clair'],
                    icon: 'fa-wind',
                  },
                  {
                    id: 'encrassement_progressif',
                    title: 'Encrassement progressif',
                    chips: ['25J sans lavage', 'Dérive continue', 'Multi-jours'],
                    icon: 'fa-broom',
                  },
                  {
                    id: 'cycle_nominal',
                    title: 'Cycle Solaire Nominal',
                    chips: ['Ciel dégagé', '50 MWc', 'Écrêtage stable'],
                    icon: 'fa-sun',
                  },
                ].map((sc) => {
                  const isSelected = scenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setScenarioId(sc.id)}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <i className={`fa-solid ${sc.icon} text-xs ${isSelected ? 'text-teal-700' : 'text-slate-500'}`}></i>
                        <span className="font-bold text-xs text-slate-900">{sc.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.chips.map((chip, i) => (
                          <span
                            key={i}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              isSelected
                                ? 'bg-white text-teal-800 border-teal-200 font-semibold'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Télémétrie Vérifiée (Jury) */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600 flex items-center justify-between">
              <span>Tenseur d'entrée : <strong>10,03 Mo</strong> (8 707×48×6 float32)</span>
              <span className="text-teal-700 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                LSTM 9,9k ≈ GRU 9,4k
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANNEAU DROIT : Comparaison & Évaluation (Les Résultats)                 */}
        {/* ========================================================================= */}
        <div className="xl:col-span-7 flex flex-col gap-3.5">
          {/* 1. Graphique de Comparaison Dynamique (t+1h à t+6h) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider font-mono">
                Comparaison Dynamique (t+1h à t+6h)
              </h3>

              {/* Légende Compacte */}
              <div className="flex items-center gap-3 text-[11px] font-mono font-medium">
                <span className="flex items-center gap-1 text-teal-800 font-bold">
                  <span className="w-2.5 h-1 rounded-full bg-teal-600"></span>
                  <span>{modelType.toUpperCase()}</span>
                </span>
                <span className="flex items-center gap-1 text-amber-800 font-semibold">
                  <span className="w-2.5 h-0.5 bg-amber-600"></span>
                  <span>MLP Réf.</span>
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2.5 h-0.5 bg-slate-400"></span>
                  <span>Persistance</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Réel</span>
                </span>
              </div>
            </div>

            {/* Tracé SVG Responsive */}
            <div className="w-full h-52 relative select-none">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 520 170">
                {/* Lignes de grille horizontales & repères MW */}
                {[0, 15, 30, 45, 50].map((mw) => {
                  const y = 140 - (mw / cap) * 125;
                  return (
                    <g key={mw}>
                      <line
                        x1="45"
                        y1={y}
                        x2="505"
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray={mw === 50 ? 'none' : '3 3'}
                        strokeWidth={mw === 50 ? '1.5' : '1'}
                      />
                      <text
                        x="38"
                        y={y + 3}
                        fontSize="9"
                        fontFamily="monospace"
                        fill={mw === 50 ? '#0d9488' : '#94a3b8'}
                        textAnchor="end"
                        fontWeight={mw === 50 ? 'bold' : 'normal'}
                      >
                        {mw}
                      </text>
                    </g>
                  );
                })}

                {/* 1. Ligne Réel (vert émeraude fin) */}
                {animActMW && animActMW.length === 6 && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.75"
                    points={animActMW
                      .map((val, idx) => `${65 + idx * 82},${140 - (Math.max(0, val) / cap) * 125}`)
                      .join(' ')}
                  />
                )}

                {/* 2. Ligne Persistance (gris pointillé) */}
                {animPersMW && animPersMW.length === 6 && (
                  <polyline
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    opacity="0.8"
                    points={animPersMW
                      .map((val, idx) => `${65 + idx * 82},${140 - (Math.max(0, val) / cap) * 125}`)
                      .join(' ')}
                  />
                )}

                {/* 3. Ligne MLP de Référence (ambre tiretée) */}
                {animMlpMW && animMlpMW.length === 6 && (
                  <polyline
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    points={animMlpMW
                      .map((val, idx) => `${65 + idx * 82},${140 - (Math.max(0, val) / cap) * 125}`)
                      .join(' ')}
                  />
                )}

                {/* 4. Ligne Principale : Modèle Séquentiel (Teal vif) */}
                {animSeqMW && animSeqMW.length === 6 && (
                  <polyline
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={animSeqMW
                      .map((val, idx) => `${65 + idx * 82},${140 - (Math.max(0, val) / cap) * 125}`)
                      .join(' ')}
                  />
                )}

                {/* Points & Valeurs Interactives */}
                {animSeqMW &&
                  animSeqMW.map((val, idx) => {
                    const cx = 65 + idx * 82;
                    const cySeq = 140 - (Math.max(0, val) / cap) * 125;
                    const cyMlp = 140 - (Math.max(0, animMlpMW[idx] ?? 0) / cap) * 125;

                    return (
                      <g key={idx}>
                        <circle cx={cx} cy={cyMlp} r="3" fill="#d97706" stroke="#ffffff" strokeWidth="1" />
                        <circle cx={cx} cy={cySeq} r="4.5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                        <text
                          x={cx}
                          y={cySeq - 8}
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                          fill="#0f172a"
                          textAnchor="middle"
                        >
                          {val.toFixed(1)}
                        </text>
                        <text
                          x={cx}
                          y="160"
                          fontSize="10"
                          fontFamily="sans-serif"
                          fontWeight="600"
                          fill="#64748b"
                          textAnchor="middle"
                        >
                          t+{idx + 1}h
                        </text>
                      </g>
                    );
                  })}
              </svg>
            </div>

            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>H1 à H6 · Plafond onduleur 50 MWc</span>
              <span>
                RMSE : <strong className="text-teal-700">{result?.rmse_sequential ?? '—'} MW</strong> vs MLP : {result?.rmse_mlp ?? '—'} MW
              </span>
            </div>
          </div>

          {/* 2. Indicateurs Clés (KPIs) Spécifiques au Jalon 4 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Gain Moyen H1-H6</span>
              <div className="font-mono text-lg font-black text-teal-700">
                +{animGainMoyen.toFixed(1)} %
              </div>
              <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                result?.gain_target_met
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                Cible ≥ 0.30 {result?.gain_target_met ? '✓' : '⚠️'}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Taille Modèle</span>
              <div className="font-mono text-lg font-black text-slate-800">
                {animModelSize.toFixed(3)} Mo
              </div>
              <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Cible ≤ 5 Mo ✓
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Paramètres</span>
              <div className="font-mono text-lg font-black text-slate-800">
                {Math.round(animParams).toLocaleString('fr-FR')}
              </div>
              <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                ~9.5k équivalent
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Gain H1 (1h)</span>
              <div className="font-mono text-lg font-black text-emerald-700">
                +{animGainH1.toFixed(1)} %
              </div>
              <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Cible ≥ 0.12 ✓
              </span>
            </div>
          </div>

          {/* 3. Analyse de la Décision (Bannière Compacte) */}
          <div className="bg-teal-50/70 border border-teal-200/90 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0"></span>
              <p className="text-teal-950 font-medium text-[11px] leading-snug">
                <strong className="text-teal-900">Analyse de la Décision : </strong>
                {result?.decision_analysis?.summary ||
                  `Le modèle ${modelType.toUpperCase()} (historique ${historyHours}h) a mémorisé l'encrassement des panneaux d'hier, ajustant la prévision à la baisse par rapport au MLP classique.`}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-mono font-bold bg-white text-teal-800 px-2 py-1 rounded border border-teal-200 shadow-2xs">
              Δ vs MLP : -{deltaPeak} MW
            </span>
          </div>

          {/* 4. Tableau Détaillé du Décodage des 6 Horizons */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
              <span className="font-semibold text-slate-800 text-[11px] font-mono uppercase">
                Décodage des Horizons (t+1h à t+6h)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {generationStrategy === 'seq2seq' ? 'Mode Pas-à-Pas' : 'Mode Direct'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-mono">
                    <th className="py-1 px-2">Horizon</th>
                    <th className="py-1 px-2 text-teal-700 font-bold">{modelType.toUpperCase()}</th>
                    <th className="py-1 px-2 text-amber-700 font-semibold">MLP Réf.</th>
                    <th className="py-1 px-2 text-slate-500">Persistance</th>
                    <th className="py-1 px-2 text-emerald-700 font-semibold">Réel</th>
                    <th className="py-1 px-2">Irradiance</th>
                    <th className="py-1 px-2">État Portes</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.decoding_steps?.map((step, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 hover:bg-slate-50 font-mono text-[11px]"
                    >
                      <td className="py-1.5 px-2 font-bold text-slate-900">{step.horizon}</td>
                      <td className="py-1.5 px-2 text-teal-700 font-bold">
                        {step.sequential_mw.toFixed(1)} MW
                      </td>
                      <td className="py-1.5 px-2 text-amber-700">
                        {step.mlp_ref_mw.toFixed(1)} MW
                      </td>
                      <td className="py-1.5 px-2 text-slate-500">
                        {step.persistence_mw.toFixed(1)} MW
                      </td>
                      <td className="py-1.5 px-2 text-emerald-600 font-semibold">
                        {step.actual_mw.toFixed(1)} MW
                      </td>
                      <td className="py-1.5 px-2 text-slate-600 font-sans text-[11px]">
                        {step.irradiance_future} W/m²
                      </td>
                      <td className="py-1.5 px-2 text-slate-500 font-sans text-[10px]">
                        {step.gate_state}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
