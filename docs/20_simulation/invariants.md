# invariants.md — Consolidation des Invariants du Moteur

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-27  
**Auteur** : Simulation Engineer

> Ce fichier consolide tous les invariants définis dans la documentation simulation.
> Source : `indices.md`, `leviers_catalogue.md`, `formules.md`

---

## 1) Invariants des Indices (INV-IDX-*)

> Règles fondamentales pour les 7 indices principaux.

```
INV-IDX-01  ∀ Indice ∈ {IAC, IPQO, IERH, IRF, IMD, IS, IPP} : 0 ≤ Indice ≤ 100

INV-IDX-02  Σ Poids_Scoring = 1.0

INV-IDX-03  Si IERH < 30 pendant 3T consécutifs → événement "Crise RH"

INV-IDX-04  Si IRF < 20 → Game Over possible (≈ 105% SCR)

INV-IDX-05  Variation_Max(Indice, tour) ≤ Amplitude_Max(difficulté)
            Novice: ±5, Intermédiaire: ±10, Expert: ±15

INV-IDX-06  IMD ≥ 60 requis pour leviers IA (LEV-IT-05a, LEV-SIN-02-N3)

INV-IDX-07  IS initial = 70 (valeur neutre pour toutes les compagnies)
```

---

## 2) Invariants des Indices Secondaires (INV-IDX-08+)

> Règles pour les 13 indices secondaires.

```
INV-IDX-08  UND_STRICTNESS ↑ → IAC ↓ ET IPP ↑ (retard 2-3T)

INV-IDX-09  ADVERSE_SEL_RISK > 60 pendant 2T → S/P se dégrade

INV-IDX-10  BACKLOG_DAYS > 60 → REG_HEAT ↑ automatiquement

INV-IDX-11  REP_TEMP > 80 → IAC ↓ (-10) + Regulator_Heat ↑

INV-IDX-12  CTRL_MATURITY < 30 → vulnérabilité ×2 événement "Audit"

INV-IDX-13  DISTRIB_CONC_RISK > 70 → vulnérabilité ×3 événement "Rupture apporteur"
```

---

## 3) Invariants Métier IARD (INV-BIZ-*)

> Règles issues de l'audit métier marché français.

```
INV-BIZ-01  Ratio_Combine_Net = (Sinistres_Nets + Frais) / Primes_Nettes × 100
            → Doit toujours être calculable et positif

INV-BIZ-02  Prime_Moyenne ≥ Frequence × Cout_Moyen × 1.10
            → La prime technique doit couvrir la sinistralité attendue + marge 10%

INV-BIZ-03  Provisions_PSAP ≥ Stock_Sinistres × Cout_Moyen × 0.80
            → Provisions doivent couvrir au moins 80% du stock valorisé

INV-BIZ-04  Acquisition_Nette(t) ≤ Portefeuille(t-1) × 0.15
            → Croissance annuelle max 15% (marché français saturé)

INV-BIZ-05  Recours_Recouvres ≤ Sinistres_RC × 0.30
            → Recours ne peuvent excéder 30% des sinistres RC payés

INV-BIZ-06  BACKLOG_DAYS > 90 pendant 2T consécutifs → événement "Médiatisation Retards"
            → Seuil Médiateur de l'Assurance / signalement ACPR

INV-BIZ-07  Si ADVERSE_SEL_RISK > 60 ET UND_STRICTNESS < 40 pendant 3T
            → S/P_brut dégradation automatique +5 points par tour

INV-BIZ-08  Σ effets_relatifs sur même cible dans même tour ≤ ±50%
            → Empêche doublons et explosions de valeurs

INV-BIZ-09  delai_effet(Levier) ≥ 1T si target ∈ {IPP, IRF, IS}
            → Pas d'effets immédiats sur indicateurs financiers structurels

INV-BIZ-10  primes_cedees_rate ≤ 0.40 (40%)
            → Au-delà = modèle fronting, hors scope pédagogique
```

