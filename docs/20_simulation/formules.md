# formules.md — Formules de Calcul du Moteur

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Auteur** : Simulation Engineer

---

## 1) Conventions

### 1.1 Notation mathématique

| Symbole | Signification |
|---------|---------------|
| `t` | Tour courant |
| `t-n` | n tours dans le passé |
| `clamp(x, a, b)` | `max(a, min(x, b))` |
| `Σ` | Somme |
| `∏` | Produit |
| `Δx` | Variation de x |
| `x(t)` | Valeur de x au tour t |
| `x_base` | Valeur de base/référence |

### 1.2 Unités et types

| Type | Unité | Exemple |
|------|-------|---------|
| Montant | EUR (€) | `primes = 50_000_000` |
| Taux | Pourcentage [0, 100] | `S/P = 72` |
| Ratio | Sans unité [0, 1+] | `ratio_charge = 1.2` |
| Indice | Sans unité [0, 100] | `IAC = 65` |
| Effectif | ETP | `effectifs = 350` |
| Volume | Contrats ou sinistres | `stock = 15000` |

---

## 2) Formules Portefeuille

### 2.1 Évolution du nombre de contrats

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `contrats(t)` | Nb contrats au tour t | nb | [0, ∞[ |
| `acquisition(t)` | Nouveaux contrats | nb | [0, ∞[ |
| `churn(t)` | Résiliations | nb | [0, contrats(t-1)] |

**Formule**

```
contrats(t) = contrats(t-1) + acquisition(t) - churn(t)
```

**Sous-formules**

```
# Taux d'acquisition (dépend de l'attractivité)
taux_acquisition = taux_base × (1 + (IAC - 50) / 100)

acquisition(t) = marché_potentiel × taux_acquisition × mix_distribution_effect

# Taux de churn (dépend de la satisfaction et du prix)
taux_churn_base = 0.15  # 15% annualisé, à diviser par période
churn_factor = 1 + (50 - satisfaction) / 50 + prix_delta × 0.02

churn(t) = contrats(t-1) × (taux_churn_base / periode_par_an) × churn_factor
```

**Exemple chiffré**

```
Situation: Compagnie avec 100,000 contrats, IAC=70, prix compétitifs

contrats(t-1) = 100_000
IAC = 70
marché_potentiel = 500_000
taux_base = 0.02
satisfaction = 65
prix_delta = -5% (compétitif)

# Acquisition
taux_acquisition = 0.02 × (1 + (70 - 50) / 100) = 0.02 × 1.2 = 0.024
acquisition = 500_000 × 0.024 × 1.0 = 12_000

# Churn (par trimestre, periode_par_an = 4)
churn_factor = 1 + (50 - 65) / 50 + (-5) × 0.02 = 1 - 0.3 - 0.1 = 0.6
churn = 100_000 × (0.15 / 4) × 0.6 = 100_000 × 0.0375 × 0.6 = 2_250

# Résultat
contrats(t) = 100_000 + 12_000 - 2_250 = 109_750

Croissance nette: +9,750 contrats (+9.75%)
```

---

### 2.2 Primes collectées

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `primes(t)` | Primes collectées au tour t | € | [0, ∞[ |
| `prime_moyenne` | Prime moyenne par contrat | € | [0, ∞[ |
| `delta_prix` | Écart tarifaire vs marché | % | [-30, +30] |

**Formule**

```
prime_moyenne(t) = prime_marche × (1 + delta_prix / 100)

primes(t) = contrats(t) × prime_moyenne(t) / periode_par_an
```

**Exemple chiffré**

```
contrats = 109_750
prime_marche = 600 €
delta_prix = -5% (tarifs bas)
periode_par_an = 4 (trimestre)

prime_moyenne = 600 × (1 - 0.05) = 570 €
primes = 109_750 × 570 / 4 = 15_639_375 € par trimestre

Annualisé: ~62.5 M€
```

---

### 2.3 Sinistralité

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `frequence` | Nb sinistres / nb contrats | ratio | [0, 1] |
| `severite` | Coût moyen sinistre | € | [0, ∞[ |
| `sinistres_new` | Nouveaux sinistres du tour | nb | [0, ∞[ |
| `sinistres_cout` | Coût total sinistres réglés | € | [0, ∞[ |

**Formule**

```
# Fréquence ajustée (base + événements + prévention)
frequence(t) = frequence_base 
             × (1 + impact_evenements) 
             × (1 - effet_prevention)

# Nouveaux sinistres
sinistres_new(t) = contrats(t) × frequence(t) / periode_par_an

# Sévérité ajustée (base + inflation + qualité gestion)
severite(t) = severite_base 
            × (1 + inflation) 
            × (1 - effet_reseau_agree)
            × (1 + (100 - IPQO) / 200)  # qualité impacte coût

# Coût des sinistres clôturés
sinistres_cout(t) = sinistres_clotures(t) × severite(t)
```

**Exemple chiffré (Auto)**

```
Situation: Portefeuille Auto standard

contrats = 80_000
frequence_base = 0.08 (8% de sinistralité annuelle)
impact_evenements = 0.05 (+5% suite à événement climatique)
effet_prevention = 0.03 (-3% grâce à prévention N1)
severite_base = 2_500 €
inflation = 0.02 (+2%)
effet_reseau_agree = 0.05 (-5% coût via réseau)
IPQO = 65
periode_par_an = 4

# Fréquence
frequence = 0.08 × (1 + 0.05) × (1 - 0.03) = 0.08 × 1.05 × 0.97 = 0.0815

# Nouveaux sinistres par trimestre
sinistres_new = 80_000 × 0.0815 / 4 = 1_630 sinistres

# Sévérité
severite = 2_500 × (1.02) × (0.95) × (1 + 35/200)
         = 2_500 × 1.02 × 0.95 × 1.175
         = 2_846 €

# Si 1_500 sinistres clôturés ce tour
sinistres_cout = 1_500 × 2_846 = 4_269_000 €
```

---

### 2.4 Stock de sinistres

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `stock(t)` | Sinistres ouverts | nb | [0, ∞[ |
| `entrees` | Nouveaux sinistres | nb | [0, ∞[ |
| `sorties` | Sinistres clôturés | nb | [0, stock(t-1)] |

**Formule**

```
stock(t) = stock(t-1) + entrees(t) - sorties(t)

# Capacité de traitement
capacite = effectifs_sinistres × productivite_etp × (1 + bonus_automatisation)

# Sinistres clôturés = min(stock + entrées, capacité)
sorties(t) = min(stock(t-1) + entrees(t), capacite)

# Contrainte: si stock > capacité × seuil_surcharge → IPQO dégradé
```

**Exemple chiffré**

```
stock(t-1) = 12_000
entrees = 1_630
effectifs_sinistres = 150 ETP
productivite_etp = 15 dossiers/ETP/trimestre
bonus_automatisation = 0.10 (+10% IMD élevé)

capacite = 150 × 15 × 1.10 = 2_475 dossiers/trimestre

sorties = min(12_000 + 1_630, 2_475) = 2_475

stock(t) = 12_000 + 1_630 - 2_475 = 11_155

Le stock diminue de 845 dossiers (bonne tendance)
```

---

## 3) Formules Financières

### 3.1 P&L simplifié

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `resultat_technique` | Résultat d'exploitation assurance | € | ]-∞, ∞[ |
| `resultat_net` | Résultat après produits financiers | € | ]-∞, ∞[ |
| `ratio_combine` | (S + F) / P | % | [0, ∞[ |

**Formule**

```
# Composantes
primes_acquises = primes_collectees × coefficient_acquisition
sinistres_charges = sinistres_payes + delta_provisions
frais_acquisition = primes × taux_acquisition × (1 + commissions_delta)
frais_gestion = effectifs × cout_moyen_etp + frais_fixes
solde_reassurance = primes_cedees - sinistres_recuperes

# Résultat technique
resultat_technique = primes_acquises 
                   - sinistres_charges 
                   - frais_acquisition 
                   - frais_gestion 
                   + solde_reassurance

# Produits financiers (simplifié)
produits_financiers = placements × rendement × (1 - risque_factor)

# Résultat net
resultat_net = resultat_technique + produits_financiers

# Ratio combiné (indicateur clé)
ratio_combine = (sinistres_charges + frais_acquisition + frais_gestion) / primes_acquises × 100
```

**Exemple chiffré**

```
# Données trimestrielles (compagnie moyenne)
primes_acquises = 25_000_000 €
sinistres_payes = 15_000_000 €
delta_provisions = +1_000_000 € (constitution)
frais_acquisition = 4_000_000 € (16%)
frais_gestion = 3_500_000 € (14%)
primes_cedees = 2_500_000 €
sinistres_recuperes = 1_500_000 €
placements = 100_000_000 €
rendement = 0.01 (1% trimestriel)

# Calculs
sinistres_charges = 15_000_000 + 1_000_000 = 16_000_000 €
solde_reassurance = 2_500_000 - 1_500_000 = 1_000_000 € (coût net)

resultat_technique = 25_000_000 - 16_000_000 - 4_000_000 - 3_500_000 - 1_000_000
                   = 500_000 €

produits_financiers = 100_000_000 × 0.01 = 1_000_000 €

resultat_net = 500_000 + 1_000_000 = 1_500_000 €

ratio_combine = (16_000_000 + 4_000_000 + 3_500_000) / 25_000_000 × 100
              = 94%

Résultat: Profitable (ratio < 100%), marge technique faible
```

---

### 3.2 Coût réassurance

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `niveau_protection` | Niveau choisi | enum | {Minimal, Standard, Fort, Maximum} |
| `taux_cession` | % primes cédées | % | [2, 18] |
| `primes_cedees` | Montant cédé au réassureur | € | [0, ∞[ |

**Formule**

```
# Mapping niveau → taux
taux_cession = {
  Minimal:  0.02,   # 2%
  Standard: 0.05,   # 5%
  Fort:     0.10,   # 10%
  Maximum:  0.18    # 18%
}[niveau_protection]

primes_cedees = primes_brutes × taux_cession

# Sinistres récupérés (en cas de sinistre majeur)
sinistres_recuperes = sinistres_cat × taux_recuperation(niveau_protection)
```

**Invariant**

```
INV-REA-01: Coût_Réassurance = Primes × Taux_Cession(niveau)
```

**Exemple chiffré**

```
niveau_protection = Fort
primes_brutes = 100_000_000 €
taux_cession = 0.10

primes_cedees = 100_000_000 × 0.10 = 10_000_000 €

# Si événement Cat Nat avec 30M€ de sinistres
sinistres_cat = 30_000_000 €
taux_recuperation = 0.60 (niveau Fort)
sinistres_recuperes = 30_000_000 × 0.60 = 18_000_000 €

Solde réassurance = 10_000_000 - 18_000_000 = -8_000_000 € (gain net ce tour)
```

---

### 3.3 Fraude évitée

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `fraude_baseline` | Montant fraude potentielle | € | [0, ∞[ |
| `taux_detection` | Efficacité détection | % | [0, 40] |
| `niveau_fraud` | Niveau du levier fraude | enum | {0, N1, N2, N3} |
| `fraude_evitee` | Économies réalisées | € | [0, fraude_baseline] |

**Formule**

```
# Taux de détection par niveau
taux_detection = {
  0:  0.00,   # Pas de lutte fraude
  N1: 0.05,   # +5%
  N2: 0.20,   # +15% (cumul N1+N2)
  N3: 0.40    # +20% (cumul N1+N2+N3)
}[niveau_fraud]

# Fraude baseline (estimée à 5-10% des sinistres)
fraude_baseline = sinistres_payes × taux_fraude_estime

# Économies
fraude_evitee = fraude_baseline × taux_detection

# Contrainte INV-6
fraude_evitee ≤ fraude_baseline × Taux_Detection_Max(niveau)
```

**Exemple chiffré**

```
sinistres_payes = 15_000_000 €
taux_fraude_estime = 0.07 (7%)
niveau_fraud = N2

fraude_baseline = 15_000_000 × 0.07 = 1_050_000 €
taux_detection = 0.20

fraude_evitee = 1_050_000 × 0.20 = 210_000 €

Impact IPP: +210_000 € de résultat
```

---

## 4) Formules RH & Capacité

### 4.1 Capacité de traitement

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `effectifs` | Nombre d'ETP | ETP | [0, ∞[ |
| `productivite` | Dossiers/ETP/période | nb | [0, ∞[ |
| `capacite` | Capacité totale | nb dossiers | [0, ∞[ |

**Formule**

```
# Productivité ajustée
productivite = productivite_base 
             × (1 + bonus_formation) 
             × (1 + bonus_automatisation)
             × (1 - malus_turnover)

# Capacité
capacite = effectifs × productivite

# Ratio charge/capacité
ratio_charge = stock_sinistres / capacite

# Impact sur IPQO si surcharge
if ratio_charge > 1.0:
    surcharge_penalty = (ratio_charge - 1.0) × 30
```

**Exemple chiffré**

```
effectifs = 150 ETP
productivite_base = 12 dossiers/ETP/trimestre
bonus_formation = 0.10 (+10%)
bonus_automatisation = 0.15 (+15% IMD élevé)
malus_turnover = 0.05 (-5% turnover élevé)
stock_sinistres = 12_000

productivite = 12 × 1.10 × 1.15 × 0.95 = 14.4 dossiers/ETP/trimestre

capacite = 150 × 14.4 = 2_160 dossiers/trimestre

ratio_charge = 12_000 / 2_160 = 5.56 (surcharge × 5.56 !)

surcharge_penalty = (5.56 - 1.0) × 30 = 136.8 → plafonné

Situation critique nécessitant recrutement ou externalisation
```

---

### 4.2 Coût des effectifs

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `cout_etp` | Coût moyen par ETP | €/période | [0, ∞[ |
| `cout_total_rh` | Masse salariale | € | [0, ∞[ |

**Formule**

```
cout_etp = cout_base × (1 + bonus_remuneration) × charges_sociales

cout_total_rh = effectifs × cout_etp + cout_recrutement + cout_formation
```

**Exemple chiffré**

```
effectifs = 150 ETP
cout_base = 15_000 €/trimestre
bonus_remuneration = 0.05 (+5%)
charges_sociales = 1.45
recrutements = 10
cout_recrutement_unitaire = 8_000 €
budget_formation = 50_000 €

cout_etp = 15_000 × 1.05 × 1.45 = 22_837 €/ETP/trimestre

cout_total_rh = 150 × 22_837 + 10 × 8_000 + 50_000
              = 3_425_550 + 80_000 + 50_000
              = 3_555_550 €
```

---

## 5) Formules Événements

### 5.1 Impact événement marché

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `intensite` | Force de l'événement | [0.5, 2.0] | ratio |
| `impact_base` | Impact standard | variable | selon type |
| `modulation` | Facteur de modulation stratégie | [0.5, 1.5] | ratio |

**Formule**

```
# Impact réel = base × intensité × modulation
impact_reel = impact_base × intensite × (1 - protection_factor)

# Protection selon stratégie
protection_factor = f(reassurance, prevention, organisation)
```

**Exemple chiffré (Choc climatique)**

```
type = "choc_climatique"
intensite = 1.5 (événement fort)
impact_base = +20% fréquence sinistres MRH
niveau_reassurance = Fort (protection_factor = 0.30)
niveau_prevention_mrh = N1 (reduction = 0.03)

impact_brut = 0.20 × 1.5 = 0.30 (+30%)
protection = 0.30
reduction_prev = 0.03

impact_net = 0.30 × (1 - 0.30) × (1 - 0.03) = 0.30 × 0.70 × 0.97 = 0.204

Impact final: +20.4% fréquence sinistres MRH
```

---

### 5.2 Probabilité événement compagnie

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `proba_base` | Probabilité de base/tour | [0, 1] | % |
| `vulnerabilite` | Score de vulnérabilité | [0, 100] | - |
| `proba_finale` | Probabilité ajustée | [0, 1] | % |

**Formule**

```
# Vulnérabilité selon indices
vulnerabilite_cyber = 100 - IMD
vulnerabilite_rh = 100 - IERH
vulnerabilite_presta = 100 - qualite_presta

# Probabilité ajustée
proba_finale = proba_base × (1 + vulnerabilite / 100)
```

**Exemple chiffré (Cyberattaque)**

```
type = "cyberattaque"
proba_base = 0.02 (2% par tour)
IMD = 35 (maturité data faible)
investissement_securite = Minimal

vulnerabilite_cyber = 100 - 35 = 65
bonus_proba = 0.02 × (65 / 100) = 0.013

proba_finale = 0.02 + 0.013 = 0.033 (3.3% par tour)

→ Compagnie à risque élevé de cyberattaque
```

---

## 6) Formules Effets Retard

### 6.1 Application d'un effet retard

**Variables**

| Variable | Description | Unité | Borne |
|----------|-------------|-------|-------|
| `effet_prevu` | Effet planifié | variable | selon levier |
| `delai` | Nb tours avant effet | T | [0, 8] |
| `tour_application` | Tour où l'effet s'applique | nb | [t+1, t+8] |

**Formule**

```
# Enregistrement
effet_retard = {
  type: "delta_indice" | "delta_freq" | "delta_cout" | ...,
  cible: indice ou variable,
  valeur: montant de l'effet,
  tour_creation: t,
  tour_application: t + delai
}

# Application au tour prévu
if tour_courant == effet_retard.tour_application:
    cible += valeur
```

**Exemple chiffré**

```
Action: Recrutement sinistres (LEV-RH-01)
Tour: t = 5
Effet: IPQO +8
Délai: 2T

effet_retard = {
  type: "delta_indice",
  cible: "IPQO",
  valeur: +8,
  tour_creation: 5,
  tour_application: 7
}

Au tour 7: IPQO(7) = IPQO(6) + 8 + autres_effets
```

---

## 7) Invariants des Formules

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

INV-FORM-10 ∀ indice calculé: 0 ≤ indice ≤ 100
```

---

## 8) Checklist Validation Formules

- [ ] Toutes les formules respectent les bornes définies
- [ ] Les exemples chiffrés sont cohérents avec les formules
- [ ] Les invariants sont testés automatiquement
- [ ] Les effets retard s'appliquent exactement au tour prévu
- [ ] Le P&L est équilibré (cohérence comptable)
- [ ] Les ratios sont calculés correctement
- [ ] Les cascades d'effets sont tracées
