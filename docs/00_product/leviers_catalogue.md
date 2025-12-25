# leviers_catalogue.md — Catalogue des Leviers Actionnables

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2024-12-25

---

## 1) Principes Généraux

### 1.1 Structure d'un levier

Chaque levier possède :
- **ID** unique (ex: `LEV-TAR-01`)
- **Catégorie** : regroupement fonctionnel
- **Disponibilité** : difficulté minimale requise
- **Type** : Ponctuel | Persistant | Progressif (N1/N2/N3)
- **Coût** : budget requis par tour
- **Effet** : impact sur indices et indicateurs
- **Délai** : tours avant effet principal
- **Scope** : Par produit | Global compagnie

### 1.2 Budget de tour

Le joueur dispose d'un **budget de tour** à allouer entre leviers.
- Budget = f(taille compagnie, résultat précédent, difficulté)
- Certains leviers sont **mutuellement exclusifs** (ex: approche sinistres)
- Certains leviers ont des **prérequis** (ex: IA fraude nécessite IMD ≥ 60)

### 1.3 Persistance et inertie

| Type | Comportement |
|------|--------------|
| **Ponctuel** | Effet immédiat, disparaît au tour suivant (ex: campagne pub) |
| **Persistant** | Effet qui perdure avec atténuation progressive (ex: recrutement) |
| **Progressif** | Niveaux cumulatifs N1→N2→N3 (ex: fraude, prévention) |

---

## 2) Catalogue par Catégorie

### 2.1 PRODUIT & TARIFICATION

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-TAR-01 | Niveau de prime | Novice | Persistant | Produit | Faible | IAC ± / IPP ± |
| LEV-TAR-02 | Segmentation tarifaire | Intermédiaire | Persistant | Produit | Moyen | Qualité portefeuille |
| LEV-TAR-03 | Révision annuelle | Expert | Ponctuel | Produit | Faible | Ajustement S/P |
| LEV-GAR-01 | Niveau franchise | Novice | Persistant | Produit | Nul | Franchise ↑ → Prime − → Coût sinistres − / Satisfaction sinistre − |
| LEV-GAR-02 | Étendue garanties | Novice | Persistant | Produit | Variable | IAC + / Coût sinistres + |
| LEV-GAR-03 | Exclusions | Expert | Persistant | Produit | Nul | Risque − / IAC − |

**Détail LEV-TAR-01 — Niveau de prime**

```yaml
id: LEV-TAR-01
nom: Niveau de prime (vs marché)
disponibilité: Novice
type: Persistant
scope: Produit
coût_budget: 0 (décision stratégique)
options:
  - valeur: -15% (Agressif)
    effet_iac: +15
    effet_ipp: -10 à -20 selon mix
    effet_portefeuille: Risque anti-sélection
  - valeur: 0% (Marché)
    effet_iac: 0
    effet_ipp: 0
  - valeur: +10% (Premium)
    effet_iac: -10
    effet_ipp: +5 à +15
    effet_portefeuille: Meilleur profil risque
délai: 1 tour
interactions:
  - Si IAC < 40 : impact acquisition amplifié
  - Si IPQO < 50 : rétention compromise même avec prix bas
```

---

### 2.2 DISTRIBUTION

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-DIS-01 | Mix canaux | Novice | Persistant | Global | Moyen | IAC / Coûts acquisition |
| LEV-DIS-02 | Niveau commissions | Intermédiaire | Persistant | Global | Variable | Animation réseau |
| LEV-DIS-03 | Formation réseau | Intermédiaire | Persistant | Global | Moyen | Qualité vente |
| LEV-DIS-04 | Schéma incentive | Expert | Persistant | Global | Élevé | Motivation / Mix produit |

**Détail LEV-DIS-01 — Mix canaux**

```yaml
id: LEV-DIS-01
nom: Mix de distribution
disponibilité: Novice
type: Persistant
scope: Global
coût_budget: Moyen
options:
  - canal: Direct/Digital (0-100%)
    coût_acquisition: Faible
    effet_iac: Variable (cible jeune)
    effet_ipqo: Neutre
  - canal: Agents (0-100%)
    coût_acquisition: Moyen
    effet_iac: Bon (conseil)
    effet_ipqo: +5 (qualité souscription)
  - canal: Courtiers (0-100%)
    coût_acquisition: Élevé
    effet_iac: Fort (multi-compagnies)
    effet_ipqo: Variable
  - canal: Affinitaires (0-100%)
    coût_acquisition: Moyen
    effet_iac: Ciblé
    effet_ipqo: Dépend partenaire
contrainte: Total = 100%
délai: 2 tours (inertie réseau)
```

