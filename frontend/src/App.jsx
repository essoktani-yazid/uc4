import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Jalon3Results from './Jalon3Results';

const API_BASE = '/api';

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

    const start = startRef.current.length === targetArray.length
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
function useAnimatedNumber(targetNumber, duration = 650) {
  const [current, setCurrent] = useState(Number(targetNumber || 0));
  const startRef = useRef(Number(targetNumber || 0));
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (targetNumber === null || targetNumber === undefined) return;
    const start = startRef.current;
    const target = Number(targetNumber);
    startTimeRef.current = performance.now();

    let frameId;
    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      const ease = easeOutCubic(progress);
      const next = Number((start + (target - start) * ease).toFixed(1));

      setCurrent(next);
      startRef.current = next;

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [targetNumber, duration]);

  return current;
}

// Interpolation linéaire RVB continue pour synchronisation parfaite couleur / nombre
function interpolateRgb(hex1, hex2, factor) {
  const f = Math.max(0, Math.min(1, factor));
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);

  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * f);
  const g = Math.round(g1 + (g2 - g1) * f);
  const b = Math.round(b1 + (b2 - b1) * f);

  return `rgb(${r}, ${g}, ${b})`;
}

// Couleurs synchronisées à 100% avec le nombre animé pour la Couverture Nuageuse
function getCouvertureColor(pct) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  if (p <= 50) {
    return interpolateRgb('#0284c7', '#6366f1', p / 50);
  } else {
    return interpolateRgb('#6366f1', '#475569', (p - 50) / 50);
  }
}

