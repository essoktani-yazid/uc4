import React, { useEffect, useState } from 'react';
import Jalon3Testing from './Jalon3Testing';

const number = (value, digits = 4) => Number(value).toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const percent = value => `${number(Number(value) * 100, 2)} %`;
const names = { A_direct: 'A appliqué directement sur B', B_seul: 'B seul', ajustement_complet: 'Ajustement complet — retenu', une_couche_gelee: 'Première couche gelée', deux_couches_gelees: 'Deux couches gelées' };
function Section({ title, source, children }) {
  return <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-semibold text-slate-900 mb-4">{title}</h3>{children}<p className="text-xs text-slate-500 mt-4">Source : Groupe2_UC4_Jalon3.ipynb · {source}</p></section>;
}
function Table({ headings, rows }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{headings.map(h => <th key={h} className="p-2 border-b text-slate-600">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j} className="p-2 border-b border-slate-100">{value}</td>)}</tr>)}</tbody></table></div>;
}
export default function Jalon3Results() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetch('/api/jalon3/results', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Impossible de charger les résultats du notebook. Vérifiez le backend et les fichiers results.');
      return response.json();
    }).then(setData).catch(err => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <div role="alert" className="p-5 bg-red-50 rounded-xl">{error}<button className="ml-4 underline" onClick={() => setAttempt(attempt + 1)}>Réessayer</button></div>;
  if (!data) return <p role="status">Chargement des résultats du jalon 3…</p>;
  return <div className="space-y-5">
    <Jalon3Testing />
    <Section title="Production : cinq stratégies comparées sur la validation B" source="cellule 8 · validation B, mars 2025">
      <Table headings={['Stratégie', 'Paramètres entraînables', 'Gain à 1 h', 'Gain à 6 h', 'Gain moyen', 'RMSE à 1 h (MW)']} rows={data.strategies.map(r => [names[r.model] || r.model, r.trainableParams, percent(r.gain1h), percent(r.gain6h), percent(r.gainMean), number(r.rmse1hMW, 3)])}/>
      <p className="text-sm mt-3">Choix sur validation : ajustement complet. Gain = 1 − RMSE modèle / RMSE persistance corrigée ; le gain moyen est la moyenne des six gains. Ce n'est pas un taux de prédictions correctes.</p>
    </Section>
    <Section title="Production : performances finales sur le test B" source="cellule 15 · test B, avril–juin 2025 · heures de jour">
      <Table headings={['Horizon', 'RMSE modèle (MW)', 'RMSE persistance (MW)', 'Gain']} rows={data.horizons.map(r => [`${r.Horizon} h`, number(r['RMSE modèle MW'], 3), number(r['RMSE référence MW'], 3), percent(r.Gain)])}/>
      <div className="mt-4 space-y-2" aria-label="Comparaison des RMSE par horizon"><p className="text-xs">Longueur des barres : RMSE en MW · vert : modèle · gris : référence</p>{data.horizons.map(r => <div key={r.Horizon} className="flex items-center gap-3"><span className="text-xs w-10">{r.Horizon} h</span><div className="flex-1 space-y-1"><div className="bg-emerald-600 h-2 rounded" style={{width: `${Number(r['RMSE modèle MW']) / Math.max(...data.horizons.map(h => Number(h['RMSE référence MW']))) * 100}%`}}/><div className="bg-slate-400 h-2 rounded" style={{width: `${Number(r['RMSE référence MW']) / Math.max(...data.horizons.map(h => Number(h['RMSE référence MW']))) * 100}%`}}/></div></div>)}</div>
    </Section>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <Section title="CNN partagé : couverture et occultation" source="cellules 9–10 · validation A, octobre–décembre 2024">
        <p className="text-sm mb-3">Image → convolutions partagées → deux têtes. Perte = MSE occultation + λ × MSE couverture.</p>
        <Table headings={['λ', 'MAE occultation', 'MAE couverture']} rows={data.lambdaStudy.map(r => [r.lambda, number(r.MAEoccultation), Number(r.lambda) === 0 ? 'Non supervisée' : number(r.MAEcoverage)])}/>
        <p className="text-sm mt-3">Sur A, λ = 0 est retenu pour l'occultation. Sa tête couverture n'est pas supervisée et ne constitue pas un estimateur fiable.</p>
      </Section>
      <Section title="Adaptation du CNN sur B : essai simple" source="cellules 12–13 · validation B, mars 2025">
        <Table headings={['Dropout', 'λ', 'MAE occultation', 'MAE couverture']} rows={data.simpleStudy.map(r => [r.dropout, r.lambda, number(r.MAEoccultation_validation_B), number(r.MAEcoverage_validation_B)])}/>
        <p className="text-sm mt-3">Modèle B retenu : dropout 0,2, λ = 0,3, première convolution gelée. Sélection selon la MAE d'occultation sur validation. L'effet du dropout est observé dans cette expérience à une seule graine.</p>
      </Section>
    </div>
    <Section title="Bilan des objectifs et limites" source="cellule 15 · partitions de test A/B">
      <Table headings={['Critère', 'Résultat', 'Objectif', 'Bilan']} rows={data.targets.map(r => [r['Critère'], r['Critère'].includes('Gain') ? percent(r['Résultat']) : number(r['Résultat']), r.Cible, r.Atteinte === 'True' ? 'Atteint sur ce test' : 'Non atteint'])}/>
      <p className="text-sm mt-3">MAE de couverture sur le test B : {number(data.coverageTestB)} (sans unité, cible entre 0 et 1).</p>
      <p className="text-sm mt-3">Les gains de production sont mesurés par rapport à la persistance, et non au modèle A directement appliqué sur B. Les modèles de production et de vision sont sélectionnés séparément. Une seule graine a été utilisée ; les comparaisons entre jalons peuvent employer des protocoles différents.</p>
    </Section>
  </div>;
}
