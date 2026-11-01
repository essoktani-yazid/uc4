import React, { useEffect, useState } from 'react';
const fmt = value => value == null ? 'Non disponible' : Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 4 });
export default function Jalon3Testing() {
  const [counts, setCounts] = useState(null);
  const [index, setIndex] = useState(12);
  const [skyIndex, setSkyIndex] = useState(0);
  const [site, setSite] = useState('B');
  const [upload, setUpload] = useState(null);
  const [production, setProduction] = useState(null);
  const [vision, setVision] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function request(path, body) {
    const response = await fetch(`/api/jalon3/${path}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`Réponse inattendue du serveur (${response.status}). Veuillez redémarrer le backend.`);
    }
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Requête invalide ou modèles indisponibles.');
    return result;
  }
  useEffect(() => { let active = true; request('samples').then(data => { if (active) setCounts(data); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, []);
  async function run(kind) {
    setBusy(true); setError('');
    if (kind === 'production') setProduction(null); else setVision(null);
    try {
      const result = await request(kind, kind === 'production' ? { index: Number(index) } : { index: Number(skyIndex), site, image_base64: upload });
      if (kind === 'production') setProduction(result); else setVision(result);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function readFile(event) {
    setVision(null); setUpload(null); setError('');
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5_000_000) { setError('Image trop volumineuse : maximum 5 Mo.'); return; }
    const reader = new FileReader(); reader.onload = () => setUpload(reader.result); reader.onerror = () => setError('Lecture du fichier impossible.'); reader.readAsDataURL(file);
  }
  return <section className="bg-white border rounded-xl p-5 space-y-5">
    <h3 className="font-bold text-lg">Tester les modèles entraînés</h3>
    <p className="text-sm text-slate-600">Les boutons exécutent les modèles finaux. Les exemples proviennent du test déjà observé ; ils servent à la démonstration, pas à une nouvelle validation indépendante.</p>
    {error && <p role="alert" className="bg-red-50 p-3 text-red-700">{error}</p>}
    {busy && <p role="status">Calcul en cours… Le premier chargement des modèles peut prendre quelques secondes.</p>}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-3"><h4 className="font-semibold">Production sur le site B — 20 MW</h4>
        <label className="text-sm block">Exemple réel (0 à {counts ? counts.production - 1 : '…'})<input type="number" min="0" max={counts ? counts.production - 1 : undefined} value={index} onChange={e => {setIndex(e.target.value); setProduction(null);}} className="border rounded p-2 ml-2 w-24"/></label>
        <button disabled={busy || !counts} onClick={() => run('production')} className="bg-teal-700 text-white rounded px-4 py-2 disabled:opacity-50">Comparer les prévisions</button>
        <p className="text-xs text-slate-500">24 h d'historique et prévisions météo chargées automatiquement. Prétraitement identique au notebook.</p>
        {production && <div className="space-y-3"><p className="text-sm">{production.partition} · première cible : {production.timestamps[0]}</p><div className="overflow-x-auto"><table className="text-xs w-full"><thead><tr>{['Heure', 'Réel MW', 'A direct MW', 'Ajusté B MW', 'Référence MW'].map(t => <th key={t} className="p-2 text-left">{t}</th>)}</tr></thead><tbody>{production.timestamps.map((t, i) => <tr key={t} className="border-t"><td className="p-2">{t}</td>{[production.actualMW[i], production.zeroShotMW[i], production.fineTunedMW[i], production.referenceMW[i]].map((v, j) => <td key={j} className="p-2">{fmt(v)}</td>)}</tr>)}</tbody></table></div>
        <p className="text-sm">MAE locale A direct : {fmt(production.maeZeroShotMW)} MW · ajusté B : {fmt(production.maeFineTunedMW)} MW.</p><p className="text-xs">{production.note}</p><details className="text-xs"><summary>Voir les 24 h de production passée (MW)</summary><p>{production.historyMW.map(fmt).join(' · ')}</p></details></div>}
      </div>
      <div className="space-y-3"><h4 className="font-semibold">CNN : tester une image du ciel</h4>
        <label className="text-sm">Modèle du site <select value={site} onChange={e => {setSite(e.target.value); setSkyIndex(0); setVision(null);}} className="border rounded p-2 ml-2"><option>A</option><option>B</option></select></label>
        <label className="text-sm block">Exemple du test (0 à {counts ? counts.sky[site] - 1 : '…'})<input disabled={Boolean(upload)} type="number" min="0" max={counts ? counts.sky[site] - 1 : undefined} value={skyIndex} onChange={e => {setSkyIndex(e.target.value); setVision(null);}} className="border rounded p-2 ml-2 w-24"/></label>
        <label className="text-sm block">Ou importer une image PNG/JPEG du ciel (5 Mo maximum)<input type="file" accept="image/png,image/jpeg" onChange={readFile} className="block text-xs mt-2"/></label>
        {upload && <button onClick={() => {setUpload(null); setVision(null);}} className="text-sm underline">Revenir aux exemples du test</button>}
        <button disabled={busy || (!counts && !upload)} onClick={() => run('sky')} className="block bg-teal-700 text-white rounded px-4 py-2 disabled:opacity-50">Analyser l'image</button>
        {vision && <div className="space-y-2"><img src={vision.image} alt="Image réellement fournie au CNN après conversion en niveaux de gris" className="w-40 h-40 object-contain border rounded"/><div className="overflow-x-auto"><table className="text-sm w-full"><thead><tr>{['Tâche', 'Prédiction', 'Vérité', 'Erreur absolue'].map(t => <th key={t} className="text-left p-2">{t}</th>)}</tr></thead><tbody>{[['occultation', 'Occultation'], ['coverage', 'Couverture']].map(([key, label]) => <tr key={key}><td className="p-2">{label}</td><td>{fmt(vision.prediction[key])}</td><td>{fmt(vision.truth?.[key])}</td><td>{fmt(vision.absoluteError?.[key])}</td></tr>)}</tbody></table></div><p className="text-xs">Valeurs sans unité entre 0 et 1. {vision.note}</p></div>}
      </div>
    </div>
  </section>;
}
