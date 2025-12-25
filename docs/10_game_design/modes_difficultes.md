# modes_difficultes.md — Modes de Jeu et Niveaux de Difficulté

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25

---

## 1) Vue d'ensemble

> **La difficulté gouverne la "surface de décision"** : Plus la difficulté augmente, plus le nombre de leviers et leur granularité augmentent.

| Élément | MVP | V1+ |
|---------|-----|-----|
| Modes | Solo (vs IA) | Multijoueur, Séminaire 200+ |
| Difficultés | Novice, Intermédiaire | Expert, Survie |
| Vitesse | Moyenne (1 tour = 1 trimestre) | Rapide, Lente |

---

## 2) Mode Solo (MVP)

| Attribut | Valeur |
|----------|--------|
| **Input** | Joueur seul, paramètres de session |
| **Output** | Partie complète avec score et debrief |
| **Limites** | Pas de synchronisation multi |
| **Feedback joueur** | Progression libre, sauvegarde par tour |

- Le joueur pilote 1 compagnie parmi 18
- Les 17 autres sont gérées par IA réactive
- Progression à son rythme

**Dépendances simulation** : IA réactive, stockage état/tour, scoring.

---

## 3) Difficultés

### 3.1 Novice — "Découvrir le métier"

#### Objectifs d'apprentissage Novice

| Compétence | Niveau attendu | Comment c'est mesuré |
|------------|---------------|---------------------|
| Lecture cockpit | Identifier les 7 indices | Badge 🎓 Lecteur averti |
| Causalité décision → effet | Comprendre les liens directs | Score progression |
| Gestion budget | Allouer un budget limité | Complétion partie |
| Réaction aux événements | Lire et anticiper les impacts | Réaction pertinente |
| Survie | Terminer sans game over | Badge 🏆 Survivant |

#### Paramètres techniques

| Paramètre | Valeur |
|-----------|--------|
| Leviers | ~12 (macro) |
| Amplitude indices | ±5/tour max |
| Effets retard | Délais ÷ 2 |
| Seuils alertes | Dès 60 |
| Intensité événements | ×0.7 |
| Budget | ×1.2 |
| Poids IS score | 5% |

**Leviers Novice** : Tarif, Franchise, Mix canaux, Pub marque, Recrutement (sinistres/distrib/formation), Stabilité SI, Organisation sinistres, Fraude N1, Réassurance, Provisions.

### 3.2 Intermédiaire — "Piloter une compagnie"

#### Objectifs d'apprentissage Intermédiaire

| Compétence | Niveau attendu | Comment c'est mesuré |
|------------|---------------|---------------------|
| Anticipation effets retard | Planifier à moyen terme | Badge 🔮 Visionnaire |
| Équilibre multi-objectifs | Arbitrer contradictions | Badge ⚖️ Stratège équilibré |
| Interactions produits | Gérer Auto/MRH ensemble | Score équilibre |
| Leviers avancés | Prévention, recours, placements | Activation leviers |
| Optimisation score | Maintenir l'équilibre | Score > 600 |

#### Paramètres techniques

| Paramètre | Valeur |
|-----------|--------|
| Leviers | ~22 |
| Amplitude indices | ±10/tour |
| Effets retard | Standard |
| Seuils alertes | Dès 50 |
| Intensité événements | ×1.0 |
| Budget | ×1.0 |
| Poids IS score | 10% |

**Leviers ajoutés** : Segmentation tarifaire, Commissions, Formation réseau, Marketing direct/activation, Recrutement IT, Rémunération, Automatisation, Qualité données, Recours, Prévention habitat/auto (N1), Placements.

### 3.3 Expert [OUT OF SCOPE MVP]

> Prévu V1 — "Maîtriser la complexité"

**Objectifs d'apprentissage prévus** :
- Optimiser les chaînes causales multi-tours
- Anticiper les vulnérabilités et les mitiger
- Industrialiser les processus (fraude N2/N3, data)
- Gérer les contraintes réglementaires comme opportunités

**Paramètres prévus** : 30+ leviers, Fraude N2/N3, ±15/tour, Poids IS 20%.

### 3.4 Survie [OUT OF SCOPE MVP]

> Prévu V1 — "Gérer les crises"

**Objectifs d'apprentissage prévus** :
- Prioriser sous contrainte de ressources
- Absorber des chocs multiples sans game over
- Prendre des décisions rapides sous pression
- Sacrifier le court terme pour la survie

**Paramètres prévus** : Événements rapprochés, budget ×0.8, IRF/IPQO surpondérés.

---

## 4) Vitesse Moyenne (MVP)

| Attribut | Valeur |
|----------|--------|
| Correspondance | 1 tour = 1 trimestre |
| Durée typique | 12 tours = 3 ans |

**Effets retard** : RH 2T, IT 3-6T, Prévention 4-8T, Réputation 1-3T.

Vitesses Rapide/Lente : [OUT OF SCOPE MVP]

---

## 5) Configuration Session (MVP)

| Paramètre | Options | Défaut |
|-----------|---------|--------|
| Difficulté | Novice, Intermédiaire | Novice |
| Vitesse | Moyenne | Moyenne |
| Durée | 8, 12, 16 tours | 12 |
| Produits | Auto, MRH, Auto+MRH | Auto+MRH |

**Validation** : ≥1 produit obligatoire.

---

## 6) Sélection Compagnie (18)

| Profil | Caractéristiques |
|--------|------------------|
| Généraliste | Indices moyens |
| Leader | IAC/IRF élevés |
| Challenger | Croissance, IPP variable |
| Mutualiste | IS/IRF forts |
| Digital | IMD élevé |
| Spécialiste Auto/MRH | Bonus/malus produit |

**Fiche compagnie** : Nom, traits (3+), indices initiaux (radar), forces/faiblesses.

**Dépendances simulation** : Traits → indices initiaux.

---

## 7) Décisions / Risques / Checklist

### Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| MD-01 | 2 difficultés MVP | Simplification |
| MD-02 | Vitesse unique | Calibration maîtrisée |
| MD-03 | Difficulté = nb leviers | Principe clair |
| MD-04 | Novice : délais ÷2 | Feedback rapide |

### Risques

| ID | Risque | Mitigation |
|----|--------|------------|
| R-05 | Novice trop facile | Playtests |
| R-06 | Inter trop dur | Novice par défaut |
| R-07 | Compagnies déséquilibrées | Équilibrage traits |

### Checklist

- [ ] Gating leviers selon difficulté
- [ ] Modificateurs difficulté (amplitude, délais, seuils)
- [ ] 18 fiches compagnies + traits
- [ ] Interface création session
- [ ] Tutoriel Novice

---

## 8) Dépendances Simulation

| Paramètre | Novice | Intermédiaire |
|-----------|--------|---------------|
| `amplitude_max` | 5 | 10 |
| `delay_factor` | 0.5 | 1.0 |
| `alert_threshold` | 60 | 50 |
| `event_intensity` | 0.7 | 1.0 |
| `budget_factor` | 1.2 | 1.0 |
| `is_weight_score` | 0.05 | 0.10 |

---

*Scope MVP. [OUT OF SCOPE] = V1/V2.*
