# indices.md — Spécification Technique des Indices

**Version** : 1.1  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-26  
**Auteur** : Simulation Engineer

> **CHANGELOG**
> - **2025-12-26** : Ajout de 13 nouveaux indices IARD (souscription, crise, réclamations, conformité, distribution). Extension de IPQO et IS avec nouvelles variables.

> Ce document complète `docs/00_product/indices.md` (source of truth) avec les détails techniques d'implémentation.

---

## 1) Conventions

### 1.1 Notations

| Symbole | Signification | Exemple |
|---------|---------------|---------|
| `I(t)` | Valeur de l'indice au tour t | `IAC(t) = 72` |
| `Δ` | Variation | `ΔIAC = +5` |
| `w_i` | Poids/pondération | `w1 = 0.25` |
| `T` | Nombre de tours (délai) | `délai = 2T` |
| `clamp(x, a, b)` | Borner x entre a et b | `clamp(105, 0, 100) = 100` |
| `→` | Implique / cause | `IERH↓ → IPQO↓` |

### 1.2 Unités standards

| Grandeur | Unité | Exemple |
|----------|-------|---------|
| Indice | Sans unité, [0-100] | `IAC = 65` |
| Montant | EUR (€) | `Primes = 150_000_000 €` |
| Effectif | ETP | `Effectif = 450 ETP` |
| Taux | % | `S/P = 72%` |
| Délai | Tours (T) | `délai = 2T` |

---

## 2) Définitions et Formules

### 2.1 IAC — Indice Attractivité Commerciale

**Objectif** : Mesurer la capacité à attirer et conserver des clients.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `competitivite_prix` | Position tarifaire vs marché | [0, 100] | - |
| `qualite_service_sinistres` | Qualité perçue gestion sinistres | [0, 100] | - |
| `etendue_garanties` | Niveau de couverture offert | [0, 100] | - |
| `force_distribution` | Couverture et animation réseau | [0, 100] | - |
| `notoriete` | Image de marque, marketing | [0, 100] | - |
| `satisfaction_nps` | Satisfaction client (score NPS normalisé) | [0, 100] | - |

> **Note** : `satisfaction_nps` = enquête client (perception), distincte de `delai_gestion` (opérationnel IPQO)

#### Formule

```
IAC(t) = clamp(
    w1 × competitivite_prix(t) 
  + w2 × qualite_service_sinistres(t)
  + w3 × force_distribution(t) 
  + w4 × etendue_garanties(t)
  + w5 × notoriete(t) 
  + w6 × satisfaction_nps(t),
  0, 100
)

où:
  w1 = 0.25  (compétitivité prix)
  w2 = 0.20  (qualité service sinistres) ← Facteur clé fidélisation IARD
  w3 = 0.20  (distribution)
  w4 = 0.15  (garanties)
  w5 = 0.10  (notoriété)
  w6 = 0.10  (satisfaction NPS)
  Σ w_i = 1.0
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | Selon profil compagnie [45, 70] |
| Inertie | Faible (réactif) |
| Variation max/tour | ±15 (Expert) |

#### Exemple chiffré

```
Situation: Compagnie avec tarifs agressifs (-10%), bonne distribution, marketing moyen

competitivite_prix = 80  (tarifs bas → attractif)
qualite_service_sinistres = 70  (bonne gestion sinistres)
force_distribution = 75
etendue_garanties = 60
notoriete = 50
satisfaction_nps = 65

IAC = 0.25×80 + 0.20×70 + 0.20×75 + 0.15×60 + 0.10×50 + 0.10×65
    = 20 + 14 + 15 + 9 + 5 + 6.5
    = 69.5

Résultat: IAC = 70 (zone verte)
```

---

### 2.2 IPQO — Indice Performance & Qualité Opérationnelle

**Objectif** : Mesurer la qualité de fonctionnement de la compagnie.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `ratio_charge_capacite` | Stock sinistres / Capacité traitement | [0, ∞[ | ratio |
| `delai_gestion` | Délai moyen de clôture | [0, ∞[ | jours |
| `taux_erreur` | % de dossiers avec erreur/reprise | [0, 1] | % |
| `qualite_presta` | Performance SLA prestataires | [0, 100] | - |
| `stabilite_si` | Score stabilité SI (inverse dette tech) | [0, 100] | - |

#### Formule

```
# Facteur de surcharge
surcharge = max(0, (ratio_charge_capacite - 1.0))
surcharge_factor = min(surcharge × 0.3, 0.5)  # plafonné à -50%