---

### 2.3 MARKETING

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-MKT-01 | Publicité marque | Novice | Ponctuel | Global | Élevé | Notoriété → IAC |
| LEV-MKT-02 | Marketing direct | Intermédiaire | Ponctuel | Produit | Moyen | Acquisition ciblée |
| LEV-MKT-03 | Activation digitale | Intermédiaire | Ponctuel | Produit | Moyen | CAC optimisé |

**Détail LEV-MKT-01 — Publicité marque**

```yaml
id: LEV-MKT-01
nom: Campagne publicité marque
disponibilité: Novice
type: Ponctuel
scope: Global
coût_budget: 3 unités
effet:
  iac: +5 à +10 (immédiat)
  notoriété: +8 (pic puis décroissance -2/tour)
délai: 0 (immédiat)
durée_effet: 3 tours (décroissant)
note: "Court terme, ROI difficile à mesurer"
```

---

### 2.4 RESSOURCES HUMAINES

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-RH-01 | Recrutement sinistres | Novice | Persistant | Global | Moyen | Capacité → IPQO |
| LEV-RH-02 | Recrutement IT/Data | Intermédiaire | Persistant | Global | Élevé | IMD |
| LEV-RH-03 | Recrutement distribution | Novice | Persistant | Global | Moyen | IAC |
| LEV-RH-04 | Formation | Intermédiaire | Persistant | Global | Moyen | Compétences → IERH |
| LEV-RH-05 | Rémunération | Intermédiaire | Persistant | Global | Élevé | Turnover → IERH |
| LEV-RH-06 | QVT | Expert | Persistant | Global | Moyen | Climat social → IERH |

**Détail LEV-RH-01 — Recrutement sinistres**

```yaml
id: LEV-RH-01
nom: Recrutement gestionnaires sinistres
disponibilité: Novice
type: Persistant
scope: Global
coût_budget: 2 unités budget = recrutement de 10 ETP sur le tour
effet:
  effectif_sinistres: +10 ETP par investissement
  capacité: +X dossiers/mois (selon ratio)
  ipqo: +5 à +10 (si sous-capacité actuelle)
  ierh: +3 (climat "on investit")
délai: 2 tours (recrutement + montée en compétence)
contrainte: "Marché tendu si IERH < 40 → coût +50%"
```

---

### 2.5 IT & DATA

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-IT-01 | Stabilité SI | Novice | Persistant | Global | Moyen | Dette technique − |
| LEV-IT-02 | Automatisation | Intermédiaire | Persistant | Global | Élevé | IPQO + / Capacité + |
| LEV-IT-03 | Qualité données | Intermédiaire | Persistant | Global | Moyen | IMD + |
| LEV-IT-04 | Gouvernance data | Expert | Persistant | Global | Moyen | IMD + / Prérequis IA |
| LEV-IT-05 | Cas d'usage IA | Expert | Progressif | Global | Très élevé | Variable selon use case |
| LEV-IT-06 | Sécurité SI | Intermédiaire | Persistant | Global | Moyen | Réduction impact cyber / Prérequis conformité |

**Détail LEV-IT-05 — Cas d'usage IA (Fraude)**

```yaml
id: LEV-IT-05a
nom: IA Fraude
disponibilité: Expert
type: Progressif (N1/N2/N3)
scope: Global
prérequis: IMD ≥ 60
niveaux:
  N1_quick_wins:
    coût: 1 unité
    effet: Fraude détectée +10%
    délai: 1 tour
    description: "Règles simples, scoring basique"
  N2_industrialisation:
    coût: 3 unités (cumulatif)
    effet: Fraude détectée +25%
    délai: 3 tours
    description: "Outillage, formation, process"
  N3_ml_avancé:
    coût: 5 unités (cumulatif)
    effet: Fraude détectée +40%
    délai: 6 tours
    description: "MLOps, modèles prédictifs, temps réel"
impact_ipp: +2% à +5% selon niveau (économies fraude)
```

---

### 2.6 PRESTATAIRES & PARTENAIRES

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-PRES-01 | Niveau externalisation | Novice | Persistant | Global | Variable | Capacité / Coûts |
| LEV-PRES-02 | Exigences SLA | Intermédiaire | Persistant | Global | Élevé | IPQO + |
| LEV-PRES-03 | Réseau agréé | Intermédiaire | Persistant | Produit | Moyen | Coût sinistres − |

---

