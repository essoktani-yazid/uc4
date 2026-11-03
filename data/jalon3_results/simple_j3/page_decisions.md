# Décision — réglage simple du CNN

Modèle B retenu : dropout_0.2, lambda=0,3. CNN A initial lambda=0 conservé pour le site A. Ajustement complet du MLP conservé pour la production B.

|   jalon | model       |   dropout |   lambda |   MAEoccultation_validation_B |   MAEcoverage_validation_B |   epochs_A |   epochs_B |   seconds | statut   |
|--------:|:------------|----------:|---------:|------------------------------:|---------------------------:|-----------:|-----------:|----------:|:---------|
|       3 | dropout_0.0 |       0   |      0.3 |                     0.0709473 |                  0.0367198 |         60 |         21 |   58.6339 | réussi   |
|       3 | dropout_0.2 |       0.2 |      0.3 |                     0.0532843 |                  0.0549791 |         60 |         26 |   56.8989 | réussi   |

| mesure                  |   resultat |   cible | atteint   |
|:------------------------|-----------:|--------:|:----------|
| Gain moyen production B |  0.331875  |    0.27 | True      |
| MAE occultation A       |  0.0470667 |    0.1  | True      |
| MAE occultation B       |  0.0780115 |    0.1  | True      |

Un seul changement architectural possible : Dropout(0,2), sans paramètres supplémentaires. Réentraînement des deux têtes sur A puis ajustement de B, première convolution gelée. Choix sur validation B. Couverture du CNN A non supervisée ; couverture B supervisée.

Test déjà connu de plusieurs campagnes. Ces résultats exploratoires ne remplacent pas une confirmation indépendante. Données simulées et une seule graine. Les échecs précédents sont conservés dans les archives du dossier results.

Paramètres du MLP : 5350 sans gel, 2278 avec une couche gelée, 198 avec deux. L = L_occ + lambda L_couv et grad_tronc = grad L_occ + lambda grad L_couv.

À J0, pas de prévision MLP sans ses 24h de production passée : solution physique provisoire à valider, puis transfert direct lorsque cet historique existe. Pour un troisième site avec deux semaines, comparer transfert direct et tête seule ajustée avec validation chronologique, sans garantir la supériorité du gel.