# Score de base
base_score = (
    0.25 × qualite_process(delai_gestion, taux_erreur)
  + 0.25 × qualite_presta
  + 0.25 × stabilite_si
  + 0.25 × competence_rh
)

# Formule finale
IPQO(t) = clamp(
    base_score × (1 - surcharge_factor),
    0, 100
)
```

#### Sous-fonction qualite_process

```
qualite_process(delai, erreur) = 
    100 - (delai_penalty + erreur_penalty)

où:
  delai_penalty = min((delai_gestion - 30) × 0.5, 30)
  erreur_penalty = taux_erreur × 100
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | Selon profil compagnie [50, 75] |
| Inertie | Moyenne (2T pour changements significatifs) |
| Seuil surcharge critique | ratio > 1.5 → dégradation accélérée |

#### Exemple chiffré

```
Situation: Compagnie en surcharge modérée

ratio_charge_capacite = 1.2  (20% surcharge)
delai_gestion = 45 jours
taux_erreur = 0.05 (5%)
qualite_presta = 70
stabilite_si = 65
competence_rh = 60

# Calcul surcharge
surcharge = max(0, 1.2 - 1.0) = 0.2
surcharge_factor = min(0.2 × 0.3, 0.5) = 0.06

# Calcul qualité process
delai_penalty = min((45 - 30) × 0.5, 30) = 7.5
erreur_penalty = 0.05 × 100 = 5
qualite_process = 100 - 7.5 - 5 = 87.5

# Score de base
base_score = 0.25×87.5 + 0.25×70 + 0.25×65 + 0.25×60
           = 21.875 + 17.5 + 16.25 + 15
           = 70.625

# IPQO final
IPQO = 70.625 × (1 - 0.06) = 66.4

Résultat: IPQO = 66 (zone verte, mais fragile)
```

---

### 2.3 IERH — Indice Équilibre RH

**Objectif** : Mesurer la santé des ressources humaines.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `effectif_vs_besoin` | Ratio effectif réel / besoin | [0, 2] | ratio |
| `competences` | Niveau de formation moyen | [0, 100] | - |
| `turnover` | Taux de départ annualisé | [0, 1] | % |
| `climat_social` | Score QVT / engagement | [0, 100] | - |

#### Formule

```
# Impact effectif (optimal si ratio = 1)
effet_effectif = 100 - abs(effectif_vs_besoin - 1.0) × 50

# Impact turnover (pénalité si > 10%)
effet_turnover = max(0, 100 - (turnover - 0.10) × 200)

IERH(t) = clamp(
    0.30 × effet_effectif
  + 0.25 × competences
  + 0.25 × effet_turnover
  + 0.20 × climat_social,
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | Selon profil compagnie [55, 70] |
| Inertie | Forte (2-3T pour changements) |
| Seuil crise | IERH < 30 pendant 3T → événement "Crise RH" |

#### Exemple chiffré

```
Situation: Compagnie en sous-effectif avec turnover élevé

effectif_vs_besoin = 0.85 (15% sous-effectif)
competences = 70
turnover = 0.18 (18%)
climat_social = 55

# Calculs intermédiaires
effet_effectif = 100 - |0.85 - 1.0| × 50 = 100 - 7.5 = 92.5
effet_turnover = max(0, 100 - (0.18 - 0.10) × 200) = 100 - 16 = 84

# IERH
IERH = 0.30×92.5 + 0.25×70 + 0.25×84 + 0.20×55
     = 27.75 + 17.5 + 21 + 11
     = 77.25

Résultat: IERH = 77 (zone verte)

# Si turnover monte à 25%:
effet_turnover_degradé = max(0, 100 - (0.25 - 0.10) × 200) = 100 - 30 = 70
IERH_degradé = 0.30×92.5 + 0.25×70 + 0.25×70 + 0.20×55 = 73.75