// Couleurs synchronisées à 100% avec le nombre animé pour l'Occultation Solaire
function getOccultationColor(pct) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  if (p <= 50) {
    return interpolateRgb('#eab308', '#f97316', p / 50);
  } else {
    return interpolateRgb('#f97316', '#e11d48', (p - 50) / 50);
  }
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tabular' | 'sky' | 'enriched' | 'motion' | 'transfer' | 'gru'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Global system status
  const [health, setHealth] = useState(null);
  const [sampleData, setSampleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Centrale Parameters
  const [capaciteNominale, setCapaciteNominale] = useState(50.0); // MW

  // 1. Tabular State (47 variables)
  const [selectedScenario, setSelectedScenario] = useState('summer_midday');
  const [tabularSubTab, setTabularSubTab] = useState('hist'); // 'hist' | 'meteo' | 'calendar'
  const [hist24h, setHist24h] = useState([
    48.0, 44.0, 35.0, 22.0, 8.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2.5, 8.5, 18.0, 30.5, 41.0, 46.5, 49.0, 48.2,
  ]);
  const [ghiPrev, setGhiPrev] = useState([950, 920, 840, 710, 520, 290]);
  const [nebPrev, setNebPrev] = useState([0.02, 0.03, 0.05, 0.08, 0.1, 0.12]);
  const [tempPrev, setTempPrev] = useState([38.5, 39.2, 39.8, 39.0, 37.5, 35.0]);
  const [heureJour, setHeureJour] = useState(12);
  const [moisAnnee, setMoisAnnee] = useState(7);
  const [heureSin, setHeureSin] = useState(0.0);
  const [heureCos, setHeureCos] = useState(-1.0);
  const [moisSin, setMoisSin] = useState(-0.5);
  const [moisCos, setMoisCos] = useState(-0.866);
  const [joursNettoyage, setJoursNettoyage] = useState(4.0);
  const [tabularResult, setTabularResult] = useState(null);

  // 2. Sky Vision State
  const [selectedSkyPreset, setSelectedSkyPreset] = useState('clear');
  const [customSkyImage, setCustomSkyImage] = useState(null);
  const [skyResult, setSkyResult] = useState(null);

  // 3. Enriched State
  const [enrichedSubTab, setEnrichedSubTab] = useState('hist'); // 'hist' | 'meteo' | 'calendar' | 'ciel' | 'upload'
  const [enrichedSkyImage, setEnrichedSkyImage] = useState(null);
  const [enrichedSkyPreset, setEnrichedSkyPreset] = useState('clear');
  const [enrichedSkyAnalysis, setEnrichedSkyAnalysis] = useState(null);
  const [isEnrichedAnalyzing, setIsEnrichedAnalyzing] = useState(false);
  const [couvT, setCouvT] = useState(25.0);
  const [occT, setOccT] = useState(15.0);
  const [couvTm1, setCouvTm1] = useState(10.0);
  const [occTm1, setOccTm1] = useState(5.0);
  const [enrichedResult, setEnrichedResult] = useState(null);

  // 4. Motion State
  const [motionPreset, setMotionPreset] = useState('incoming_cloud');
  const [customMotionTm1, setCustomMotionTm1] = useState(null);
  const [customMotionT, setCustomMotionT] = useState(null);
  const [motionResult, setMotionResult] = useState(null);

  // 5. Transfer State
  const [targetSite, setTargetSite] = useState('B');
  const [transferResult, setTransferResult] = useState(null);

  // 6. GRU State
  const [gruScenario, setGruScenario] = useState('ete_standard');
  const [gruResult, setGruResult] = useState(null);

  // Animated smooth transition hooks (morphing fluide et interpolation continue)
  const animTabularPred = useAnimatedArray(tabularResult?.previsions_mw);
  const animTabularPers = useAnimatedArray(tabularResult?.persistance_mw);

  const animCouverture = useAnimatedNumber(skyResult?.couverture_nuageuse_pct);
  const animOccultation = useAnimatedNumber(skyResult?.occultation_soleil_pct);

  const animEnrichedClassique = useAnimatedArray(enrichedResult?.previsions_classique_mw);
  const animEnrichedEnrichi = useAnimatedArray(enrichedResult?.previsions_enrichi_mw);
  const animEnrichedPers = useAnimatedArray(enrichedResult?.persistance_mw || tabularResult?.persistance_mw);
  const animEnrichedGain = useAnimatedNumber(enrichedResult?.gain_moyen_pct);

  const animMotionOcc = useAnimatedNumber(motionResult?.occultation_tp1_pct);

  const animTransferZS = useAnimatedArray(transferResult?.previsions_zeroshot_mw, 700);
  const animTransferFT = useAnimatedArray(transferResult?.previsions_finetuned_mw, 700);
  const animTransferGain = useAnimatedNumber(transferResult?.gain_transfert_pct, 700);
  const animTransferRMSEZS = useAnimatedNumber(transferResult?.rmse_zeroshot, 700);
  const animTransferRMSEFT = useAnimatedNumber(transferResult?.rmse_finetuned, 700);

  const animGruMW = useAnimatedArray(gruResult?.previsions_gru_mw, 700);

  // Telemetry log history
  const [telemetryLogs, setTelemetryLogs] = useState([
    { time: '08:00:12', module: 'System', text: 'Moteur IA SolarDrâa initialisé avec succès.' },
    { time: '08:00:15', module: 'Modèles', text: '7 modèles Keras chargés et scalers validés.' },
  ]);

  const addLog = (module, text) => {
    const timeStr = new Date().toLocaleTimeString('fr-FR');
    setTelemetryLogs((prev) => [{ time: timeStr, module, text }, ...prev.slice(0, 30)]);
  };

  // Initial load
  useEffect(() => {
    fetchHealthAndSamples();
  }, []);

  const fetchHealthAndSamples = async () => {
    try {
      setIsLoading(true);
      const [hRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/health`),
        fetch(`${API_BASE}/samples`),
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setHealth(hData);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSampleData(sData);
      }
      addLog('API', 'Synchronisation réussie avec le backend FastAPI.');
      // Auto-initialisation de tous les modules IA pour des graphiques actifs et animés dès le départ
      runTabularPrediction(true);
      runSkyPrediction('clear', true);
      runEnrichedPrediction(true);
      runMotionPrediction('incoming_cloud', true);
      // Jalon 3 charge ses mesures archivées dans son propre composant.
      runGruPrediction('ete_standard', true);
    } catch (err) {
      console.error(err);
      setErrorMessage("Impossible de joindre le backend FastAPI. Vérifiez qu'il est bien démarré sur le port 8000.");
      addLog('Erreur', 'Échec de connexion au serveur API.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Run Tabular Prediction (avec option isSilent pour morphing continu réactif)
  const runTabularPrediction = async (isSilent = false) => {
    const silent = isSilent === true;
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        historique_24h: hist24h,
        ghi_prevue: ghiPrev,
        nebulosite_prevue: nebPrev,
        temperature_prevue: tempPrev,
        heure_sin: Number(heureSin),
        heure_cos: Number(heureCos),
        mois_sin: Number(moisSin),
        mois_cos: Number(moisCos),
        jours_depuis_nettoyage: Number(joursNettoyage),
        capacite_nominale: Number(capaciteNominale),
      };

      const res = await fetch(`${API_BASE}/predict/tabular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).detail || 'Erreur lors du calcul tabulaire');
      const data = await res.json();
      setTabularResult(data);
      if (!silent) {
        addLog('Tabulaire', `Prévision 6h générée (Pic: ${Math.max(...data.previsions_mw)} MW).`);
      }
    } catch (err) {
      setErrorMessage(err.message);
      addLog('Erreur Tabulaire', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Animation réactive fluide : recalcul automatique et morphing continu lors de l'ajustement des 47 variables
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      runTabularPrediction(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [
    JSON.stringify(hist24h),
    JSON.stringify(ghiPrev),
    JSON.stringify(nebPrev),
    JSON.stringify(tempPrev),
    heureSin,
    heureCos,
    moisSin,
    moisCos,
    joursNettoyage,
    capaciteNominale,
  ]);

  // 2. Run Sky Prediction (supporte sélection directe et animation fluide des jauges)
  const runSkyPrediction = async (presetIdOverride = null, isSilent = false, customImgOverride = null) => {
    const silent = isSilent === true;
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const activeImg = customImgOverride !== null ? customImgOverride : customSkyImage;
      const pid = typeof presetIdOverride === 'string' ? presetIdOverride : selectedSkyPreset;
      const payload = activeImg && !presetIdOverride
        ? { image_base64: activeImg }
        : { preset_id: pid };

      const res = await fetch(`${API_BASE}/predict/sky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).detail || 'Erreur CNN Ciel');
      const data = await res.json();
      setSkyResult(data);
      // Auto-mise à jour des valeurs pour le mode enrichi
      setCouvT(data.couverture_nuageuse_pct);
      setOccT(data.occultation_soleil_pct);
      if (!silent) {
        addLog('CNN Ciel', `Couverture: ${data.couverture_nuageuse_pct}% | Occultation: ${data.occultation_soleil_pct}%`);
      }
    } catch (err) {
      setErrorMessage(err.message);
      addLog('Erreur CNN Ciel', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // 3. Run Enriched Prediction (avec morphing dynamique en direct)
  const runEnrichedPrediction = async (isSilent = false) => {
    const silent = isSilent === true;
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        tabular: {
          historique_24h: hist24h,
          ghi_prevue: ghiPrev,
          nebulosite_prevue: nebPrev,
          temperature_prevue: tempPrev,
          heure_sin: Number(heureSin),
          heure_cos: Number(heureCos),
          mois_sin: Number(moisSin),
          mois_cos: Number(moisCos),
          jours_depuis_nettoyage: Number(joursNettoyage),
          capacite_nominale: Number(capaciteNominale),
        },
        couverture_t: Number(couvT),
        occultation_t: Number(occT),
        couverture_tm1: Number(couvTm1),
        occultation_tm1: Number(occTm1),
      };

      const res = await fetch(`${API_BASE}/predict/enriched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).detail || 'Erreur prévision enrichie');
      const data = await res.json();
      setEnrichedResult(data);
      if (!silent) {
        addLog('MLP Enrichi', `Gain d'anticipation moyen court-terme: +${data.gain_moyen_pct}%.`);
      }
    } catch (err) {
      setErrorMessage(err.message);
      addLog('Erreur MLP Enrichi', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Recalcul fluide et animé automatique pour l'enrichi
  useEffect(() => {
    if (!enrichedResult) return;
    const timer = setTimeout(() => {
      runEnrichedPrediction(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [
    couvT,
    occT,
    couvTm1,
    occTm1,
    JSON.stringify(hist24h),
    JSON.stringify(ghiPrev),
    JSON.stringify(nebPrev),
    JSON.stringify(tempPrev),
    heureSin,
    heureCos,
    moisSin,
    moisCos,
    joursNettoyage,
    capaciteNominale,
  ]);

  // Gestionnaires pour le sous-onglet Upload d'Image Ciel dans Prévision Enrichie
  const handleEnrichedSkyUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setEnrichedSkyImage(base64);
      setEnrichedSkyPreset(null);
      setIsEnrichedAnalyzing(true);
      try {
        const res = await fetch(`${API_BASE}/predict/sky`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64 }),
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Erreur analyse image ciel');
        const data = await res.json();
        setEnrichedSkyAnalysis(data);
        setCouvT(data.couverture_nuageuse_pct);
        setOccT(data.occultation_soleil_pct);
        addLog('CNN Ciel (Enrichi)', `Image analysée : Couverture ${data.couverture_nuageuse_pct}% | Occultation ${data.occultation_soleil_pct}%`);
      } catch (err) {
        setErrorMessage(err.message);
        addLog('Erreur CNN Ciel', err.message);
      } finally {
        setIsEnrichedAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEnrichedPresetSelect = async (presetId) => {
    setEnrichedSkyPreset(presetId);
    setEnrichedSkyImage(null);
    setIsEnrichedAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/predict/sky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_id: presetId }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Erreur preset ciel');
      const data = await res.json();
      setEnrichedSkyAnalysis(data);
      setCouvT(data.couverture_nuageuse_pct);
      setOccT(data.occultation_soleil_pct);
      addLog('CNN Ciel (Enrichi)', `Preset ${presetId} : Couverture ${data.couverture_nuageuse_pct}% | Occultation ${data.occultation_soleil_pct}%`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsEnrichedAnalyzing(false);
    }
  };

  // 4. Run Motion Prediction
  const runMotionPrediction = async (presetIdOverride = null, isSilent = false, customImgsOverride = null) => {
    const silent = isSilent === true;
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const imgTm1 = customImgsOverride?.img_tm1 !== undefined ? customImgsOverride.img_tm1 : customMotionTm1;
      const imgT = customImgsOverride?.img_t !== undefined ? customImgsOverride.img_t : customMotionT;
      const pid = typeof presetIdOverride === 'string' ? presetIdOverride : motionPreset;
      const payload =
        imgTm1 && imgT && !presetIdOverride
          ? { img_tm1_base64: imgTm1, img_t_base64: imgT }
          : { preset_id: pid };

      const res = await fetch(`${API_BASE}/predict/motion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).detail || 'Erreur dynamique nuages');
      const data = await res.json();
      setMotionResult(data);
      if (!silent) {
        addLog('CNN Mouvement', `Occultation t+1 prédite: ${data.occultation_tp1_pct}% (${data.niveau_risque})`);
      }
    } catch (err) {
      setErrorMessage(err.message);
      addLog('Erreur CNN Mouvement', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // 6. Run GRU Prediction
  const runGruPrediction = async (scenarioOverride = null, isSilent = false) => {
    const silent = isSilent === true;
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const scen = typeof scenarioOverride === 'string' ? scenarioOverride : gruScenario;
      const payload = { scenario_id: scen };

      const res = await fetch(`${API_BASE}/predict/gru`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).detail || 'Erreur GRU');
      const data = await res.json();
      setGruResult(data);
      if (!silent) {
        addLog('GRU Seq2Seq', 'Décodage récurrent pas-à-pas des 6 horizons calculé.');
      }
    } catch (err) {
      setErrorMessage(err.message);
      addLog('Erreur GRU', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Helper setters pour les 47 variables individuelles
  const updateHistHour = (index, value) => {
    const num = Math.max(0, Math.min(Number(capaciteNominale), Number(value) || 0));
    setHist24h((prev) => {
      const copy = [...prev];
      copy[index] = Number(num.toFixed(1));
      return copy;
    });
  };

  const updateGhiHour = (index, value) => {
    const num = Math.max(0, Math.min(1300, Number(value) || 0));
    setGhiPrev((prev) => {
      const copy = [...prev];
      copy[index] = Number(num.toFixed(0));
      return copy;
    });
  };

  const updateNebHour = (index, value) => {
    const num = Math.max(0, Math.min(1.0, Number(value) || 0));
    setNebPrev((prev) => {
      const copy = [...prev];
      copy[index] = Number(num.toFixed(2));
      return copy;
    });
  };

  const updateTempHour = (index, value) => {
    const num = Math.max(-10, Math.min(60, Number(value) || 0));
    setTempPrev((prev) => {
      const copy = [...prev];
      copy[index] = Number(num.toFixed(1));
      return copy;
    });
  };

  // Calcul automatique des sinusoïdes dès que l'opérateur modifie l'heure
  const handleHeureChange = (h) => {
    const hour = Number(h);
    setHeureJour(hour);
    const angle = (2 * Math.PI * hour) / 24;
    setHeureSin(Number(Math.sin(angle).toFixed(3)));
    setHeureCos(Number(Math.cos(angle).toFixed(3)));
  };

  // Calcul automatique des sinusoïdes dès que l'opérateur modifie le mois
  const handleMoisChange = (m) => {
    const month = Number(m);
    setMoisAnnee(month);
    const angle = (2 * Math.PI * (month - 1)) / 12;
    setMoisSin(Number(Math.sin(angle).toFixed(3)));
    setMoisCos(Number(Math.cos(angle).toFixed(3)));
  };

  const MOIS_NOMS = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
  ];

  // Apply Tabular Preset
  const handleApplyTabularPreset = (presetId) => {
    if (!sampleData?.tabular_presets) return;
    const p = sampleData.tabular_presets.find((x) => x.id === presetId);
    if (!p) return;
    setSelectedScenario(presetId);
    setHist24h([...p.historique_24h]);
    setGhiPrev([...p.ghi_prevue]);
    setNebPrev([...p.nebulosite_prevue]);
    setTempPrev([...p.temperature_prevue]);
    if (presetId === 'summer_midday') {
      handleHeureChange(12);
      handleMoisChange(7);
    } else if (presetId === 'cloud_drop') {
      handleHeureChange(14);
      handleMoisChange(8);
    } else if (presetId === 'dust_soiling') {
      handleHeureChange(13);
      handleMoisChange(6);
    } else {
      if (p.heure_sin !== undefined) setHeureSin(p.heure_sin);
      if (p.heure_cos !== undefined) setHeureCos(p.heure_cos);
      if (p.mois_sin !== undefined) setMoisSin(p.mois_sin);
      if (p.mois_cos !== undefined) setMoisCos(p.mois_cos);
    }
    setJoursNettoyage(p.jours_depuis_nettoyage);
    addLog('Preset', `Scénario tabulaire '${p.name}' chargé.`);
  };

  const applyHistProfile = (profile) => {
    if (profile === 'bell') {
      setHist24h([48.0, 44.0, 35.0, 22.0, 8.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2.5, 8.5, 18.0, 30.5, 41.0, 46.5, 49.0, 48.2]);
    } else if (profile === 'cloudy') {
      setHist24h([20.0, 18.0, 14.0, 9.0, 3.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5, 4.5, 9.0, 14.5, 18.0, 21.0, 22.5, 20.0]);
    } else if (profile === 'zero') {
      setHist24h(new Array(24).fill(0));
    } else if (profile === 'ramp') {
      setHist24h([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5, 5.0, 11.5, 20.0, 29.5, 37.0, 42.5, 46.0, 47.5]);
    }
  };

  const applyMeteoProfile = (profile) => {
    if (profile === 'zenith') {
      setGhiPrev([950, 920, 840, 710, 520, 290]);
      setNebPrev([0.02, 0.03, 0.05, 0.08, 0.1, 0.12]);
      setTempPrev([38.5, 39.2, 39.8, 39.0, 37.5, 35.0]);
    } else if (profile === 'storm') {
      setGhiPrev([820, 610, 340, 220, 180, 90]);
      setNebPrev([0.25, 0.65, 0.88, 0.92, 0.78, 0.55]);
      setTempPrev([32.0, 31.0, 28.5, 26.0, 25.2, 24.5]);
    } else if (profile === 'overcast') {
      setGhiPrev([420, 390, 350, 280, 210, 110]);
      setNebPrev([0.75, 0.80, 0.82, 0.85, 0.88, 0.85]);
      setTempPrev([26.0, 26.5, 27.0, 26.5, 25.5, 24.0]);
    }
  };

  // Handle Image Upload Helper
  const handleFileUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen w-full flex flex-col m-0 p-0 bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. Header Sticky Pleine Largeur */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div  style={{display: 'none'}} className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo & Titre */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm">
              <i className="fa-solid fa-solar-panel text-lg text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900">SOLARDRAA</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs text-slate-600 font-medium">Plateforme IA Solaire</span>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-mono font-medium">
                  <i className="fa-solid fa-chart-line text-[10px] text-teal-600" /> Jalon 1 à 4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Supervision, Évaluation & Inférence des Modèles Keras</p>
            </div>
          </div>

          {/* Quick Actions & User Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-sm"
            >
              <i className="fa-solid fa-gear text-xs text-slate-500" />
              <span>Configuration</span>
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              title="Journal d'activité et télémétrie"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-sm"
            >
              <i className="fa-solid fa-list-check text-xs text-slate-500" />
              <span>Télémétrie</span>
            </button>

            <button
              onClick={fetchHealthAndSamples}
              title="Rafraîchir l'état du système"
              disabled={isLoading}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 active:scale-95 transition shadow-sm"
            >
              <i className={`fa-solid fa-rotate-right text-xs ${isLoading ? 'animate-spin text-teal-600' : 'text-slate-600'}`} />
            </button>

            {/* Profil Utilisateur Clean */}
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  AD
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400/30" />
              </div>
              <div className="text-left hidden md:block">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">Opérateur IA</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">En ligne</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono leading-tight block">admin@solardraa.ma</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Clean Light Style */}
        <div className="w-full px-4 sm:px-8 border-t border-slate-100 bg-slate-50/50 flex overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 py-1.5">
            {[
              { id: 'dashboard', label: 'Tableau de Bord', faIcon: 'fa-table-columns', badge: 'Supervision' },
              { id: 'tabular', label: '1. Prévision Tabulaire', faIcon: 'fa-sliders', badge: 'MLP 47v' },
              { id: 'sky', label: '2. Vision du Ciel', faIcon: 'fa-cloud-sun', badge: 'CNN Ciel' },
              { id: 'enriched', label: '3. Prévision Enrichie', faIcon: 'fa-layer-group', badge: 'MLP 51v' },
              { id: 'motion', label: '4. Dynamique Nuages', faIcon: 'fa-wind', badge: 'CNN t+1' },
              { id: 'transfer', label: '5. Transfert de Site', faIcon: 'fa-compass', badge: 'Site A/B' },
              { id: 'gru', label: '6. Séries GRU', faIcon: 'fa-clock-rotate-left', badge: 'Seq2Seq' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-teal-700 border border-slate-200/90 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  <i className={`fa-solid ${tab.faIcon} text-xs ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. Global Feedback Alerts */}
      <div className="w-full px-4 sm:px-8">
        {errorMessage && (
          <div className="mb-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 animate-fade-in shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-800">Alerte</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Full-Width Content Container */}
      <main className="w-full px-4 sm:px-8 py-4 flex-1 flex flex-col gap-5">
        {/* VUE D'ENSEMBLE : TABLEAU DE BORD (DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* KPI Top Bento Grid - Réservé strictement au Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Centrale Solaire</span>
                  <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    DRAA-01
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xl font-mono font-bold text-slate-900 tracking-tight">
                    {capaciteNominale.toFixed(1)} <span className="text-xs font-normal text-slate-500">MWc</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Site A Ouarzazate (Désert)</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Modèles IA Keras</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                </div>
                <div className="mt-2">
                  <p className="text-xl font-mono font-bold text-slate-900 tracking-tight">
                    7 / 7 <span className="text-xs font-normal text-slate-500">Actifs</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">CNN, MLP & GRU Déployés</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Horizon Inférence</span>
                  <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    H=6
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xl font-mono font-bold text-slate-900 tracking-tight">
                    6 <span className="text-xs font-normal text-slate-500">Heures</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pas horaire régulier (t+1..t+6)</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Latence API</span>
                  <span className="text-[10px] font-mono text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">CPU</span>
                </div>
                <div className="mt-2">
                  <p className="text-xl font-mono font-bold text-emerald-600 tracking-tight">
                    ~24 <span className="text-xs font-normal text-slate-500">ms</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Inférence CPU optimisée</p>
                </div>
              </div>
            </div>

            {/* Rangée 2 : Synthèse de Production et Supervision Multi-Sites */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Carte Principale de Production (8 colonnes) */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Supervision de Production en Temps Réel</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Profil journalier solaire (24h passées) et projections d'inférence (6h futures)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Production Optimale
                      </span>
                    </div>
                  </div>

                  {/* Indicateurs Rapides en Ligne */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Puissance Actuelle</span>
                      <p className="font-mono text-lg font-bold text-slate-900 mt-0.5">
                        {animTabularPred.length > 0 ? animTabularPred[0].toFixed(1) : '48.2'}{' '}
                        <span className="text-xs font-normal text-slate-500">MW</span>
                      </p>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        {animTabularPred.length > 0
                          ? `${((animTabularPred[0] / capaciteNominale) * 100).toFixed(1)}% de la capacité`
                          : '96.4% de la capacité'}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Irradiance GHI</span>
                      <p className="font-mono text-lg font-bold text-amber-600 mt-0.5">
                        {ghiPrev[0]} <span className="text-xs font-normal text-slate-500">W/m²</span>
                      </p>
                      <span className="text-[10px] text-slate-500">Soleil zénithal direct</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Température Cellules</span>
                      <p className="font-mono text-lg font-bold text-slate-900 mt-0.5">
                        {tempPrev[0].toFixed(1)} <span className="text-xs font-normal text-slate-500">°C</span>
                      </p>
                      <span className="text-[10px] text-slate-500">Rendement onduleurs 98.2%</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Énergie Cumulée Jour</span>
                      <p className="font-mono text-lg font-bold text-teal-700 mt-0.5">342.8 <span className="text-xs font-normal text-slate-500">MWh</span></p>
                      <span className="text-[10px] text-teal-600 font-medium">+4.8% vs moyenne estivale</span>
                    </div>
                  </div>

                  {/* SVG Chart de la Cloche Solaire */}
                  <div className="mt-5 w-full h-44 relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 540 140">
                      {[0, 35, 70, 105].map((y) => (
                        <line key={y} x1="30" y1={y} x2="530" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                      ))}
                      {/* Gradient fill */}
                      <defs>
                        <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#solarGrad)"
                        d="M 40,110 Q 150,110 210,50 T 320,15 T 410,65 T 510,110 L 510,110 L 40,110 Z"
                      />
                      <path
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="3"
                        strokeLinecap="round"
                        d="M 40,110 Q 150,110 210,50 T 320,15 T 410,65 T 510,110"
                      />
                      {/* Point actuel */}
                      <circle cx="320" cy={110 - (animTabularPred[0] ? (animTabularPred[0] / capaciteNominale) * 95 : 95)} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                      <text x="320" y={100 - (animTabularPred[0] ? (animTabularPred[0] / capaciteNominale) * 95 : 95)} fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#0f172a" textAnchor="middle">
                        Midi ({animTabularPred.length > 0 ? animTabularPred[0].toFixed(1) : '48.2'} MW)
                      </text>
                      <line x1="320" y1={110 - (animTabularPred[0] ? (animTabularPred[0] / capaciteNominale) * 95 : 95)} x2="320" y2="110" stroke="#f59e0b" strokeDasharray="2 2" />

                      {/* X axis labels */}
                      <text x="50" y="126" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">06:00 (Lever)</text>
                      <text x="180" y="126" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">09:00</text>
                      <text x="320" y="126" fontSize="9" fill="#0d9488" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">12:00 (Actuel)</text>
                      <text x="420" y="126" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">15:00 (Prévu)</text>
                      <text x="500" y="126" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">18:00 (Coucher)</text>
                    </svg>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Profil de production</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Point zénithal actuel</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('tabular')}
                    className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-semibold group"
                  >
                    <span>Lancer une prévision 6h détaillée</span>
                    <span className="font-mono text-xs group-hover:translate-x-0.5 transition">→</span>
                  </button>
                </div>
              </div>

              {/* Supervision Multi-Sites (4 colonnes) */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Supervision Multi-Sites</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      2 Centrales
                    </span>
                  </div>

                  <div className="mt-4 space-y-3.5">
                    {/* Site A */}
                    <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/90">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">Site A — Ouarzazate</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-mono font-medium">Référence</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">Climat désertique, rayonnement direct DNI très élevé.</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-teal-200/60 text-xs font-mono">
                        <span className="text-slate-500">Capacité: 50.0 MW</span>
                        <span className="font-bold text-emerald-700">48.2 MW actif</span>
                      </div>
                    </div>

                    {/* Site B */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">Site B — Tarfaya</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono font-medium">Transfert Jalon 3</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">Façade Atlantique, entrées maritimes et brumes matinales.</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs font-mono">
                        <span className="text-slate-500">Capacité: 20.0 MW</span>
                        <span className="font-bold text-slate-700">24.5 MW actif</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3">
                  <button
                    onClick={() => setActiveTab('transfer')}
                    className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition flex items-center justify-center"
                  >
                    <span>Évaluer le transfert Zero-Shot vs Fine-Tuned</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rangée 3 : Matrice des 7 Modèles IA et Bancs d'Essai */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Matrice Opérationnelle des 7 Modèles Keras (7 colonnes) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Inventaire des 7 Modèles Keras Déployés</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Tous Opérationnels
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                        <th className="py-2 px-2">Modèle</th>
                        <th className="py-2 px-2">Architecture</th>
                        <th className="py-2 px-2">Entrées / Sorties</th>
                        <th className="py-2 px-2 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-900">modele_solaire_optimise</td>
                        <td className="py-2 px-2 text-slate-600">MLP (Dense 64-32)</td>
                        <td className="py-2 px-2 text-slate-500">47 vars → 6 horizons</td>
                        <td className="py-2 px-2 text-right"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Prêt</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-900">modele_ciel</td>
                        <td className="py-2 px-2 text-slate-600">CNN Conv2D (16-32)</td>
                        <td className="py-2 px-2 text-slate-500">(32, 32, 1) → 2 cibles</td>
                        <td className="py-2 px-2 text-right"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Prêt</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-900">mlp_enrichi</td>
                        <td className="py-2 px-2 text-slate-600">MLP Multimodal</td>
                        <td className="py-2 px-2 text-slate-500">51 vars (47+4) → 6h</td>
                        <td className="py-2 px-2 text-right"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Prêt</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-900">cnn_mouvement</td>
                        <td className="py-2 px-2 text-slate-600">CNN Temporel (t-1, t)</td>
                        <td className="py-2 px-2 text-slate-500">(32, 32, 2) → occ t+1</td>
                        <td className="py-2 px-2 text-right"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Prêt</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-900">j3_mlp_siteA_depart</td>
                        <td className="py-2 px-2 text-slate-600">MLP Natif Zero-Shot</td>
                        <td className="py-2 px-2 text-slate-500">47 vars → 6h Site A</td>
                        <td className="py-2 px-2 text-right"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Prêt</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-900">j3_mlp_siteB_full_ft</td>
                        <td className="py-2 px-2 text-slate-600">MLP Transféré Ajusté</td>
                        <td className="py-2 px-2 text-slate-500">47 vars → 6h Site B</td>
                        <td className="py-2 px-2 text-right"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Prêt</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-900">encdec_gru</td>
                        <td className="py-2 px-2 text-slate-600">Encodeur-Décodeur GRU</td>
                        <td className="py-2 px-2 text-slate-500">(48, 6) + (6, 5) → 6h</td>
                        <td className="py-2 px-2 text-right"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Prêt</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raccourcis Bancs d'Essai (5 colonnes) */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Accès aux 6 Bancs d'Essai</h3>
                  </div>
                  <span className="text-[10px] text-slate-500">6 Modules</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  {[
                    { id: 'tabular', title: '1. Tabulaire (47v)', desc: 'Optimisation 6h' },
                    { id: 'sky', title: '2. Vision Ciel', desc: 'CNN Couverture & Occ.' },
                    { id: 'enriched', title: '3. MLP Enrichi (51v)', desc: 'Fusion Multimodale' },
                    { id: 'motion', title: '4. Mouvement Nuages', desc: 'Anticipation t+1' },
                    { id: 'transfer', title: '5. Transfert Site', desc: 'Zero-shot vs Tuned' },
                    { id: 'gru', title: '6. Séries GRU', desc: 'Seq2Seq 48 heures' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveTab(m.id)}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-teal-700 transition">{m.title}</span>
                        <span className="text-xs text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition font-mono">→</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1.5">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Active Tab Content Views (Bancs d'Essai Spécialisés) */}

        {/* MODULE 1: Prévision Tabulaire (Modèle Optimisé - 47 variables) */}
        {activeTab === 'tabular' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-fade-in items-start">
            {/* Left Controls: Spécification Intégrale des 47 Variables (7 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5">
                {/* Header with Title and 47-variables indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Spécification des 47 Variables d'Entrée
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Vecteur complet (1, 47) pour le Modèle MLP Solaire Optimisé (Jalon 1)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      47 / 47 Variables Actives
                    </span>
                  </div>
                </div>

                {/* Scénarios Réels Prédéfinis (1-Clic) */}
                <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Chargement Rapide par Scénario Réel (47D)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Presets Ouarzazate</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'summer_midday', label: 'Été Plein Soleil', desc: 'Midi, ciel pur, 50 MW' },
                      { id: 'cloud_drop', label: 'Chute Orageuse', desc: 'Nébulosité 88%, choc t+3' },
                      { id: 'dust_soiling', label: 'Vent de Sable', desc: 'Soiling 28j, irradiance voilée' },
                    ].map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleApplyTabularPreset(sc.id)}
                        className={`p-2 rounded-lg text-left transition border flex flex-col justify-between ${
                          selectedScenario === sc.id
                            ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs ring-1 ring-teal-400/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">
                            {sc.label}
                          </span>
                          {selectedScenario === sc.id && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">Actif</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">{sc.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3 Dedicated Tabs: Chaque partie dans son propre onglet */}
                <div className="flex items-center gap-1.5 border-b border-slate-200 mt-4 pb-2 text-xs overflow-x-auto">
                  {[
                    { id: 'hist', label: '1. Historique 24h', count: 24 },
                    { id: 'meteo', label: '2. Météo Future (6h)', count: 18 },
                    { id: 'calendar', label: '3. Calendrier & Salissure', count: 5 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTabularSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
                        tabularSubTab === tab.id
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        tabularSubTab === tab.id
                          ? 'bg-teal-700/60 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  {/* SECTION 1: Historique de Production 24h (24 variables : X0 à X23) */}
                  {tabularSubTab === 'hist' && (
                    <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/15 animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-teal-100 mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                          1. Historique de Production (24h Passées : X0 à X23)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                        24 Variables · Puissance (MW)
                      </span>
                    </div>

                    {/* Quick Profiles Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/90 mb-3">
                      <span className="text-slate-600 font-medium text-[11px]">
                        Profils types d'historique 24h :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyHistProfile('bell')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Cloche 50 MW
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHistProfile('cloudy')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Couvert 20 MW
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHistProfile('ramp')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Rampe Matin
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHistProfile('zero')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Nuit (0 MW)
                        </button>
                      </div>
                    </div>

                    {/* 24h Interactive Mini SVG Histogram */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/90 mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-slate-700">Aperçu Chronologique de la Puissance (H-24 à H-1)</span>
                        <span className="text-[11px] font-mono text-slate-600">
                          Pic historique : <span className="font-bold text-teal-700">{Math.max(...hist24h).toFixed(1)} MW</span>
                        </span>
                      </div>
                      <div className="w-full h-14 relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 480 55">
                          <line x1="0" y1="28" x2="480" y2="28" stroke="#cbd5e1" strokeDasharray="2 2" />
                          <line x1="0" y1="52" x2="480" y2="52" stroke="#94a3b8" />
                          {hist24h.map((v, i) => {
                            const barHeight = (v / capaciteNominale) * 48;
                            const x = i * 20 + 2;
                            const y = 52 - barHeight;
                            return (
                              <rect
                                key={i}
                                x={x}
                                y={y}
                                width="16"
                                height={Math.max(1.5, barHeight)}
                                rx="2"
                                fill={v > 0 ? '#0d9488' : '#e2e8f0'}
                                className="transition-all duration-200 hover:fill-teal-500 cursor-pointer"
                              />
                            );
                          })}
                        </svg>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                        <span>H-24 (X0)</span>
                        <span>H-18 (X6)</span>
                        <span>H-12 (X12)</span>
                        <span>H-6 (X18)</span>
                        <span>H-1 (X23)</span>
                      </div>
                    </div>

                    {/* Grid of 24 Numeric Inputs */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {hist24h.map((val, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                            <span className="font-semibold text-slate-700">H-{24 - idx}</span>
                            <span className="text-teal-700 font-bold">X{idx}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <input
                              type="number"
                              min="0"
                              max={capaciteNominale}
                              step="0.5"
                              value={val}
                              onChange={(e) => updateHistHour(idx, e.target.value)}
                              className="w-full text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right focus:outline-teal-500"
                            />
                            <span className="text-[9px] text-slate-400 font-mono">MW</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-teal-600 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (val / capaciteNominale) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: Prévisions Météo Futures 6h (18 variables : X24 à X41) */}
                {tabularSubTab === 'meteo' && (
                  <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/15 animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-200 mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                          2. Prévisions Météorologiques Futures (6 Pas : X24 à X41)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        18 Variables · t+1h à t+6h
                      </span>
                    </div>

                    {/* Quick Weather Profiles Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/90 mb-3">
                      <span className="text-slate-600 font-medium text-[11px]">
                        Gabarits météo en 1-clic :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyMeteoProfile('zenith')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 font-medium transition"
                        >
                          Zénith Dégagé
                        </button>
                        <button
                          type="button"
                          onClick={() => applyMeteoProfile('storm')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 font-medium transition"
                        >
                          Orage t+3
                        </button>
                        <button
                          type="button"
                          onClick={() => applyMeteoProfile('overcast')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition"
                        >
                          Voile Nuageux
                        </button>
                      </div>
                    </div>

                    {/* 2.A: Irradiance Globale Horizontale - GHI (6 variables: X24 à X29) */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Irradiance Globale Horizontale (GHI)
                          </span>
                          <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                            X24 à X29 · W/m²
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          Moyenne : {(ghiPrev.reduce((a, b) => a + b, 0) / 6).toFixed(0)} W/m²
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {ghiPrev.map((val, idx) => (
                          <div key={idx} className="bg-slate-50/60 p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span className="font-semibold text-slate-700">t+{idx + 1}h</span>
                              <span className="text-amber-700 font-bold">X{24 + idx}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <input
                                type="number"
                                min="0"
                                max="1300"
                                step="10"
                                value={val}
                                onChange={(e) => updateGhiHour(idx, e.target.value)}
                                className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right focus:outline-teal-500"
                              />
                              <span className="text-[9px] text-slate-400 font-mono">W</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (val / 1200) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2.B: Fraction Nébulosité Météo (6 variables: X30 à X35) */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Fraction Nébulosité Prévue
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            X30 à X35 · Ratio [0, 1]
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          Moyenne : {((nebPrev.reduce((a, b) => a + b, 0) / 6) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {nebPrev.map((val, idx) => (
                          <div key={idx} className="bg-slate-50/60 p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span className="font-semibold text-slate-700">t+{idx + 1}h</span>
                              <span className="text-slate-600 font-bold">X{30 + idx}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.05"
                                value={val}
                                onChange={(e) => updateNebHour(idx, e.target.value)}
                                className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right focus:outline-teal-500"
                              />
                              <span className="text-[9px] text-slate-400 font-mono">r</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-slate-600 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, val * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2.C: Température Ambiante Prévue (6 variables: X36 à X41) */}
                    <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Température Ambiante Prévue
                          </span>
                          <span className="text-[10px] font-mono bg-rose-50 text-rose-800 px-1.5 py-0.2 rounded border border-rose-200">
                            X36 à X41 · °C
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          Moyenne : {(tempPrev.reduce((a, b) => a + b, 0) / 6).toFixed(1)} °C
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {tempPrev.map((val, idx) => (
                          <div key={idx} className="bg-slate-50/60 p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span className="font-semibold text-slate-700">t+{idx + 1}h</span>
                              <span className="text-rose-700 font-bold">X{36 + idx}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <input
                                type="number"
                                min="-10"
                                max="55"
                                step="0.5"
                                value={val}
                                onChange={(e) => updateTempHour(idx, e.target.value)}
                                className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right focus:outline-teal-500"
                              />
                              <span className="text-[9px] text-slate-400 font-mono">°C</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-rose-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, ((val + 10) / 65) * 100))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3: Calendrier (Auto Sin/Cos) & Salissure (5 variables : X42 à X46) */}
                {tabularSubTab === 'calendar' && (
                  <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/15 animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-indigo-200 mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                          3. Calendrier Solaire (Sin/Cos Auto) & Entretien (X42 à X46)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                        Angles Déduits Automatiquement
                      </span>
                    </div>

                    {/* 3.A: Heure du Jour (L'opérateur spécifie l'heure, sin et cos se calculent automatiquement) */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Heure Solaire du Jour (Spécification Opérateur)
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                          {heureJour}h00 UTC
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="23"
                        step="1"
                        value={heureJour}
                        onChange={(e) => handleHeureChange(e.target.value)}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded cursor-pointer mb-1.5"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-2.5">
                        <span>00h (Nuit)</span>
                        <span>06h (Aube)</span>
                        <span>12h (Zénith)</span>
                        <span>18h (Crépuscule)</span>
                        <span>23h</span>
                      </div>

                      {/* Badges de calcul automatique des variables X42 et X43 */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">X42 · heure_sin (auto)</span>
                            <span className="text-[9px] text-indigo-600 font-mono">sin(2π·{heureJour}/24)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {heureSin.toFixed(3)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">X43 · heure_cos (auto)</span>
                            <span className="text-[9px] text-indigo-600 font-mono">cos(2π·{heureJour}/24)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {heureCos.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3.B: Mois de l'Année (L'opérateur choisit le mois, sin et cos se calculent automatiquement) */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Mois de l'Année & Saisonnalité (Spécification Opérateur)
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {MOIS_NOMS[moisAnnee - 1]} (Mois {moisAnnee})
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1 mb-2.5">
                        {MOIS_NOMS.map((nom, idx) => (
                          <button
                            key={nom}
                            type="button"
                            onClick={() => handleMoisChange(idx + 1)}
                            className={`py-1 rounded text-xs font-mono transition text-center ${
                              moisAnnee === idx + 1
                                ? 'bg-blue-600 text-white font-bold shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {nom}
                          </button>
                        ))}
                      </div>

                      {/* Badges de calcul automatique des variables X44 et X45 */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">X44 · mois_sin (auto)</span>
                            <span className="text-[9px] text-blue-600 font-mono">sin(2π·{moisAnnee - 1}/12)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                            {moisSin.toFixed(3)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">X45 · mois_cos (auto)</span>
                            <span className="text-[9px] text-blue-600 font-mono">cos(2π·{moisAnnee - 1}/12)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                            {moisCos.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3.C: Entretien & Lavage des Panneaux (Variable X46) */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Salissure & Lavage des Panneaux (Variable X46)
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          {joursNettoyage} jours sans lavage
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                        <span>Pertes optiques par poussière désertique :</span>
                        <span className="font-mono font-semibold text-amber-700">
                          ~-{(joursNettoyage * 0.15).toFixed(1)}% de captation
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="1"
                        value={joursNettoyage}
                        onChange={(e) => setJoursNettoyage(Number(e.target.value))}
                        className="w-full accent-emerald-600 h-2 bg-slate-200 rounded cursor-pointer mb-2"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { j: 0, label: 'Lavage Récent (0j)' },
                          { j: 4, label: 'Standard (4j)' },
                          { j: 14, label: '2 Semaines (14j)' },
                          { j: 30, label: '1 Mois (30j)' },
                          { j: 60, label: 'Tempête Sable (60j)' },
                        ].map((btn) => (
                          <button
                            key={btn.j}
                            type="button"
                            onClick={() => setJoursNettoyage(btn.j)}
                            className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                              joursNettoyage === btn.j
                                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                </div>

                {/* Real-time reactive status bar (No submit button per user request) */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-teal-900">
                      Inférence continue en temps réel active
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Vecteur 47D standardisé par scaler_base.pkl
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Latence CPU : ~24 ms
                    </span>
                    <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                      Auto-morphing 650ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Results: Visualisation Prévisionnelle (5 cols) - Fixée au scroll & alignée en haut */}
            <div className="xl:col-span-5 flex flex-col gap-4 xl:sticky xl:top-[60px] self-start z-10">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between min-h-[460px]">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        Courbe Prévisionnelle de Production
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Modèle MLP Optimisé vs Persistance Intelligente
                      </p>
                    </div>
                    {tabularResult && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                        RMSE: {tabularResult.rmse_estime} MW
                      </span>
                    )}
                  </div>

                  {tabularResult ? (
                    <div className="mt-4">
                      {/* Telemetry Summary Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block">Production Max</span>
                          <span className="font-mono text-sm font-bold text-teal-800">
                            {Math.max(...animTabularPred).toFixed(1)} MW
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block">Énergie Cumulée 6h</span>
                          <span className="font-mono text-sm font-bold text-slate-800">
                            {animTabularPred.reduce((a, b) => a + b, 0).toFixed(1)} MWh
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block">Facteur de Charge</span>
                          <span className="font-mono text-sm font-bold text-indigo-700">
                            {((animTabularPred.reduce((a, b) => a + b, 0) / (capaciteNominale * 6)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Responsive SVG Line Chart with Animated Smooth Curves */}
                      <div className="w-full h-56 relative bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 170">
                          {/* Grid Lines */}
                          {[10, 45, 80, 115, 145].map((y) => (
                            <line key={y} x1="30" y1={y} x2="490" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          ))}

                          {/* Y-axis labels */}
                          <text x="25" y="14" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">50 MW</text>
                          <text x="25" y="84" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">25 MW</text>
                          <text x="25" y="148" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">0 MW</text>

                          {/* Persistence Curve (Dashed Slate) */}
                          <polyline
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            points={animTabularPers
                              .map((val, idx) => `${55 + idx * 80},${145 - (val / capaciteNominale) * 135}`)
                              .join(' ')}
                          />

                          {/* Optimized Model Curve (Teal Solid) */}
                          <polyline
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={animTabularPred
                              .map((val, idx) => `${55 + idx * 80},${145 - (val / capaciteNominale) * 135}`)
                              .join(' ')}
                          />

                          {/* Points on Persistence Curve */}
                          {animTabularPers.map((val, idx) => {
                            const cx = 55 + idx * 80;
                            const cy = 145 - (val / capaciteNominale) * 135;
                            return (
                              <g key={`pers-${idx}`}>
                                <circle cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
                              </g>
                            );
                          })}

                          {/* Points on Optimized Model Curve */}
                          {animTabularPred.map((val, idx) => {
                            const cx = 55 + idx * 80;
                            const cy = 145 - (val / capaciteNominale) * 135;
                            return (
                              <g key={idx}>
                                <circle cx={cx} cy={cy} r="5" fill="#0d9488" stroke="#ffffff" strokeWidth="2.5" />
                                <text
                                  x={cx}
                                  y={cy - 10}
                                  fontSize="10"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                >
                                  {val.toFixed(1)} MW
                                </text>
                                <text
                                  x={cx}
                                  y="164"
                                  fontSize="10"
                                  fontFamily="sans-serif"
                                  fontWeight="bold"
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

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-1.5 bg-teal-600 rounded-full" />
                          <span className="text-slate-700 font-semibold">Modèle MLP Optimisé (47v)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-0.5 border-t border-dashed border-slate-400" />
                          <span className="text-slate-500 font-medium">Persistance Intelligente</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3">
                        6h
                      </div>
                      <p className="text-xs font-medium text-slate-700">Calcul automatique en continu...</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                        Modifiez l'une des 47 variables pour visualiser le morphing dynamique de la courbe de production.
                      </p>
                    </div>
                  )}
                </div>

                {/* 6 Horizon Cards Bar */}
                {tabularResult && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-4 border-t border-slate-100 mt-4">
                    {animTabularPred.map((p, i) => {
                      const pers = animTabularPers[i] || 0;
                      const delta = p - pers;
                      return (
                        <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center transition-all">
                          <span className="text-[10px] text-slate-500 block font-mono font-medium">t+{i + 1}h</span>
                          <span className="font-mono text-xs font-bold text-slate-900 block mt-0.5">{p.toFixed(1)} MW</span>
                          <span className="text-[9px] text-slate-500 font-mono block">
                            Persist: {pers.toFixed(1)}
                          </span>
                          <span className={`text-[8px] font-mono block mt-0.5 ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: Vision du Ciel (CNN Ciel) */}
        {activeTab === 'sky' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Images Caméra Ciel (All-Sky)</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    Jalon 2
                  </span>
                </div>

                {/* Preset Sky Images Clicker */}
                <div className="mt-4">
                  <label className="text-xs font-medium text-slate-700 block mb-2">
                    Images Réelles de la Caméra (3 Exemples Cliquables)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {sampleData?.sky_presets?.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedSkyPreset(p.id);
                          setCustomSkyImage(null);
                          runSkyPrediction(p.id, true);
                        }}
                        className={`p-2 rounded-xl border cursor-pointer transition flex flex-col items-center gap-1.5 ${
                          selectedSkyPreset === p.id && !customSkyImage
                            ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={p.image_data}
                          alt={p.label}
                          className="w-16 h-16 rounded-lg object-cover border border-slate-300 shadow-2xs image-rendering-pixelated"
                        />
                        <span className="text-[11px] font-medium text-slate-800 text-center line-clamp-1">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload or Dropzone avec Affichage Direct */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Ou Téléverser une Image Personnalisée
                    </label>
                    {customSkyImage && (
                      <button
                        onClick={() => {
                          setCustomSkyImage(null);
                          setSelectedSkyPreset('clear');
                          runSkyPrediction('clear', true);
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Réinitialiser</span>
                      </button>
                    )}
                  </div>

                  {customSkyImage ? (
                    <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-300 flex items-center gap-3.5 animate-fade-in shadow-xs">
                      <img
                        src={customSkyImage}
                        alt="Image téléversée"
                        className="w-16 h-16 rounded-lg object-cover border-2 border-teal-400 shadow-sm image-rendering-pixelated flex-shrink-0 bg-slate-900"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-slate-900">Image Utilisateur Téléversée</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">Traitée instantanément par le CNN</p>
                        <div className="mt-2">
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-[11px] font-medium text-slate-700 cursor-pointer shadow-2xs">
                            <span>Remplacer l'image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                handleFileUpload(e, (dataUri) => {
                                  setCustomSkyImage(dataUri);
                                  setSelectedSkyPreset(null);
                                  runSkyPrediction(null, true, dataUri);
                                });
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 transition">
                      <span className="text-xs text-slate-600 font-medium">Glisser-déposer ou Parcourir</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG (Redimensionné en 32x32 pixels)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          handleFileUpload(e, (dataUri) => {
                            setCustomSkyImage(dataUri);
                            setSelectedSkyPreset(null);
                            runSkyPrediction(null, true, dataUri);
                          });
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Statut Automatique Temps Réel (Bouton annulé) */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-teal-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Analyse CNN automatique en temps réel
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Latence ~15ms
                  </span>
                </div>
              </div>
            </div>

            {/* Right Gauges (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between min-h-[380px]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Diagnostics Vision du Ciel</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Extraction des Variables Météorologiques Clés</p>
                    </div>
                    {skyResult && (
                      <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {skyResult.etat_ciel}
                      </span>
                    )}
                  </div>

                  {skyResult ? (
                    <div className="mt-5 flex flex-col gap-5">
                      {/* Affichage de l'image analysée */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              customSkyImage ||
                              sampleData?.sky_presets?.find((p) => p.id === selectedSkyPreset)?.image_data
                            }
                            alt="Ciel analysé"
                            className="w-14 h-14 rounded-lg object-cover border border-slate-300 shadow-2xs image-rendering-pixelated bg-slate-900"
                          />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                              Image Ciel Analysée
                            </span>
                            <span className="text-xs font-bold text-slate-900 block mt-0.5">
                              {customSkyImage
                                ? "Image Personnalisée Téléversée"
                                : sampleData?.sky_presets?.find((p) => p.id === selectedSkyPreset)?.label || "Exemple Caméra"}
                            </span>
                            <span className="text-[10px] text-teal-700 font-mono">
                              Matrice (32, 32, 1) • Canal Normalisé
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Inférence Active
                        </span>
                      </div>
                      {/* Dual Circular Gauges */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Gauge 1: Couverture Nuageuse */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col items-center">
                          <span className="text-xs font-semibold text-slate-700 mb-2">
                            Couverture Nuageuse
                          </span>
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke={getCouvertureColor(animCouverture)}
                                strokeWidth="8"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * animCouverture) / 100}
                                strokeLinecap="round"
                                fill="none"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <span
                                className="font-mono text-2xl font-bold block"
                                style={{ color: getCouvertureColor(animCouverture) }}
                              >
                                {animCouverture.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-slate-500 font-sans">du dôme céleste</span>
                            </div>
                          </div>
                        </div>

                        {/* Gauge 2: Occultation Solaire */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col items-center">
                          <span className="text-xs font-semibold text-slate-700 mb-2">
                            Occultation Solaire
                          </span>
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke={getOccultationColor(animOccultation)}
                                strokeWidth="8"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * animOccultation) / 100}
                                strokeLinecap="round"
                                fill="none"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <span
                                className="font-mono text-2xl font-bold block"
                                style={{ color: getOccultationColor(animOccultation) }}
                              >
                                {animOccultation.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-slate-500 font-sans">rayonnement direct</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operational Impact Notice */}
                      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900">
                        <div>
                          <p className="text-xs font-semibold">Impact Opérationnel Détecté :</p>
                          <p className="text-xs text-teal-800 mt-0.5">{skyResult.impact_production}</p>
                          <p className="text-[11px] text-teal-700 mt-1">
                            Ces deux métriques sont automatiquement injectées dans le modèle enrichi à 51 variables.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3">
                        CNN
                      </div>
                      <p className="text-xs font-medium text-slate-700">Aucune image analysée</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                        Sélectionnez un preset ou téléversez une photo pour évaluer la couverture nuageuse.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: Prévision Enrichie (MLP Multimodal - 51 variables) */}
        {activeTab === 'enriched' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-fade-in items-start">
            {/* Left Controls: Spécification des 51 Variables Multimodales (7 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5">
                {/* Header with Title and 51-variables indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Spécification des Variables Multimodales (51 Variables)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      47 variables tabulaires + 4 descripteurs CNN ciel (t &amp; t-1)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                      51 / 51 Variables (MLP + CNN)
                    </span>
                  </div>
                </div>

                {/* Sub-Tabs Navigation for Enriched Mode */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 mb-4 mt-3 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'hist', label: '1. Historique 24h', count: '24' },
                    { id: 'meteo', label: '2. Météo Future (6h)', count: '18' },
                    { id: 'calendar', label: '3. Calendrier & Salissure', count: '5' },
                    { id: 'ciel', label: '4. Descripteurs CNN', count: '4' },
                    { id: 'upload', label: '5. Uploader Image Ciel', count: 'Caméra' },
                  ].map((tab) => {
                    const isActive = enrichedSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEnrichedSubTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-white text-teal-700 border border-slate-200 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                            isActive
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-slate-200/70 text-slate-500'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* SECTION 1: Historique 24h (24 variables : X0 à X23) */}
                {enrichedSubTab === 'hist' && (
                  <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/15 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-teal-200 mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                          1. Historique de Puissance Solaire (24 Heures : X0 à X23)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                        Capacité Nominale : {capaciteNominale} MWc
                      </span>
                    </div>

                    {/* Quick Profile Presets */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs text-slate-600 font-medium mr-1">
                        Profils types d'historique 24h :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyHistProfile('bell')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Cloche 50 MW
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHistProfile('cloudy')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Couvert 20 MW
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHistProfile('ramp')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Rampe Matin
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHistProfile('zero')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Nuit (0 MW)
                        </button>
                      </div>
                    </div>

                    {/* 24h Interactive Mini SVG Histogram */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/90 mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-slate-700">Aperçu Chronologique de la Puissance (H-24 à H-1)</span>
                        <span className="text-[11px] font-mono text-slate-600">
                          Pic historique : <span className="font-bold text-teal-700">{Math.max(...hist24h).toFixed(1)} MW</span>
                        </span>
                      </div>
                      <div className="w-full h-14 relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 480 55">
                          <line x1="0" y1="28" x2="480" y2="28" stroke="#cbd5e1" strokeDasharray="2 2" />
                          <line x1="0" y1="52" x2="480" y2="52" stroke="#94a3b8" />
                          {hist24h.map((v, i) => {
                            const barHeight = (v / capaciteNominale) * 48;
                            const x = i * 20 + 2;
                            const y = 52 - barHeight;
                            return (
                              <rect
                                key={i}
                                x={x}
                                y={y}
                                width="16"
                                height={Math.max(1.5, barHeight)}
                                rx="2"
                                fill={v > 0 ? '#0d9488' : '#e2e8f0'}
                                className="transition-all duration-200 hover:fill-teal-500 cursor-pointer"
                              />
                            );
                          })}
                        </svg>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                        <span>H-24 (X0)</span>
                        <span>H-18 (X6)</span>
                        <span>H-12 (X12)</span>
                        <span>H-6 (X18)</span>
                        <span>H-1 (X23)</span>
                      </div>
                    </div>

                    {/* Grid of 24 Numeric Inputs */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {hist24h.map((val, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                            <span className="font-semibold text-slate-700">H-{24 - idx}</span>
                            <span className="text-teal-700 font-bold">X{idx}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <input
                              type="number"
                              min="0"
                              max={capaciteNominale}
                              step="0.5"
                              value={val}
                              onChange={(e) => updateHistHour(idx, e.target.value)}
                              className="w-full text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right focus:outline-teal-500"
                            />
                            <span className="text-[9px] text-slate-400 font-mono">MW</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-teal-600 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (val / capaciteNominale) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: Météo Future (18 variables : X24 à X41) */}
                {enrichedSubTab === 'meteo' && (
                  <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/15 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-200 mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                          2. Météo Prévue sur 6 Heures (18 Variables : X24 à X41)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        Horizon t+1 à t+6h
                      </span>
                    </div>

                    {/* Quick Weather Presets */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs text-slate-600 font-medium mr-1">
                        Profils météo types :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyMeteoProfile('zenith')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 font-medium transition"
                        >
                          Ensoleillé (Désertique)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyMeteoProfile('storm')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 font-medium transition"
                        >
                          Passage Orageux
                        </button>
                        <button
                          type="button"
                          onClick={() => applyMeteoProfile('overcast')}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 font-medium transition"
                        >
                          Couvert Constant
                        </button>
                      </div>
                    </div>

                    {/* 2.A: GHI Prévue */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Rayonnement Global Horizontal (GHI Prévu)
                          </span>
                          <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                            X24 à X29 · W/m²
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          Moyenne : {(ghiPrev.reduce((a, b) => a + b, 0) / 6).toFixed(0)} W/m²
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {ghiPrev.map((val, idx) => (
                          <div key={idx} className="bg-slate-50/60 p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span className="font-semibold text-slate-700">t+{idx + 1}h</span>
                              <span className="text-amber-700 font-bold">X{24 + idx}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <input
                                type="number"
                                min="0"
                                max="1300"
                                step="10"
                                value={val}
                                onChange={(e) => updateGhiHour(idx, e.target.value)}
                                className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right focus:outline-teal-500"
                              />
                              <span className="text-[9px] text-slate-400 font-mono">W/m²</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (val / 1100) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2.B: Nébulosité Prévue */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Nébulosité du Ciel Prévue (Fraction Couverte)
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            X30 à X35 · 0.0 à 1.0
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          Moyenne : {((nebPrev.reduce((a, b) => a + b, 0) / 6) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {nebPrev.map((val, idx) => (
                          <div key={idx} className="bg-slate-50/60 p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span className="font-semibold text-slate-700">t+{idx + 1}h</span>
                              <span className="text-slate-700 font-bold">X{30 + idx}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.05"
                                value={val}
                                onChange={(e) => updateNebHour(idx, e.target.value)}
                                className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right focus:outline-teal-500"
                              />
                              <span className="text-[9px] text-slate-400 font-mono">r</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-slate-600 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, val * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2.C: Température Ambiante Prévue */}
                    <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Température Ambiante Prévue
                          </span>
                          <span className="text-[10px] font-mono bg-rose-50 text-rose-800 px-1.5 py-0.2 rounded border border-rose-200">
                            X36 à X41 · °C
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          Moyenne : {(tempPrev.reduce((a, b) => a + b, 0) / 6).toFixed(1)} °C
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {tempPrev.map((val, idx) => (
                          <div key={idx} className="bg-slate-50/60 p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span className="font-semibold text-slate-700">t+{idx + 1}h</span>
                              <span className="text-rose-700 font-bold">X{36 + idx}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <input
                                type="number"
                                min="-10"
                                max="55"
                                step="0.5"
                                value={val}
                                onChange={(e) => updateTempHour(idx, e.target.value)}
                                className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right focus:outline-teal-500"
                              />
                              <span className="text-[9px] text-slate-400 font-mono">°C</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-rose-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, ((val + 10) / 65) * 100))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3: Calendrier (Auto Sin/Cos) & Salissure (5 variables : X42 à X46) */}
                {enrichedSubTab === 'calendar' && (
                  <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/15 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-indigo-200 mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                          3. Calendrier Solaire (Sin/Cos Auto) &amp; Entretien (X42 à X46)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                        Angles Déduits Automatiquement
                      </span>
                    </div>

                    {/* 3.A: Heure du Jour */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Heure Solaire du Jour (Spécification Opérateur)
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                          {heureJour}h00 UTC
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="23"
                        step="1"
                        value={heureJour}
                        onChange={(e) => handleHeureChange(e.target.value)}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded cursor-pointer mb-1.5"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-2.5">
                        <span>00h (Nuit)</span>
                        <span>06h (Aube)</span>
                        <span>12h (Zénith)</span>
                        <span>18h (Crépuscule)</span>
                        <span>23h</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">X42 · heure_sin (auto)</span>
                            <span className="text-[9px] text-indigo-600 font-mono">sin(2π·{heureJour}/24)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {heureSin.toFixed(3)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">X43 · heure_cos (auto)</span>
                            <span className="text-[9px] text-indigo-600 font-mono">cos(2π·{heureJour}/24)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {heureCos.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3.B: Mois de l'Année */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Mois de l'Année &amp; Saisonnalité (Spécification Opérateur)
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {MOIS_NOMS[moisAnnee - 1]} (Mois {moisAnnee})
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1 mb-2.5">
                        {MOIS_NOMS.map((nom, idx) => (
                          <button
                            key={nom}
                            type="button"
                            onClick={() => handleMoisChange(idx + 1)}
                            className={`py-1 rounded text-xs font-mono transition text-center ${
                              moisAnnee === idx + 1
                                ? 'bg-blue-600 text-white font-bold shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {nom}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">X44 · mois_sin (auto)</span>
                            <span className="text-[9px] text-blue-600 font-mono">sin(2π·{moisAnnee - 1}/12)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                            {moisSin.toFixed(3)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 block">X45 · mois_cos (auto)</span>
                            <span className="text-[9px] text-blue-600 font-mono">cos(2π·{moisAnnee - 1}/12)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                            {moisCos.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3.C: Salissure */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Jours depuis le Dernier Nettoyage (Encrassement &amp; Soiling)
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          {joursNettoyage} Jours
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="1"
                        value={joursNettoyage}
                        onChange={(e) => setJoursNettoyage(Number(e.target.value))}
                        className="w-full accent-emerald-600 h-2 bg-slate-200 rounded cursor-pointer mb-1.5"
                      />
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-100">
                        <span>Variable X46 : {joursNettoyage}j</span>
                        <span className="text-emerald-700 font-medium">
                          Impact salissure estimé : -{((joursNettoyage / 60) * 12.5).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 4: Descripteurs CNN (4 variables : X47 à X50) */}
                {enrichedSubTab === 'ciel' && (
                  <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/15 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-teal-200 mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                          4. Descripteurs CNN Ciel (4 Variables : X47 à X50)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                        États Visuels t et t-1
                      </span>
                    </div>

                    {/* Presets rapides de transition */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs text-slate-600 font-medium mr-1">
                        Scénarios ciel rapides :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCouvT(5);
                            setOccT(0);
                            setCouvTm1(5);
                            setOccTm1(0);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Ciel Dégagé Stable
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCouvT(85);
                            setOccT(90);
                            setCouvTm1(15);
                            setOccTm1(5);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-300 font-medium transition"
                        >
                          Passage Nuageux Brutal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCouvT(30);
                            setOccT(10);
                            setCouvTm1(75);
                            setOccTm1(80);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium transition"
                        >
                          Découverte Solaire
                        </button>
                      </div>
                    </div>

                    {/* Variables à l'instant t */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                          <span className="text-xs font-semibold text-slate-900">
                            Variables CNN Ciel à l'Instant t (X47 &amp; X48)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Direct Caméra
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[11px] text-slate-600 font-mono">X47 · Couverture nuageuse (t)</span>
                            <span className="font-mono font-bold text-slate-900">{couvT.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={couvT}
                            onChange={(e) => setCouvT(Number(e.target.value))}
                            className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[11px] text-slate-600 font-mono">X48 · Occultation directe du soleil (t)</span>
                            <span className="font-mono font-bold text-rose-700">{occT.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={occT}
                            onChange={(e) => setOccT(Number(e.target.value))}
                            className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Variables à l'instant t-1 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span className="text-xs font-semibold text-slate-900">
                            Variables CNN Ciel à l'Instant t-1 (X49 &amp; X50)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Mémoire Antérieure
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[11px] text-slate-600 font-mono">X49 · Couverture nuageuse (t-1)</span>
                            <span className="font-mono font-bold text-slate-800">{couvTm1.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={couvTm1}
                            onChange={(e) => setCouvTm1(Number(e.target.value))}
                            className="w-full accent-slate-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[11px] text-slate-600 font-mono">X50 · Occultation directe du soleil (t-1)</span>
                            <span className="font-mono font-bold text-slate-800">{occTm1.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={occTm1}
                            onChange={(e) => setOccTm1(Number(e.target.value))}
                            className="w-full accent-slate-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 5: Uploader Image Ciel (Nouveau sous-onglet demandé) */}
                {enrichedSubTab === 'upload' && (
                  <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/15 animate-fade-in space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-teal-200">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                          5. Analyse d'Image Caméra All-Sky par CNN (Jalon 2)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                        Injection Directe dans X47 &amp; X48
                      </span>
                    </div>

                    {/* Zone de Drag & Drop / Téléversement */}
                    <label className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-white hover:bg-teal-50/30 text-center shadow-xs">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEnrichedSkyUpload}
                        className="hidden"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        {isEnrichedAnalyzing ? 'Analyse en cours...' : 'Téléverser une Image du Ciel (Caméra All-Sky)'}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Glissez-déposez ou parcourez vos fichiers (PNG, JPG, WebP)
                      </span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded mt-2 font-mono">
                        Redimensionnement automatique 32×32×1 pour le modèle CNN Ciel
                      </span>
                    </label>

                    {/* Presets Caméra Ciel Réelles */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-700">
                          Ou Sélectionner une Photo Réelle de la Caméra :
                        </label>
                        {enrichedSkyImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setEnrichedSkyImage(null);
                              handleEnrichedPresetSelect('clear');
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                          >
                            <span>Réinitialiser</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {sampleData?.sky_presets?.map((p) => {
                          const isSelected = enrichedSkyPreset === p.id && !enrichedSkyImage;
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleEnrichedPresetSelect(p.id)}
                              className={`p-2 rounded-xl border cursor-pointer transition flex flex-col items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-500/20 shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <img
                                src={p.image_data}
                                alt={p.label}
                                className="w-16 h-16 rounded-lg object-cover border border-slate-300 shadow-2xs image-rendering-pixelated bg-slate-900"
                              />
                              <span className="text-[11px] font-medium text-slate-800 text-center line-clamp-1">
                                {p.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Affichage de l'Image Téléversée / Sélectionnée & Analyse CNN */}
                    {(enrichedSkyImage || enrichedSkyPreset) && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs animate-fade-in space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-semibold text-slate-900">
                              Image Ciel Active (All-Sky Caméra)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {enrichedSkyImage ? 'Photo Téléversée Utilisateur' : `Preset : ${enrichedSkyPreset}`}
                          </span>
                        </div>

                        {/* Image Preview */}
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-56">
                          <img
                            src={enrichedSkyImage || sampleData?.sky_presets?.find((p) => p.id === enrichedSkyPreset)?.image_data}
                            alt="Ciel All-Sky"
                            className="w-full h-48 object-cover image-rendering-pixelated"
                          />
                          <div className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-900/80 backdrop-blur text-white text-[10px] font-mono border border-white/20">
                            CNN 32×32 Inférence
                          </div>
                        </div>

                        {/* Extracted CNN Features Grid */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200">
                            <span className="text-[10px] font-mono text-teal-800 block">Couverture Nuageuse Détectée (X47)</span>
                            <span className="text-base font-mono font-bold text-teal-900 mt-0.5 block">{couvT.toFixed(1)}%</span>
                            <div className="w-full bg-teal-200 rounded-full h-1 mt-1 overflow-hidden">
                              <div className="bg-teal-600 h-full rounded-full" style={{ width: `${couvT}%` }} />
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                            <span className="text-[10px] font-mono text-amber-800 block">Occultation Solaire Directe (X48)</span>
                            <span className="text-base font-mono font-bold text-amber-900 mt-0.5 block">{occT.toFixed(1)}%</span>
                            <div className="w-full bg-amber-200 rounded-full h-1 mt-1 overflow-hidden">
                              <div className="bg-amber-600 h-full rounded-full" style={{ width: `${occT}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Diagnostic & Option t-1 */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="text-slate-700">
                            <span className="text-[11px]">
                              Diagnostic : <span className="font-semibold text-slate-900">
                                {enrichedSkyAnalysis?.etat_ciel || (occT > 60 ? 'Occultation Solaire Critique' : couvT > 40 ? 'Ciel Nuageux' : 'Ciel Dégagé')}
                              </span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCouvTm1(couvT);
                              setOccTm1(occT);
                              addLog('CNN Ciel', `Paramètres t (${couvT}% / ${occT}%) propagés vers t-1.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition shadow-2xs"
                          >
                            <span>Copier aussi vers l'instant t-1</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Realtime Footer Banner */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-teal-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Fusion multimodale en temps réel
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      51 composantes actives
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Latence CPU : ~24 ms
                    </span>
                    <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                      Auto-morphing 650ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Comparison Chart: Visualisation Prévisionnelle Multimodale (5 cols) - Fixée au scroll & alignée en haut */}
            <div className="xl:col-span-5 flex flex-col gap-4 xl:sticky xl:top-[60px] self-start z-10">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between min-h-[460px]">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        Comparaison : Classique (47v), Enrichi (51v) & Persistance
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Benchmark multimodal vs modèle tabulaire et persistance intelligente
                      </p>
                    </div>
                    {enrichedResult && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-200">
                        Gain H1-H3: +{animEnrichedGain.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {enrichedResult ? (
                    <div className="mt-4">
                      {/* Telemetry Summary Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block">Gain Moyen H1-H3</span>
                          <span className="font-mono text-sm font-bold text-teal-700">
                            +{animEnrichedGain.toFixed(1)}%
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block">Prod. t+1h Enrichie</span>
                          <span className="font-mono text-sm font-bold text-teal-900">
                            {animEnrichedEnrichi[0]?.toFixed(1) || '0.0'} MW
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block">Prod. Classique</span>
                          <span className="font-mono text-sm font-bold text-slate-700">
                            {animEnrichedClassique[0]?.toFixed(1) || '0.0'} MW
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block">Persistance t+1h</span>
                          <span className="font-mono text-sm font-bold text-amber-700">
                            {animEnrichedPers[0]?.toFixed(1) || '0.0'} MW
                          </span>
                        </div>
                      </div>

                      {/* Responsive Comparison SVG Line Chart */}
                      <div className="w-full h-56 relative bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 170">
                          {/* Grid Lines */}
                          {[10, 45, 80, 115, 145].map((y) => (
                            <line key={y} x1="30" y1={y} x2="490" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          ))}

                          {/* Y-axis labels */}
                          <text x="25" y="14" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                            50 MW
                          </text>
                          <text x="25" y="84" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                            25 MW
                          </text>
                          <text x="25" y="148" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                            0 MW
                          </text>

                          {/* Persistance Intelligente Curve (Dashed Amber) */}
                          <polyline
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            points={animEnrichedPers
                              .map((val, idx) => `${55 + idx * 80},${145 - (val / capaciteNominale) * 135}`)
                              .join(' ')}
                          />

                          {/* Base Model Curve (Dashed Slate) */}
                          <polyline
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                            points={animEnrichedClassique
                              .map((val, idx) => `${55 + idx * 80},${145 - (val / capaciteNominale) * 135}`)
                              .join(' ')}
                          />

                          {/* Enriched Model Curve (Solid Teal) */}
                          <polyline
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={animEnrichedEnrichi
                              .map((val, idx) => `${55 + idx * 80},${145 - (val / capaciteNominale) * 135}`)
                              .join(' ')}
                          />

                          {/* Points on Persistence Curve */}
                          {animEnrichedPers.map((val, idx) => {
                            const cx = 55 + idx * 80;
                            const cy = 145 - (val / capaciteNominale) * 135;
                            return (
                              <circle
                                key={`pers-${idx}`}
                                cx={cx}
                                cy={cy}
                                r="3"
                                fill="#ffffff"
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                              />
                            );
                          })}

                          {/* Points on Enriched Curve */}
                          {animEnrichedEnrichi.map((val, idx) => {
                            const cx = 55 + idx * 80;
                            const cy = 145 - (val / capaciteNominale) * 135;
                            return (
                              <g key={idx}>
                                <circle cx={cx} cy={cy} r="5" fill="#0d9488" stroke="#ffffff" strokeWidth="2.5" />
                                <text
                                  x={cx}
                                  y={cy - 10}
                                  fontSize="10"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                >
                                  {val.toFixed(1)} MW
                                </text>
                                <text
                                  x={cx}
                                  y="164"
                                  fontSize="10"
                                  fontFamily="sans-serif"
                                  fontWeight="bold"
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

                      {/* Legend */}
                      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-1.5 bg-teal-600 rounded-full" />
                          <span className="text-slate-800 font-semibold text-[11px]">Modèle Enrichi MLP+CNN (51v)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-500" />
                          <span className="text-slate-600 text-[11px]">Modèle Classique (47v)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-500" />
                          <span className="text-amber-700 font-medium text-[11px]">Persistance Intelligente</span>
                        </div>
                      </div>

                      {/* 6 Horizon Cards Bar */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-slate-100 mt-3">
                        {animEnrichedEnrichi.map((enr, i) => {
                          const cls = animEnrichedClassique[i] || 0;
                          const pers = animEnrichedPers[i] || 0;
                          const delta = enr - cls;
                          return (
                            <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center transition-all">
                              <span className="text-[10px] text-slate-500 block font-mono font-medium">t+{i + 1}h</span>
                              <span className="font-mono text-xs font-bold text-teal-800 block mt-0.5">{enr.toFixed(1)} MW</span>
                              <span className="text-[9px] text-slate-500 font-mono block">Base: {cls.toFixed(1)}</span>
                              <span className="text-[9px] text-amber-700 font-mono block">Persist: {pers.toFixed(1)}</span>
                              <span className={`text-[8px] font-mono block mt-0.5 ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Decision interpretation */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">
                          <span>Analyse de la Décision :</span>
                        </p>
                        <p className="mt-0.5 text-slate-600 text-[11px] leading-relaxed">
                          {enrichedResult.interpretation}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3">
                        51v
                      </div>
                      <p className="text-xs font-medium text-slate-700">Calcul multimodal automatique en continu...</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                        Modifiez les variables d'entrée ou téléversez une image pour visualiser la comparaison en temps réel.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 4: Dynamique des Nuages (CNN Mouvement) */}
        {activeTab === 'motion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Paire Temporelle (t-1, t)</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                    CNN 32x32x2
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  Détection du vecteur de vitesse et de translation des nuages pour anticiper l'occultation à <span className="font-mono font-medium">t+1</span>.
                </p>

                {/* Presets */}
                <div className="mt-4">
                  <label className="text-xs font-medium text-slate-700 block mb-2">Paires d'Images Préchargées</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {sampleData?.motion_presets?.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setMotionPreset(p.id);
                          setCustomMotionTm1(null);
                          setCustomMotionT(null);
                          runMotionPrediction(p.id, true);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col items-center gap-2 ${
                          motionPreset === p.id && !customMotionTm1
                            ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <img src={p.img_tm1} alt="t-1" className="w-10 h-10 rounded border border-slate-300 image-rendering-pixelated" />
                          <span className="text-xs text-slate-400 font-mono">→</span>
                          <img src={p.img_t} alt="t" className="w-10 h-10 rounded border border-slate-300 image-rendering-pixelated" />
                        </div>
                        <span className="text-[11px] font-medium text-slate-800 text-center">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom upload avec aperçus */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700">Ou Téléverser les Deux Images</label>
                    {(customMotionTm1 || customMotionT) && (
                      <button
                        onClick={() => {
                          setCustomMotionTm1(null);
                          setCustomMotionT(null);
                          setMotionPreset('incoming_cloud');
                          runMotionPrediction('incoming_cloud', true);
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                      >
                        <span>Effacer</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="border border-slate-200 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 text-center transition">
                      {customMotionTm1 ? (
                        <div className="flex flex-col items-center">
                          <img src={customMotionTm1} alt="t-1" className="w-12 h-12 rounded object-cover border border-teal-400 image-rendering-pixelated bg-slate-900" />
                          <span className="text-[10px] text-teal-700 font-semibold mt-1">Image t-1 chargée</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-[11px] text-slate-600 font-medium">Image à t-1</span>
                          <span className="text-[9px] text-slate-400">Parcourir</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          handleFileUpload(e, (dataUri) => {
                            setCustomMotionTm1(dataUri);
                            if (customMotionT) {
                              runMotionPrediction(null, true, { img_tm1: dataUri, img_t: customMotionT });
                            }
                          });
                        }}
                        className="hidden"
                      />
                    </label>

                    <label className="border border-slate-200 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 text-center transition">
                      {customMotionT ? (
                        <div className="flex flex-col items-center">
                          <img src={customMotionT} alt="t" className="w-12 h-12 rounded object-cover border border-teal-400 image-rendering-pixelated bg-slate-900" />
                          <span className="text-[10px] text-teal-700 font-semibold mt-1">Image t chargée</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-[11px] text-slate-600 font-medium">Image à t</span>
                          <span className="text-[9px] text-slate-400">Parcourir</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          handleFileUpload(e, (dataUri) => {
                            setCustomMotionT(dataUri);
                            if (customMotionTm1) {
                              runMotionPrediction(null, true, { img_tm1: customMotionTm1, img_t: dataUri });
                            }
                          });
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Statut Temps Réel Automatique */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-teal-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Vecteur nuageux en temps réel
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    CNN 32x32x2
                  </span>
                </div>
              </div>
            </div>

            {/* Right Prediction Results (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between min-h-[380px]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Vecteur Nuageux & Prédiction à t+1</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Anticipation ultra-courte de l'occultation</p>
                    </div>
                  </div>

                  {motionResult ? (
                    <div className="mt-6 flex flex-col gap-5">
                      {/* Image flow */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-around">
                        <div className="text-center">
                          <img src={motionResult.img_tm1} alt="t-1" className="w-16 h-16 rounded-lg border border-slate-300 mx-auto image-rendering-pixelated" />
                          <span className="text-[11px] font-mono font-medium text-slate-600 mt-1 block">Instant t-1</span>
                        </div>
                        <div className="flex flex-col items-center text-teal-600">
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">Translation</span>
                        </div>
                        <div className="text-center">
                          <img src={motionResult.img_t} alt="t" className="w-16 h-16 rounded-lg border border-slate-300 mx-auto image-rendering-pixelated" />
                          <span className="text-[11px] font-mono font-medium text-slate-600 mt-1 block">Instant t</span>
                        </div>
                        <div className="flex flex-col items-center text-slate-400">
                          <span className="text-sm font-mono text-slate-400">→</span>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-white border border-teal-200 shadow-xs min-w-[120px]">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase block">Occultation t+1</span>
                          <span className="font-mono text-2xl font-bold text-teal-700 block mt-0.5">
                            {animMotionOcc.toFixed(1)}%
                          </span>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-teal-600 transition-all duration-700 ease-out"
                              style={{ width: `${Math.min(100, Math.max(0, animMotionOcc))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Alert / Risk Card */}
                      <div
                        className={`p-4 rounded-xl border ${
                          motionResult.occultation_tp1_pct >= 60
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : motionResult.occultation_tp1_pct >= 25
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">Niveau de Risque :</span>
                            <span className="text-xs font-mono font-bold uppercase">{motionResult.niveau_risque}</span>
                          </div>
                          <p className="text-xs mt-1">Recommandation Opérationnelle :</p>
                          <p className="text-xs font-medium mt-0.5">{motionResult.action_recommandee}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3">
                        t+1
                      </div>
                      <p className="text-xs font-medium text-slate-700">Aucune séquence dynamique analysée</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                        Chargez une paire temporelle pour estimer la vitesse de déplacement des masses nuageuses.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: Transfert de Site (Jalon 3) */}
        {activeTab === 'transfer' && <Jalon3Results />}

        {/* MODULE 6: Séries Temporelles (Encodeur-Décodeur GRU - Jalon 4) */}
        {activeTab === 'gru' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Séquences Temporelles (48h)</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">
                    Encodeur-Décodeur GRU
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  Modélise la centrale comme un processus séquentiel : 48 pas de temps passés (6 variables) encodés dans un état latent, décodés avec les prévisions météo futures.
                </p>

                <div className="mt-4">
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">Scénarios Séquentiels Réels</label>
                  <div className="space-y-2">
                    {[
                      { id: 'ete_standard', label: 'Cycle Solaire Nominal', sub: 'Journée estivale complète (Ouarzazate)' },
                      { id: 'passage_nuageux', label: 'Transition Ciel Couvert', sub: 'Refroidissement & chute irradiance' },
                      { id: 'tempete_sable', label: 'Tempête de Sable', sub: 'Chute abrupte GHI & encrassement' },
                    ].map((sc) => (
                      <div
                        key={sc.id}
                        onClick={() => {
                          setGruScenario(sc.id);
                          runGruPrediction(sc.id, true);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition ${
                          gruScenario === sc.id
                            ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs block text-slate-900">{sc.label}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{sc.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-800 block mb-1">Architecture Récurrente du Modèle :</span>
                  <div className="font-mono text-[11px] text-slate-600 space-y-1">
                    <div>• Entrée Encodeur : <span className="font-bold text-slate-800">(48, 6)</span></div>
                    <div>• Entrée Décodeur : <span className="font-bold text-slate-800">(6, 5)</span></div>
                    <div>• Vecteur Latent : <span className="font-bold text-slate-800">36 unités GRU</span></div>
                    <div>• Décodage récurrent : <span className="font-bold text-slate-800">TimeDistributed Dense</span></div>
                  </div>
                </div>

                {/* Statut Temps Réel Automatique */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-teal-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Décodage récurrent en temps réel
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    6 pas auto-décodés
                  </span>
                </div>
              </div>
            </div>

            {/* Right Trace Results (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between min-h-[380px]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Décodage Pas-à-Pas des 6 Horizons</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Sortie de l'architecture Encodeur-Décodeur</p>
                    </div>
                  </div>

                  {gruResult ? (
                    <div className="mt-6 flex flex-col gap-4">
                      {/* Responsive Decoded Curve */}
                      <div className="w-full h-48 relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                          {[0, 40, 80, 120].map((y) => (
                            <line key={y} x1="30" y1={y} x2="490" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          ))}

                          <polyline
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            points={animGruMW
                              .map((val, idx) => `${50 + idx * 80},${130 - (val / capaciteNominale) * 120}`)
                              .join(' ')}
                          />

                          {animGruMW.map((val, idx) => {
                            const cx = 50 + idx * 80;
                            const cy = 130 - (val / capaciteNominale) * 120;
                            return (
                              <g key={idx}>
                                <circle cx={cx} cy={cy} r="4.5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                                <text
                                  x={cx}
                                  y={cy - 9}
                                  fontSize="10"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                >
                                  {val.toFixed(1)} MW
                                </text>
                                <text x={cx} y="152" fontSize="10" fontFamily="sans-serif" fill="#64748b" textAnchor="middle">
                                  t+{idx + 1}h
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Decoding trace table */}
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                              <th className="py-1.5 px-2">Horizon</th>
                              <th className="py-1.5 px-2">Puissance Décodée</th>
                              <th className="py-1.5 px-2">Irradiance Future</th>
                              <th className="py-1.5 px-2">Statut Encodeur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gruResult.decodage_etapes.map((st, i) => (
                              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 font-mono text-[11px]">
                                <td className="py-1.5 px-2 font-bold text-slate-800">{st.horizon}</td>
                                <td className="py-1.5 px-2 text-teal-700 font-bold">{animGruMW[i] !== undefined ? animGruMW[i].toFixed(1) : st.valeur_mw} MW</td>
                                <td className="py-1.5 px-2 text-slate-600">{st.irradiance_future} W/m²</td>
                                <td className="py-1.5 px-2 text-slate-500 font-sans text-[10px]">{st.etat_cellule_gru}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-xs font-bold mb-3">
                        GRU
                      </div>
                      <p className="text-xs font-medium text-slate-700">Aucune séquence décodée</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                        Cliquez sur "Décoder la Séquence GRU" pour visualiser la mémoire temporelle récurrente.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 5. Modale Popup avec Frosted Glass (Configuration Rapide) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Configuration de la Centrale &amp; Seuils</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Capacité Nominale de la Centrale (MWc)
                </label>
                <input
                  type="number"
                  step="1"
                  value={capaciteNominale}
                  onChange={(e) => setCapaciteNominale(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Coordonnées GPS & Emplacement
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-600">
                  30.9333° N, 6.9167° W — Centrale Solaire SolarDrâa (Ouarzazate)
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfigModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-medium transition shadow-sm"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tiroir Latéral (Slide-over Drawer) : Télémétrie Système */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full sm:w-[460px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-drawer-in">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Journal de Télémétrie Système</h3>
                <p className="text-[11px] text-slate-500">Supervision en direct des pipelines Keras</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Models health checklist */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-900 block mb-2">Inventaire des Modèles Keras :</span>
                <div className="space-y-1.5 text-[11px]">
                  {health?.models_loaded &&
                    Object.entries(health.models_loaded).map(([name, status]) => (
                      <div key={name} className="flex items-center justify-between font-mono">
                        <span className="text-slate-600">{name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            status ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {status ? 'Opérationnel' : 'Non chargé'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Event Logs Trace */}
              <div>
                <span className="text-xs font-semibold text-slate-900 block mb-2">Journal d'Activité Récent :</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {telemetryLogs.map((log, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-semibold text-teal-700">{log.module}</span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-slate-700 mt-1 font-mono text-[11px]">{log.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-slate-500 text-[11px]">
              Système SolarDrâa • Prêt pour Déploiement Industriel
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