### 2.7 GESTION DES SINISTRES

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-SIN-01 | Organisation | Novice | Persistant | Global | Faible | IPQO / Coûts |
| LEV-SIN-02 | Lutte fraude | Novice→Expert | Progressif | Global | Variable | IPP + |
| LEV-SIN-03 | Recours | Intermédiaire | Persistant | Produit | Moyen | Récupérations → IPP |
| LEV-SIN-04 | Expertise | Intermédiaire | Persistant | Produit | Moyen | Coût moyen sinistre |

**Détail LEV-SIN-02 — Lutte contre la fraude**

```yaml
id: LEV-SIN-02
nom: Lutte anti-fraude
disponibilité: Novice (N1), Intermédiaire (N2), Expert (N3)
type: Progressif
scope: Global
niveaux:
  N1_contrôles_basiques:
    disponibilité: Novice
    coût: 1 unité
    effet: Fraude évitée +5% du montant fraude
    délai: 1 tour
  N2_process_outillés:
    disponibilité: Intermédiaire
    coût: 2 unités (additionnel)
    effet: Fraude évitée +15%
    délai: 2 tours
    prérequis: N1 actif + IMD ≥ 40
  N3_ia_prédictive:
    disponibilité: Expert
    coût: 4 unités (additionnel)
    effet: Fraude évitée +30%
    délai: 4 tours
    prérequis: N2 actif + IMD ≥ 60 + LEV-IT-05a
```

---

### 2.8 RÉASSURANCE

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-REA-01 | Niveau protection | Novice | Persistant | Global | Variable | IRF + / IPP − |
| LEV-REA-02 | Type traité | Expert | Persistant | Global | Variable | Optimisation |

**Détail LEV-REA-01 — Niveau de protection réassurance**

```yaml
id: LEV-REA-01
nom: Niveau de protection réassurance
disponibilité: Novice
type: Persistant
scope: Global
options:
  - niveau: Minimal (10% sinistres cédés)
    coût_primes: 2% des primes
    irf: +5
    protection_cat: Faible
  - niveau: Standard (25%)
    coût_primes: 5% des primes
    irf: +15
    protection_cat: Moyenne
  - niveau: Fort (40%)
    coût_primes: 10% des primes
    irf: +25
    protection_cat: Élevée
  - niveau: Maximum (60%)
    coût_primes: 18% des primes
    irf: +35
    protection_cat: Très élevée
délai: 0 (effet immédiat sur IRF)
note: "Arbitrage rentabilité vs résilience"
```

---

### 2.9 PRÉVENTION

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-PREV-01 | Prévention habitat | Intermédiaire | Progressif | Produit (MRH) | Moyen | Fréquence − |
| LEV-PREV-02 | Prévention auto | Intermédiaire | Progressif | Produit (Auto) | Moyen | Fréquence − |
| LEV-PREV-03 | Prévention data-driven | Expert | Progressif | Global | Élevé | Fréquence/Sévérité − |

**Détail LEV-PREV-01 — Prévention habitat**

```yaml
id: LEV-PREV-01
nom: Programme prévention habitat
disponibilité: Intermédiaire
type: Progressif
scope: Produit (MRH)
niveaux:
  N1_sensibilisation:
    coût: 1 unité
    effet: Fréquence MRH −3%
    délai: 4 tours
  N2_équipements:
    coût: 2 unités
    effet: Fréquence MRH −8%, Sévérité −5%
    délai: 6 tours
  N3_smart_home:
    coût: 4 unités
    effet: Fréquence MRH −15%, Sévérité −10%
    délai: 8 tours
    prérequis: IMD ≥ 50
iac_bonus: +3 (image assureur préventif)
```

---

### 2.10 PROVISIONS & PLACEMENTS

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-PROV-01 | Politique provisions | Novice | Persistant | Global | Nul | IS / IRF |
| LEV-PLAC-01 | Allocation placements | Intermédiaire | Persistant | Global | Nul | Produits financiers / IRF |

**Détail LEV-PROV-01 — Politique de provisionnement**

```yaml
id: LEV-PROV-01
nom: Politique de provisionnement
disponibilité: Novice
type: Persistant
scope: Global
options:
  - politique: Agressive
    is: −10 à −15
    ipp_court_terme: +5 (moins de charges)
    irf: −10 (sous-provisionnement)
    risque: "Mali probable T+2 à T+4"
  - politique: Standard
    is: 0
    ipp_court_terme: 0
    irf: 0
  - politique: Prudente
    is: +5
    ipp_court_terme: −3 (plus de charges)
    irf: +5
    bonus: "Boni potentiel T+2 à T+4"
délai: Effet IS immédiat, conséquences IRF/IPP différées
```

