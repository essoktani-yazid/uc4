"""Lecture des sorties du notebook final, sans entraînement ni score simulé."""
import csv
import re
from pathlib import Path


def load_results(root: Path):
    results = root / 'data' / 'jalon3_results'
    if not results.exists():
        results = Path(__file__).resolve().parent.parent / 'data' / 'jalon3_results'

    def read(relative):
        with (results / relative).open(encoding='utf-8-sig', newline='') as stream:
            return list(csv.DictReader(stream))

    decisions = (results / 'livraison_finale/page_decisions.md').read_text(encoding='utf-8')
    coverage = re.search(r'MAE couverture B\s*=\s*([0-9.]+)', decisions)
    if coverage is None:
        raise ValueError('MAE couverture B absente du bilan')
    return {
        'coverageTestB': float(coverage.group(1).rstrip('.')),
        'strategies': read('ajout_j3_transfert_validation.csv'),
        'lambdaStudy': read('ajout_j3_multitache_validation.csv'),
        'simpleStudy': read('simple_j3/journal_validation.csv'),
        'targets': read('livraison_finale/bilan_test.csv'),
        'horizons': read('livraison_finale/production_par_horizon.csv'),
        'capacitiesMW': {'A': 50, 'B': 20},
        'notebook': 'Groupe2_UC4_Jalon3.ipynb',
    }