→ Turnover élevé dégrade IERH progressivement
```

---

### 2.4 IRF — Indice Résilience Financière

**Objectif** : Mesurer la capacité à absorber les chocs (proxy Solvabilité 2).

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `solvency_ratio` | Ratio de couverture SCR (Fonds propres éligibles / SCR) | [0, 3] | ratio |
| `reassurance_level` | Niveau de protection réassurance | [0, 100] | - |
| `provisions_marge` | Marge de prudence provisions (vs best estimate) | [-0.3, 0.3] | ratio |
| `placements_securite` | % placements investment grade | [0, 1] | % |

> **Hypothèse métier** : Le SCR est proxifié par la volatilité des résultats techniques et le niveau de réassurance. 100% SCR = seuil réglementaire minimal.

#### Formule

```
# Score solvabilité Solvabilité 2
# 100% SCR → 50 points, 150% SCR → 75 points, 200% SCR → 100 points
score_solvency = clamp((solvency_ratio - 1.0) × 100 + 50, 0, 100)

# Score provisions (bonus si prudent, malus si agressif)
score_provisions = 50 + provisions_marge × 100  # [-30%, +30%] → [20, 80]

IRF(t) = clamp(
    0.35 × score_solvency
  + 0.30 × reassurance_level
  + 0.20 × score_provisions
  + 0.15 × (placements_securite × 100),
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | Selon profil compagnie [40, 80] |
| Inertie | Moyenne |
| Seuil alerte | IRF < 30 → "Solvabilité dégradée" (≈ 120% SCR) |
| Seuil critique | IRF < 20 → "Solvabilité critique" (≈ 105% SCR, game over possible) |

#### Exemple chiffré

```
Situation: Compagnie bien protégée

solvency_ratio = 1.50 (150% du SCR requis)
reassurance_level = 70 (protection standard-fort)
provisions_marge = +0.10 (10% de marge prudente sur best estimate)
placements_securite = 0.70 (70% placements investment grade)

# Calculs
score_solvency = (1.50 - 1.0) × 100 + 50 = 50 + 50 = 100 (plafonné si > 100)
score_provisions = 50 + 0.10 × 100 = 60

# IRF
IRF = 0.35×100 + 0.30×70 + 0.20×60 + 0.15×70
    = 35 + 21 + 12 + 10.5
    = 78.5

Résultat: IRF = 79 (bonne résilience, SCR confortable)
```

---

### 2.5 IMD — Indice Maturité Data

**Objectif** : Mesurer la capacité data et son exploitation.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `qualite_donnees` | Score qualité des données | [0, 100] | - |
| `gouvernance` | Maturité gouvernance data | [0, 100] | - |
| `outillage` | Niveau d'outillage/automatisation | [0, 100] | - |
| `use_cases_ia` | Nb use cases IA déployés | [0, 10] | nb |
| `dette_technique` | Niveau de dette IT | [0, 100] | - |

#### Formule

```
# Bonus use cases IA (plafonné)
bonus_ia = min(use_cases_ia × 5, 20)

# Malus dette technique
malus_dette = dette_technique × 0.3

IMD(t) = clamp(
    0.30 × qualite_donnees
  + 0.25 × gouvernance
  + 0.25 × outillage
  + bonus_ia
  - malus_dette,
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | Selon profil compagnie [30, 60] |
| Inertie | Très forte (3-6T) |
| Seuil prérequis IA | IMD ≥ 60 pour leviers IA avancés |

#### Exemple chiffré

```
Situation: Compagnie en transformation digitale

qualite_donnees = 55
gouvernance = 45
outillage = 50
use_cases_ia = 2
dette_technique = 40

# Calculs
bonus_ia = min(2 × 5, 20) = 10
malus_dette = 40 × 0.3 = 12

# IMD
IMD = 0.30×55 + 0.25×45 + 0.25×50 + 10 - 12
    = 16.5 + 11.25 + 12.5 + 10 - 12
    = 38.25

Résultat: IMD = 38 (maturité faible → IA avancée non accessible)
```

---

### 2.6 IS — Indice de Sincérité

**Objectif** : Mesurer l'éthique et la prudence des décisions.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `adequation_provisions` | Provisions vs sinistres réels | [-1, 1] | ratio |
| `court_termisme_score` | Détection de comportements court-termistes | [0, 100] | - |
| `conformite` | Score conformité réglementaire | [0, 100] | - |

#### Formule

```
# Pénalité provisions (sous-provisionnement pénalisé plus fort)
penalite_provisions = 
    if adequation_provisions < 0:
        abs(adequation_provisions) × 30  # sous-provisionnement
    else:
        adequation_provisions × 10       # sur-provisionnement (moins pénalisé)

# Pénalité court-termisme
penalite_ct = (100 - court_termisme_score) × 0.2

IS(t) = clamp(
    IS(t-1) 
  - penalite_provisions 
  - penalite_ct 
  + bonus_prudence,
  0, 100
)

où bonus_prudence = 
    if adequation_provisions > 0.05: +3
    else: 0
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | 70 (neutre) |
| Inertie | Moyenne |
| Seuil événement | IS < 40 → risque "Contrôle/Sanction" |

#### Exemple chiffré

```
Situation: Compagnie avec provisions agressives

IS(t-1) = 70
adequation_provisions = -0.15 (15% sous-provisionnement)
court_termisme_score = 60 (comportements détectés)
bonus_prudence = 0

# Calculs
penalite_provisions = |-0.15| × 30 = 4.5
penalite_ct = (100 - 60) × 0.2 = 8

# IS
IS = 70 - 4.5 - 8 + 0 = 57.5

Résultat: IS = 58 (en dégradation, attention au seuil 40)
```

---

### 2.7 IPP — Indice Performance P&L

**Objectif** : Mesurer la performance économique globale.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `primes` | Primes acquises | [0, ∞[ | € |
| `sinistres` | Charge sinistres | [0, ∞[ | € |
| `frais` | Total frais (acquisition + gestion) | [0, ∞[ | € |
| `reassurance_solde` | Primes cédées - Sinistres récupérés | ]-∞, ∞[ | € |
| `produits_financiers` | Revenus des placements | [0, ∞[ | € |
| `resultat_marche` | Résultat moyen du marché | ]-∞, ∞[ | € |

#### Formule

```
# Résultat technique brut
resultat_technique_brut = primes_brutes - sinistres_bruts - frais

# Résultat technique net (après réassurance)
resultat_technique_net = primes_nettes - sinistres_nets - frais
# où: primes_nettes = primes_brutes - primes_cedees
#     sinistres_nets = sinistres_bruts - recup_reassurance

# Résultat total
resultat_total = resultat_technique_net + produits_financiers

# Ratio combiné brut (hors réassurance)
ratio_combine_brut = (sinistres_bruts + frais) / primes_brutes × 100

# Ratio combiné net (après réassurance) ← Indicateur clé
ratio_combine_net = (sinistres_nets + frais) / primes_nettes × 100

# Performance relative au marché
performance_relative = (resultat_total - resultat_marche) / abs(resultat_marche)

# Normalisation en indice
IPP(t) = clamp(
    50 + performance_relative × 25 + (100 - ratio_combine_net) × 0.5,
    0, 100
)
```

> **Hypothèse métier** : Ratio S/P cible = 65-75%, Frais = 25-30%, Marge technique = 3-8%

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | Selon profil compagnie [45, 65] |
| Inertie | Faible (réactif) |
| Objectif ratio combiné net | < 100% (équilibre technique) |
| Zone excellence | < 95% (marge rentable) |

#### Exemple chiffré

```
Situation: Compagnie avec bonne rentabilité

primes_brutes = 100_000_000 €
primes_cedees = 10_000_000 € (10% cession réassurance)
primes_nettes = 90_000_000 €
sinistres_bruts = 68_000_000 €
recup_reassurance = 8_000_000 €
sinistres_nets = 60_000_000 €
frais = 25_000_000 €
produits_financiers = 3_000_000 €
resultat_marche = 4_000_000 €

# Calculs
resultat_technique_net = 90 - 60 - 25 = 5 M€
resultat_total = 5 + 3 = 8 M€
ratio_combine_brut = (68 + 25) / 100 × 100 = 93%
ratio_combine_net = (60 + 25) / 90 × 100 = 94.4%
performance_relative = (8 - 4) / 4 = 1.0 (+100%)

# IPP
IPP = 50 + 1.0×25 + (100 - 94.4)×0.5
    = 50 + 25 + 2.8
    = 77.8

Résultat: IPP = 78 (très bonne performance)
```

---

## 3) Matrice des Pondérations Scoring

### 3.1 Pondérations par mode/difficulté

| Indice | Standard | Survie | Novice | Expert |
|--------|----------|--------|--------|--------|
| IAC | 15% | 10% | 20% | 12% |
| IPQO | 20% | 25% | 15% | 22% |
| IERH | 10% | 15% | 10% | 10% |
| IRF | 15% | 30% | 10% | 15% |
| IMD | 10% | 5% | 10% | 12% |
| IS | 10% | 5% | 5% | 20% |
| IPP | 20% | 10% | 30% | 9% |
| **Total** | 100% | 100% | 100% | 100% |

### 3.2 Formule scoring final

```
Score = Σ (Indice_i × Poids_i) + Bonus_Objectifs_Scénario

Contrainte: Σ Poids_i = 1.0 (INV-SCORE-01)
```

---

## 4) Invariants des Indices

```
INV-IDX-01  ∀ Indice ∈ {IAC, IPQO, IERH, IRF, IMD, IS, IPP} : 0 ≤ Indice ≤ 100

INV-IDX-02  Σ Poids_Scoring = 1.0

INV-IDX-03  Si IERH < 30 pendant 3T consécutifs → événement "Crise RH"

INV-IDX-04  Si IRF < 20 → Game Over possible (≈ 105% SCR)

INV-IDX-05  Variation_Max(Indice, tour) ≤ Amplitude_Max(difficulté)
            Novice: ±5, Intermédiaire: ±10, Expert: ±15

INV-IDX-06  IMD ≥ 60 requis pour leviers IA (LEV-IT-05, LEV-SIN-02-N3)

INV-IDX-07  IS initial = 70 (valeur neutre pour toutes les compagnies)
```

---

## 5) Invariants Métier Supplémentaires

> Invariants issus de l'audit métier IARD (marché français)

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
```

---

## 6) Hypothèses Métier Explicites

| Code | Hypothèse | Source |
|------|-----------|--------|
| H1 | Marché français IARD particuliers (Auto + MRH) | PRD scope MVP |
| H2 | S/P cible 65-75%, Frais 25-30%, Marge 3-8% | Benchmarks FFA |
| H3 | Réassurance proportionnelle simplifiée | Modèle pédagogique |
| H4 | IRF ≈ proxy couverture SCR (Solvabilité 2) | Simplification S2 |
| H5 | Turnover baseline 10-12%, coût ETP 60-80k€/an | Marché RH assurance |
| H6 | Fraude détectable 5-7% prestations (source ALFA) | Études sectorielles |
| H7 | Fréquence MRH 4-6%, Auto 6-10%, Sévérité MRH 3-4k€, Auto 2-3k€ | Statistiques marché |

---

## 7) Nouveaux Indices IARD Complets

> Indices ajoutés pour couvrir les 5 gaps IARD identifiés.

### 7.1 UND_STRICTNESS — Posture de Souscription

**Objectif** : Mesurer le niveau de sélectivité dans l'acceptation des risques.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `posture_souscription` | Choix du joueur (permissif → sélectif) | [0, 100] | - |
| `regles_selection_maturite` | Niveau des règles de scoring | [0, 100] | - |

#### Formule

```
UND_STRICTNESS(t) = clamp(
    0.50 × posture_souscription
  + 0.30 × regles_selection_maturite
  + 0.20 × IMD × 0.5,  // bonus si data-driven
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 (tout accepter) |
| Maximum | 100 (très sélectif) |
| Valeur initiale | Selon profil compagnie [40, 60] |
| Effet sur IAC | UND_STRICTNESS ↑ → IAC ↓ (moins de volume) |
| Effet sur IPP | UND_STRICTNESS ↑ → IPP ↑ (meilleure qualité, retard 2-3T) |

---

### 7.2 ADVERSE_SEL_RISK — Risque d'Anti-sélection

**Objectif** : Mesurer la dérive qualitative du portefeuille (attraction de mauvais risques).

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `delta_prix_marche` | Écart de tarif vs marché | [-30, +30] | % |
| `UND_STRICTNESS` | Posture de souscription | [0, 100] | - |
| `CHAN_QUALITY` | Qualité portefeuille canaux | [0, 100] | - |

#### Formule

```
# Base = exposition brute
base_risk = max(0, -delta_prix_marche × 2)  // prix bas → risque

# Modulation par sélection
modulation = (100 - UND_STRICTNESS) × 0.3 + (100 - CHAN_QUALITY) × 0.2

ADVERSE_SEL_RISK(t) = clamp(
    base_risk + modulation,
    0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | 30 (neutre) |
| Seuil alerte | > 60 → "Portefeuille en dérive" |
| Effet retard sur IPP | 2-3T (matérialisation S/P) |

---

### 7.3 OPS_SURGE_CAP — Capacité d'Absorption Afflux

**Objectif** : Mesurer la capacité à absorber un pic exceptionnel (CatNat, crise).

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `plan_crise_level` | Niveau plan de crise | [0, 3] | niveau |
| `effectif_reserve` | % effectif mobilisable en crise | [0, 0.3] | % |
| `partenaires_crise` | Accords prestataires de crise | [0, 100] | - |
| `IERH` | Équilibre RH (résilience équipes) | [0, 100] | - |

#### Formule

```
OPS_SURGE_CAP(t) = clamp(
    plan_crise_level × 20
  + effectif_reserve × 100
  + partenaires_crise × 0.2
  + IERH × 0.1,
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | 30 (faible préparation) |
| Utilisation | Mitigation lors événement CatNat |

---

### 7.4 BACKLOG_DAYS — Retard de Traitement Sinistres

**Objectif** : Mesurer le retard moyen dans le traitement des dossiers sinistres.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `stock_sinistres` | Nombre dossiers ouverts | [0, ∞[ | nb |
| `capacite_traitement` | Dossiers traitables/tour | [0, ∞[ | nb |
| `OPS_SURGE_CAP` | Capacité absorption afflux | [0, 100] | - |

#### Formule

```
# Flux net de backlog
flux_net = max(0, stock_sinistres - capacite_traitement)

# Atténuation si surge capacity
surge_factor = OPS_SURGE_CAP / 100

# Calcul en jours (1 tour trimestre = ~65 jours ouvrés)
BACKLOG_DAYS(t) = BACKLOG_DAYS(t-1) × 0.7  // decay naturel
                + flux_net / capacite_traitement × 30 × (1 - surge_factor × 0.5)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | ∞ (non borné) |
| Valeur initiale | 15 jours (normal) |
| Seuil alerte | > 30 jours → dégradation satisfaction |
| Seuil crise | > 60 jours → Regulator_Heat ↑, IAC ↓ |

---

### 7.5 REP_TEMP — Température Réputationnelle

**Objectif** : Mesurer la pression médiatique et la confiance publique.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `BACKLOG_DAYS` | Retard traitement | [0, ∞[ | jours |
| `COMPLAINTS_RATE` | Taux réclamations | [0, ∞[ | ‰ |
| `evenement_mediatique` | Événement négatif récent | [0, 1] | binaire |
| `communication_crise` | Qualité communication | [0, 100] | - |

#### Formule

```
# Pression = facteurs négatifs
pression = min(BACKLOG_DAYS, 100) × 0.3
         + min(COMPLAINTS_RATE × 10, 50)
         + evenement_mediatique × 30

# Atténuation par communication
attenuation = communication_crise × 0.3

REP_TEMP(t) = clamp(
    REP_TEMP(t-1) × 0.8  // decay naturel
  + pression - attenuation,
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 (sérénité) |
| Maximum | 100 (crise majeure) |
| Valeur initiale | 20 (normal) |
| Seuil alerte | > 50 → impact IAC |
| Seuil crise | > 80 → Regulator_Heat ↑↑ |

---

### 7.6 REG_HEAT — Intensité Relation Régulateur

**Objectif** : Mesurer la tension avec le régulateur (ACPR) et l'État.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `BACKLOG_DAYS` | Retard traitement | [0, ∞[ | jours |
| `REP_TEMP` | Pression réputationnelle | [0, 100] | - |
| `CTRL_MATURITY` | Maturité dispositif contrôle | [0, 100] | - |
| `IS` | Indice de sincérité | [0, 100] | - |
| `plaintes_collectives` | Signalements collectifs | [0, ∞[ | nb |

#### Formule

```
# Facteurs d'alerte régulateur
facteurs_alerte = max(0, BACKLOG_DAYS - 30) × 0.5
                + max(0, REP_TEMP - 50) × 0.3
                + plaintes_collectives × 5

# Protection par maturité contrôle et sincérité
protection = (CTRL_MATURITY + IS) / 2 × 0.3

REG_HEAT(t) = clamp(
    REG_HEAT(t-1) × 0.9  // decay lent
  + facteurs_alerte - protection,
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | 10 (relation normale) |
| Seuil alerte | > 40 → "Attention régulateur" |
| Seuil injonction | > 70 → événement "Audit/Injonction" probable |

---

### 7.7 COMPLAINTS_RATE — Taux de Réclamations

**Objectif** : Mesurer le volume de réclamations clients (pour 1000 sinistres).

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `politique_indemnisation` | Généreuse/Standard/Restrictive | [0, 100] | - |
| `BACKLOG_DAYS` | Retard traitement | [0, ∞[ | jours |
| `service_client_level` | Niveau service client | [0, 100] | - |
| `sinistres_traites` | Volume sinistres traités | [0, ∞[ | nb |

#### Formule

```
# Baseline réclamations
baseline = 5  // 5‰ baseline standard

# Facteurs d'aggravation
aggravation = max(0, 100 - politique_indemnisation) × 0.05
            + max(0, BACKLOG_DAYS - 20) × 0.1

# Facteurs de réduction
reduction = service_client_level × 0.03

COMPLAINTS_RATE(t) = max(1, baseline + aggravation - reduction)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 1‰ |
| Maximum | ∞ |
| Valeur initiale | 5‰ (marché français) |
| Seuil alerte | > 10‰ → REP_TEMP ↑ |

---

### 7.8 LITIGATION_RISK — Risque de Contentieux

**Objectif** : Mesurer l'exposition au risque de procédures judiciaires.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `COMPLAINTS_RATE` | Taux réclamations | [0, ∞[ | ‰ |
| `politique_indemnisation` | Restrictive = risque | [0, 100] | - |
| `mediation_level` | Niveau médiation | [0, 100] | - |

#### Formule

```
LITIGATION_RISK(t) = clamp(
    COMPLAINTS_RATE × 3
  + (100 - politique_indemnisation) × 0.2
  - mediation_level × 0.3,
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | 20 |
| Effet | Déclenche LEGAL_COST_RATIO ↑ |

---

### 7.9 LEGAL_COST_RATIO — Ratio Coûts Juridiques

**Objectif** : Mesurer le poids des frais juridiques dans les primes.

#### Formule

```
# Coûts = contentieux × coût moyen
couts_juridiques = litigation_count × cout_moyen_contentieux

LEGAL_COST_RATIO(t) = couts_juridiques / primes × 100
```

| Paramètre | Valeur |
|-----------|--------|
| Baseline | 0.2-0.5% des primes |
| Seuil alerte | > 1% |
| Coût moyen contentieux | 15,000€ (estimation) |

---

### 7.10 CTRL_MATURITY — Maturité Dispositif de Contrôle

**Objectif** : Mesurer la robustesse du dispositif de contrôle interne et conformité.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `controle_interne_level` | Niveau contrôle interne | [0, 3] | niveau |
| `audit_delegataires_level` | Niveau audit délégataires | [0, 3] | niveau |
| `effectif_conformite` | ETP dédiés conformité | [0, ∞[ | ETP |

#### Formule

```
CTRL_MATURITY(t) = clamp(
    controle_interne_level × 25
  + audit_delegataires_level × 15
  + min(effectif_conformite / 10 × 20, 30),
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | 40 (baseline marché) |
| Effet | Réduit REG_HEAT, améliore IS |

---

### 7.11 FRAUD_PROC_ROB — Robustesse Anti-Fraude Procédurale

**Objectif** : Mesurer la sécurisation des processus internes contre la fraude organisée.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `fraud_proc_level` | Niveau anti-fraude procédurale | [0, 3] | niveau |
| `audit_delegataires_level` | Audit des partenaires | [0, 3] | niveau |
| `CTRL_MATURITY` | Maturité contrôle | [0, 100] | - |

#### Formule

```
FRAUD_PROC_ROB(t) = clamp(
    fraud_proc_level × 30
  + audit_delegataires_level × 15
  + CTRL_MATURITY × 0.2,
  0, 100
)
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | 30 |
| Effet | Mitigation événement "Pic fraude post-CatNat" |

---

### 7.12 CHAN_QUALITY — Qualité Portefeuille par Canal

**Objectif** : Mesurer la performance technique (S/P) par canal de distribution.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `SP_canal_digital` | S/P canal digital | [0, 2] | ratio |
| `SP_canal_agents` | S/P canal agents | [0, 2] | ratio |
| `SP_canal_courtiers` | S/P canal courtiers | [0, 2] | ratio |
| `SP_canal_affinitaires` | S/P canal affinitaires | [0, 2] | ratio |
| `mix_canaux` | Répartition canaux | % | - |

#### Formule

```
# Score pondéré par canal (inversé : S/P bas = qualité haute)
score_canal(sp) = max(0, 100 - sp × 100)

CHAN_QUALITY(t) = Σ(mix_canal × score_canal(SP_canal)) / 100
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | 60 (moyenne) |
| Effet | Améliore IPP, réduit ADVERSE_SEL_RISK |

---

### 7.13 DISTRIB_CONC_RISK — Risque Concentration Distributeurs

**Objectif** : Mesurer la dépendance aux gros apporteurs.

#### Variables

| Variable | Description | Plage | Unité |
|----------|-------------|-------|-------|
| `part_top1` | Part CA du 1er apporteur | [0, 1] | % |
| `part_top3` | Part CA des 3 premiers | [0, 1] | % |
| `nb_apporteurs` | Nombre d'apporteurs actifs | [0, ∞[ | nb |

#### Formule

```
# Indice de concentration (style Herfindahl simplifié)
concentration = part_top1 × 0.5 + part_top3 × 0.3 + max(0, 1 - nb_apporteurs/20) × 0.2

DISTRIB_CONC_RISK(t) = concentration × 100
```

#### Bornes et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Minimum | 0 |
| Maximum | 100 |
| Valeur initiale | Selon profil compagnie [20, 70] |
| Seuil alerte | > 50% → "Dépendance élevée" |
| Seuil critique | > 70% → vulnérable rupture |

---

## 8) Invariants des Nouveaux Indices

```
INV-IDX-08  UND_STRICTNESS ↑ → IAC ↓ ET IPP ↑ (retard 2-3T)

INV-IDX-09  ADVERSE_SEL_RISK > 60 pendant 2T → S/P se dégrade

INV-IDX-10  BACKLOG_DAYS > 60 → REG_HEAT ↑ automatiquement

INV-IDX-11  REP_TEMP > 80 → IAC ↓ (-10) + Regulator_Heat ↑

INV-IDX-12  CTRL_MATURITY < 30 → vulnérabilité ×2 événement "Audit"

INV-IDX-13  DISTRIB_CONC_RISK > 70 → vulnérabilité ×3 événement "Rupture apporteur"
```

---

## 9) Checklist Implémentation

- [ ] Toutes les formules retournent des valeurs dans [0, 100] (sauf BACKLOG_DAYS, LEGAL_COST_RATIO)
- [ ] Les pondérations somment à 1.0
- [ ] Les effets retard sont correctement appliqués
- [ ] Les invariants sont vérifiés à chaque calcul
- [ ] Les seuils déclenchent les alertes appropriées
- [ ] Les exemples chiffrés correspondent aux formules
- [ ] Les 13 nouveaux indices sont intégrés au cockpit (selon difficulté)

