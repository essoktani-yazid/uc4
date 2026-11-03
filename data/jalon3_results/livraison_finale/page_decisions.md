# Page de décisions — Groupe2, Jalon3

## Résultats et choix

| Critère                 |   Résultat | Cible   | Atteinte   |
|:------------------------|-----------:|:--------|:-----------|
| Gain moyen production B |  0.331875  | >=0,27  | True       |
| MAE occultation A       |  0.0470667 | <=0,10  | True       |
| MAE occultation B       |  0.0780115 | <=0,10  | True       |

Production B : ajustement_complet, choix sur gain moyen de validation. Test : gain1h 0.204449, gain6h 0.405634, gain moyen 0.331875, RMSE1h 1.852499 MW.

CNN A : lambda=0.0. CNN B : dropout_0.2, préentraînement multitâche lambda=0,3 puis adaptation sur B. Le Dropout ne rajoute pas de paramètres. MAE couverture B=0.060809.

## Interprétation

Sur la validation B de la campagne initiale, ajustement complet 0,2664 de gain moyen contre0,2336 pour A direct et0,1616 pour B seul. Le transfert aide dans cette expérience. Cela ne démontre pas que geler une couche est toujours supérieur ni que les couches ont appris une physique universelle.

La comparaison hiver/printemps indique une généralisation à examiner, pas une preuve de cause météorologique. Les distributions de hauteur solaire, nébulosité et profils journaliers sont montrées sur une période commune. Les erreurs horaires et images difficiles ne prouvent pas un brouillard sans annotation.

## Perte et paramètres

L=L_occ+lambda L_couv. Le tronc reçoit grad(L_occ)+lambda grad(L_couv). Lambda=0 supprime la supervision couverture. Un poids élevé peut créer un compromis défavorable à l’occultation. MLP :5350/2278/198 paramètres entraînables selon le gel.

## Déploiement B et troisième site

À J0 sans24h de production passée, le MLP ne peut pas fonctionner tel quel. Une estimation physique provisoire utilisant météo et capacité serait à valider séparément. Après collecte de24h, appliquer A en transfert direct, puis ajuster avec les données locales et une validation chronologique.

Troisième site avec deux semaines : comparer A direct et tête seule ajustée (198 paramètres), puis dégeler progressivement seulement si la validation le justifie. La réduction du nombre de paramètres ne garantit pas à elle seule la généralisation.

## Limites

Test déjà observé dans plusieurs campagnes, donc résultats exploratoires à confirmer sur une période indépendante. Une seule graine42, données simulées, disponibilité opérationnelle des prévisions météo à vérifier. Tous les choix de la présente campagne sont faits sur validation. Le franchissement des cibles ne rétablit pas le caractère aveugle du test.

Assistance IA utilisée pour les ajouts, la mise en forme et les vérifications.