---

### 2.11 CONFORMITÉ (levier défensif)

| ID | Levier | Difficulté | Type | Scope | Coût | Effet Principal |
|----|--------|------------|------|-------|------|------------------|
| LEV-CONF-01 | Investissement conformité | Intermédiaire | Persistant | Global | Moyen | Réduction risque sanction / IS + |

**Détail LEV-CONF-01 — Investissement conformité**

```yaml
id: LEV-CONF-01
nom: Investissement conformité
disponibilité: Intermédiaire
type: Persistant (défensif)
scope: Global
coût_budget: 1-2 unités selon niveau
niveaux:
  Minimal:
    coût: 0 unité
    effet: Vulnérabilité aux événements "Sanction réglementaire"
    risque: "Probabilité sanction +20% si IS < 50"
  Standard:
    coût: 1 unité
    effet: Risque sanction baseline
    is: +2
  Renforcé:
    coût: 2 unités
    effet: Probabilité sanction −50%
    is: +5
    ipp: −1 (coût structure)
    bonus: "Accès prioritaire nouveaux produits réglementés"
interactions:
  - Prérequis pour LEV-IT-05 (IA) : conformité ≥ Standard (RGPD/IA Act)
  - Si LEV-IT-06 (Sécurité SI) actif : bonus conformité +2
  - Événement "Choc réglementaire" : impact réduit si conformité Renforcé
délai: Effet IS immédiat, protection événements à partir du tour suivant
note: "Levier défensif : ne génère pas de croissance mais protège des pertes"
```

```yaml
id: LEV-PROV-01
nom: Politique de provisionnement
disponibilité: Novice
type: Persistant
scope: Global
options:
  - politique: Agressive
    is: −10 à −15
    ipp_court_terme: +5 (moins de charges)
    irf: −10 (sous-provisionnement)
    risque: "Mali probable T+2 à T+4"
  - politique: Standard
    is: 0
    ipp_court_terme: 0
    irf: 0
  - politique: Prudente
    is: +5
    ipp_court_terme: −3 (plus de charges)
    irf: +5
    bonus: "Boni potentiel T+2 à T+4"
délai: Effet IS immédiat, conséquences IRF/IPP différées
```

---

## 3) Matrice Disponibilité par Difficulté

| Catégorie | Novice | Intermédiaire | Expert |
|-----------|--------|---------------|--------|
| Tarification | 2 leviers | 3 leviers | 3 leviers + granularité |
| Distribution | 1 levier (mix) | 3 leviers | 4 leviers |
| Marketing | 1 levier | 3 leviers | 3 leviers + ciblage |
| RH | 3 leviers macro | 5 leviers | 6 leviers |
| IT/Data | 1 levier | 3 leviers | 5 leviers + IA |
| Sinistres | 2 leviers + FraudeN1 | 3 leviers + FraudeN2 | 4 leviers + FraudeN3 |
| Réassurance | 1 levier (niveau) | 1 levier | 2 leviers |
| Prévention | 0 | 2 leviers N1 | 3 leviers N1-N3 |
| Provisions | 1 levier | 1 levier | 2 leviers |

**Total** : ~12 leviers (Novice) → ~22 leviers (Intermédiaire) → ~30+ leviers (Expert)

---

## 4) Prérequis et Incompatibilités

### Prérequis (exemples)
```
LEV-IT-05 (IA Fraude)     → nécessite IMD ≥ 60
LEV-SIN-02-N3 (Fraude N3) → nécessite LEV-SIN-02-N2 + LEV-IT-05a
LEV-PREV-03 (Data-driven) → nécessite IMD ≥ 50
```

### Incompatibilités
```
LEV-PROV-01:Agressive  ⊕  LEV-PROV-01:Prudente (mutually exclusive)
LEV-SIN-01:Centralisé  ⊕  LEV-SIN-01:Full-Délégué (choix unique)
```

---

## 5) Invariants du Catalogue

```
INV-L1  Σ(Coût_Leviers_Actifs) ≤ Budget_Tour

INV-L2  Si Prérequis(Levier) non satisfait → Levier non activable

INV-L3  Levier_Progressif.Niveau(t) ≥ Levier_Progressif.Niveau(t-1)
        (pas de régression de niveau)

INV-L4  Disponibilité(Levier) ≤ Difficulté_Session
        (levier Expert non visible en Novice)

INV-L5  ∀ Levier activé : Effet enregistré avec Timestamp + Délai
```