---

## 4) Invariants d'Implémentation (INV-IMPL-*)

> Règles techniques pour la robustesse du moteur.

```
INV-IMPL-01  ∀ Effect: delay ≥ 0 (default = 0 si non spécifié)

INV-IMPL-02  ∀ Effect.type == "relative" : value ∈ [-100, +100] (% raisonnable)

INV-IMPL-03  ∀ Levier.Progressive : Σ cost_cumulatif(Niveau_Max) ≤ Budget_Max_Session

INV-IMPL-04  Ordre de calcul indices (pas de circularité) :
             1. Sources     : IMD, IERH (pas de dépendances)
             2. Dérivés     : CHAN_QUALITY, OPS_SURGE_CAP, UND_STRICTNESS
             3. Agrégés     : ADVERSE_SEL_RISK, REP_TEMP, REG_HEAT, COMPLAINTS_RATE
             4. Terminaux   : IPP, IRF, IS, IAC, IPQO

INV-IMPL-05  ∀ division par variable : max(variable, 1) pour éviter NaN/Infinity

INV-IMPL-06  ∀ Indice avec decay : decay_factor ∈ [0.5, 0.95] (convergence garantie ≤ 10T)
```

---

## 5) Invariants des Formules (INV-FORM-*)

> Règles de cohérence des calculs.

```
INV-FORM-01  contrats(t) ≥ 0 (pas de contrats négatifs)

INV-FORM-02  stock(t) = stock(t-1) + entrees(t) - sorties(t)

INV-FORM-03  sorties(t) ≤ stock(t-1) + entrees(t)

INV-FORM-04  Σ mix_canaux = 100%

INV-FORM-05  fraude_evitee ≤ fraude_baseline × taux_detection_max

INV-FORM-06  ratio_combine = (sinistres + frais) / primes × 100

INV-FORM-07  primes_cedees = primes × taux_cession(niveau_reassurance)

INV-FORM-08  capacite = effectifs × productivite × (1 + bonus)

INV-FORM-09  effet_retard.tour_application = effet_retard.tour_creation + delai

INV-FORM-10  ∀ indice calculé: 0 ≤ indice ≤ 100
```

---

## 6) Invariants des Leviers (INV-L*)

> Règles structurelles des leviers.

```
INV-L1   ∀ Levier: coût <= budget_joueur (refus sinon)

INV-L2   delai(Levier, vitesse) = delai_base × delay_factor(vitesse)

INV-L3   Niveau_Progressif(t) ≥ Niveau_Progressif(t-1)
         (pas de régression de niveau)

INV-L4   Levier.N2 requiert Levier.N1 préalable actif

INV-L5   Σ mix_canaux = 100% (LEV-DIS-01)

INV-L6   Leviers mutuellement exclusifs → au plus 1 actif

INV-L7   Coût_Réassurance = Primes × Taux_Cession(niveau)
```

---

## 7) Invariants de Scoring (INV-SCORE-*)

```
INV-SCORE-01  Σ Pondérations_Scoring = 1.00

INV-SCORE-02  Score_Final ∈ [0, 100]

INV-SCORE-03  Score_Final inclut bonus/malus scénario si applicable
```

---

## 8) Checklist de Validation

> À exécuter lors de chaque modification du moteur.

- [ ] Tous les invariants INV-IDX-* testés
- [ ] Tous les invariants INV-BIZ-* vérifiés (test vectors)
- [ ] Ordre de calcul INV-IMPL-04 respecté
- [ ] Pas de division par zéro (INV-IMPL-05)
- [ ] Leviers progressifs respectent INV-L3 et INV-L4
- [ ] Pondérations scoring somment à 1.0 (INV-SCORE-01)

---

*Dernière consolidation automatique. Référence sources : `20_simulation/indices.md`, `20_simulation/leviers_catalogue.md`, `20_simulation/formules.md`.*
