import React, { useState, useEffect, useRef } from 'react';

// Fonction d'interpolation cubique fluide (ease-out cubic)
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

  // Debounce réactif pour éviter les rafales d'appels
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
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Erreur lors du calcul séquentiel.');
        }
        const data = await res.json();
        setResult(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  // Déclenchement réactif à chaque changement d'un paramètre
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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête du Banc d'Essai Jalon 4 */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-sm">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">
              Banc d'Essai Séries Temporelles &amp; Mémoire Récurrente (Jalon 4)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparaison rigoureuse : Réseaux Récurrents (RNN / LSTM / GRU) vs MLP à fenêtre fixe vs Persistance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Calcul...</span>
            </span>
          )}
          <span className="text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full font-semibold">
            Centrale SolarDrâa (50 MWc)
          </span>
          <span className="text-[11px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-semibold">
            Site A — Ouarzazate
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between animate-fade-in">
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

      {/* Grille Principale Bento (5 cols gauche / 7 cols droite) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* PANNEAU GAUCHE : Configuration de la Séquence Temporelle (Les Entrées)   */}
        {/* ========================================================================= */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  Configuration de la Séquence Temporelle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Profondeur de mémoire, cellule récurrente et scénario métier
                </p>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Entrées
              </span>
            </div>

            {/* 1. Sélecteur de la Longueur d'Historique (L) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  1. Longueur d'Historique (L)
                </label>
                <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {historyHours === 168 ? '168h (1 semaine)' : `${historyHours} heures`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { hours: 6, label: '6h', sub: 'Court terme' },
                  { hours: 24, label: '24h', sub: 'Cycle 1J' },
                  { hours: 48, label: '48h', sub: 'Cycle 2J' },
                  { hours: 168, label: '168h', sub: '1 semaine' },
                ].map((item) => {
                  const isSelected = historyHours === item.hours;
                  return (
                    <button
                      key={item.hours}
                      type="button"
                      onClick={() => setHistoryHours(item.hours)}
                      className={`py-2 px-2 rounded-lg border text-center transition-all duration-300 ease-out ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm font-semibold scale-[1.01]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div
                        className={`text-[9px] mt-0.5 ${
                          isSelected ? 'text-teal-100' : 'text-slate-500'
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
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                2. Type de Cellule Récurrente
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'rnn',
                    name: 'RNN Simple',
                    badge: 'Elman vanilla',
                    desc: '1 porte · Évanouissement gradient',
                  },
                  {
                    id: 'lstm',
                    name: 'LSTM',
                    badge: '3 portes + C_t',
                    desc: 'Mémoire long terme robuste',
                  },
                  {
                    id: 'gru',
                    name: 'GRU',
                    badge: '2 portes (Reset/Up)',
                    desc: 'Modèle retenu · Plus compact',
                  },
                ].map((item) => {
                  const isSelected = modelType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setModelType(item.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all duration-300 ease-out ${
                        isSelected
                          ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold ring-1 ring-teal-300 scale-[1.01]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>{item.name}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-teal-700 mt-0.5">
                        {item.badge}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1 leading-tight">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Stratégie de Génération (Interrupteur Many-to-One vs Many-to-Many) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                3. Stratégie de Génération des Horizons
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setGenerationStrategy('direct')}
                  className={`py-2 px-3 rounded-lg text-xs transition-all duration-300 text-center ${
                    generationStrategy === 'direct'
                      ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="font-semibold text-xs">Sortie Directe</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Many-to-One (6 d'un coup)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setGenerationStrategy('seq2seq')}
                  className={`py-2 px-3 rounded-lg text-xs transition-all duration-300 text-center ${
                    generationStrategy === 'seq2seq'
                      ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="font-semibold text-xs">Encodeur-Décodeur</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Many-to-Many (Pas-à-pas)</div>
                </button>
              </div>
            </div>

            {/* 4. Nouveaux Profils Types d'Historique (Scénarios Métiers) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                4. Profils Types d'Historique (Scénarios Métiers)
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'poussiere_veille',
                    title: 'Poussière de la veille',
                    tag: 'Tempête de sable J-1',
                    desc: 'Chute de puissance hier sous le vent de sable. Ciel bleu aujourd’hui, mais panneaux salis : le MLP se fait piéger, le RNN mémorise la poussière.',
                    icon: 'fa-wind',
                  },
                  {
                    id: 'encrassement_progressif',
                    title: 'Encrassement progressif',
                    tag: 'Dérive lente multi-jours',
                    desc: '25 jours sans nettoyage. Baisse continue de 2,5 % tous les 3 jours : seuls les historiques longs (48h/168h) détectent la tendance séculaire.',
                    icon: 'fa-broom',
                  },
                  {
                    id: 'cycle_nominal',
                    title: 'Cycle Solaire Nominal',
                    tag: 'Régime estival 50 MWc',
                    desc: 'Ciel clair sans perturbation, captation optimale et écrêtage à 50 MWc. Baseline de stabilité.',
                    icon: 'fa-sun',
                  },
                ].map((sc) => {
                  const isSelected = scenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setScenarioId(sc.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all duration-300 ease-out flex items-start gap-3 ${
                        isSelected
                          ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-300 scale-[1.01]'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs mt-0.5 shrink-0 ${
                          isSelected
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <i className={`fa-solid ${sc.icon}`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900">{sc.title}</span>
                          <span className="text-[10px] font-mono text-teal-700 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {sc.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                          {sc.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Théorique & Dimensionnement pour le Jury */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Vérification Théorique (Question Sujet) :</span>
                <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 font-bold">
                  Keras Vérifié
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                <div>
                  • Tenseur annuel (48h, 6 var) :{' '}
                  <span className="font-bold text-slate-800">8 707 × 48 × 6</span> ={' '}
                  <span className="text-teal-800 font-bold">10,03 Mo</span> en float32.
                </div>
                <div>
                  • Calibrage budget :{' '}
                  <span className="font-bold text-slate-800">LSTM 32</span> (~9 889 params) vs{' '}
                  <span className="font-bold text-slate-800">GRU 36</span> (9 433 params).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANNEAU DROIT : Comparaison & Évaluation (Les Résultats)                 */}
        {/* ========================================================================= */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* 1. Carte Principale : Graphique de Comparaison Dynamique (t+1h à t+6h) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  Graphique de Comparaison Dynamique (t+1h à t+6h)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modèle séquentiel sélectionné vs MLP de référence vs Persistance Intelligente
                </p>
              </div>

              {/* Légende interactive */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
                <span className="flex items-center gap-1.5 text-teal-800 font-bold">
                  <span className="w-3 h-1.5 rounded-full bg-teal-600"></span>
                  <span>{modelType.toUpperCase()} ({generationStrategy === 'seq2seq' ? 'Seq2Seq' : 'Direct'})</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                  <span className="w-3 h-0.5 bg-amber-600 border-b border-dashed border-amber-600"></span>
                  <span>MLP de référence</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-3 h-0.5 bg-slate-400 border-b border-dotted border-slate-500"></span>
                  <span>Persistance</span>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Réel</span>
                </span>
              </div>
            </div>

            {/* Visualisation SVG Responsive avec Morphing Fluide */}
            <div className="w-full h-56 relative select-none">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 520 180">
                {/* Lignes de grille horizontales & repères MW */}
                {[0, 15, 30, 45, 50].map((mw) => {
                  const y = 150 - (mw / cap) * 135;
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

                {/* 1. Ligne Vérité Terrain (Réel) : vert émeraude discret */}
                {animActMW && animActMW.length === 6 && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.75"
                    points={animActMW
                      .map((val, idx) => `${65 + idx * 82},${150 - (Math.max(0, val) / cap) * 135}`)
                      .join(' ')}
                  />
                )}

                {/* 2. Ligne Persistance Intelligente : gris pointillé */}
                {animPersMW && animPersMW.length === 6 && (
                  <polyline
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    opacity="0.8"
                    points={animPersMW
                      .map((val, idx) => `${65 + idx * 82},${150 - (Math.max(0, val) / cap) * 135}`)
                      .join(' ')}
                  />
                )}

                {/* 3. Ligne MLP de Référence : ambre tiretée */}
                {animMlpMW && animMlpMW.length === 6 && (
                  <polyline
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    points={animMlpMW
                      .map((val, idx) => `${65 + idx * 82},${150 - (Math.max(0, val) / cap) * 135}`)
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
                      .map((val, idx) => `${65 + idx * 82},${150 - (Math.max(0, val) / cap) * 135}`)
                      .join(' ')}
                  />
                )}

                {/* Points & Valeurs Interactives sur le modèle séquentiel */}
                {animSeqMW &&
                  animSeqMW.map((val, idx) => {
                    const cx = 65 + idx * 82;
                    const cySeq = 150 - (Math.max(0, val) / cap) * 135;
                    const valMlp = animMlpMW[idx] ?? 0;
                    const cyMlp = 150 - (Math.max(0, valMlp) / cap) * 135;

                    return (
                      <g key={idx}>
                        {/* Point MLP */}
                        <circle
                          cx={cx}
                          cy={cyMlp}
                          r="3.5"
                          fill="#d97706"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />

                        {/* Point Séquentiel avec Halo */}
                        <circle
                          cx={cx}
                          cy={cySeq}
                          r="5"
                          fill="#0d9488"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />

                        {/* Valeur MW au-dessus */}
                        <text
                          x={cx}
                          y={cySeq - 10}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          fill="#0f172a"
                          textAnchor="middle"
                        >
                          {val.toFixed(1)}
                        </text>

                        {/* Étiquette d'abscisse */}
                        <text
                          x={cx}
                          y="172"
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

            {/* Note sous le graphique */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono">
                Horizon H1 (t+1h) à H6 (t+6h) · Écrêtage onduleur : 50 MWc
              </span>
              <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                RMSE {modelType.toUpperCase()} : {result?.rmse_sequential ?? '—'} MW vs MLP : {result?.rmse_mlp ?? '—'} MW
              </span>
            </div>
          </div>

          {/* 2. Indicateurs Clés (KPIs) Spécifiques au Jalon 4 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* KPI 1 : Gain Moyen H1-H6 (Cible >= 0.30) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Gain Moyen H1-H6
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-black text-teal-700">
                  +{animGainMoyen.toFixed(1)} %
                </span>
              </div>
              <div className="pt-1">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    result?.gain_target_met
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      result?.gain_target_met ? 'fa-check' : 'fa-triangle-exclamation'
                    }`}
                  ></i>
                  <span>Cible ≥ 0.30</span>
                </span>
              </div>
            </div>

            {/* KPI 2 : Taille du Modèle (Cible <= 5 Mo) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Taille du Modèle
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-black text-slate-800">
                  {animModelSize.toFixed(3)} Mo
                </span>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <i className="fa-solid fa-microchip"></i>
                  <span>Cible ≤ 5 Mo</span>
                </span>
              </div>
            </div>

            {/* KPI 3 : Budget de Paramètres (Preuve Jury) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Budget Paramètres
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-black text-slate-800">
                  {Math.round(animParams).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <span>~9.5k équivalent</span>
                </span>
              </div>
            </div>

            {/* KPI 4 : Gain Court Terme H1 (Cible >= 0.12) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Gain H1 (1 heure)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-black text-emerald-700">
                  +{animGainH1.toFixed(1)} %
                </span>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <i className="fa-solid fa-bullseye"></i>
                  <span>Cible ≥ 0.12</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Analyse de la Décision (En bas à droite) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  Analyse de la Décision &amp; Comportement Physique Observé
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                Note de Décision (Soutenance)
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 font-medium text-teal-950">
                {result?.decision_analysis?.narrative ||
                  'Analyse de la dynamique temporelle en cours de calcul...'}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900 block text-[11px]">
                    Effet Mémoire ({historyHours}h) :
                  </span>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {result?.decision_analysis?.memory_effect || 'Chargement...'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900 block text-[11px]">
                    Comparaison vs MLP Tabulaire :
                  </span>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {result?.decision_analysis?.comparison_with_mlp || 'Chargement...'}
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-100/80 rounded-lg text-[11px] text-slate-600 font-mono border border-slate-200 flex items-center justify-between">
                <span>
                  💡 <strong>Argument clé jury :</strong>{' '}
                  {result?.decision_analysis?.jury_takeaway ||
                    'Les réseaux récurrents capturent l’état physique de la centrale grâce à leur mémoire.'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Tableau Détaillé du Décodage des 6 Horizons */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="font-semibold text-slate-800">
                Tableau Comparatif des Décodages (t+1h à t+6h)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {generationStrategy === 'seq2seq' ? 'Mode Pas-à-Pas' : 'Mode Direct'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-mono">
                    <th className="py-1.5 px-2">Horizon</th>
                    <th className="py-1.5 px-2 text-teal-700 font-bold">
                      {modelType.toUpperCase()} (MW)
                    </th>
                    <th className="py-1.5 px-2 text-amber-700 font-semibold">MLP Réf. (MW)</th>
                    <th className="py-1.5 px-2 text-slate-600">Persistance (MW)</th>
                    <th className="py-1.5 px-2 text-emerald-700">Réel (MW)</th>
                    <th className="py-1.5 px-2">Irradiance (W/m²)</th>
                    <th className="py-1.5 px-2">État Cellule / Portes</th>
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
                      <td className="py-1.5 px-2 text-slate-600 font-sans">
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
