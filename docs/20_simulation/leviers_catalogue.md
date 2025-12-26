# leviers_catalogue.md — Catalogue Technique des Leviers

**Version** : 1.1  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-26  
**Auteur** : Simulation Engineer

> **CHANGELOG**
> - **2025-12-26** : Ajout de 10 nouveaux leviers IARD (souscription, crise, client, conformité, distribution). Catégories ajoutées : SOUSCRIPTION, GESTION_CRISE, EXPERIENCE_CLIENT, CONFORMITE.

> Ce document complète `docs/00_product/leviers_catalogue.md` (source of truth) avec les spécifications techniques d'implémentation.

---

## 1) Structure de Données d'un Levier

### 1.1 Schema TypeScript

```typescript
interface Lever {
  id: string;                    // Identifiant unique (ex: LEV-TAR-01)
  name: string;                  // Nom affiché
  category: LeverCategory;       // Catégorie
  
  // Disponibilité
  availability: Difficulty;      // Novice | Intermediate | Expert
  prerequisites: Prerequisite[]; // Prérequis (indices, leviers)
  
  // Type et comportement
  type: LeverType;               // Punctual | Persistent | Progressive
  scope: LeverScope;             // Global | PerProduct
  
  // Coût
  cost: CostDefinition;
  
  // Options (si applicable)
  options?: LeverOption[];
  
  // Effets
  effects: Effect[];
  
  // Métadonnées
  delay: number;                 // Tours avant effet (vitesse Moyenne)
  duration?: number;             // Durée effet si temporaire
  incompatible_with?: string[];  // IDs leviers incompatibles
}

type LeverCategory = 
  | "PRODUIT_TARIFICATION"
  | "DISTRIBUTION"
  | "MARKETING"
  | "RH"
  | "IT_DATA"
  | "PRESTATAIRES"
  | "SINISTRES"
  | "REASSURANCE"
  | "PREVENTION"
  | "PROVISIONS";

type Difficulty = "Novice" | "Intermediate" | "Expert";
type LeverType = "Punctual" | "Persistent" | "Progressive";
type LeverScope = "Global" | "PerProduct";

interface Effect {
  target: string;                // Indice ou variable cible
  type: "absolute" | "relative"; // +10 vs +10%
  value: number;
  delay: number;                 // Délai spécifique à cet effet
  condition?: string;            // Condition d'application
}

interface Prerequisite {
  type: "index_min" | "lever_active" | "lever_level";
  target: string;
  value: number | string;
}

interface CostDefinition {
  budget_units: number;          // Coût en unités budget
  recurring: boolean;            // Coût récurrent chaque tour ?
  scaling?: "fixed" | "per_unit"; // Fixe ou par unité
}
```

---

## 2) Catalogue MVP par Catégorie

### 2.1 PRODUIT & TARIFICATION

#### LEV-TAR-01 — Niveau de prime

```yaml
id: LEV-TAR-01
name: Niveau de prime (vs marché)
category: PRODUIT_TARIFICATION
availability: Novice
type: Persistent
scope: PerProduct

cost:
  budget_units: 0
  recurring: false

options:
  - id: aggressive
    label: "Agressif (-15%)"
    effects:
      - target: IAC
        type: absolute
        value: 15
        delay: 1
      - target: IPP
        type: absolute
        value: -8
        delay: 2
        probability: 0.60  # Anti-sélection probable (60%)
        condition: "if delta_prix < -10%"
    meta:
      risk: "Anti-sélection probable (60%) - cf. hypothèse métier H-PRICING"
      note: "L'effet IPP négatif n'est pas certain, il dépend de l'observation du S/P sur 2T"
  
  - id: market
    label: "Marché (0%)"
    effects:
      - target: IAC
        type: absolute
        value: 0
        delay: 0
  
  - id: premium
    label: "Premium (+10%)"
    effects:
      - target: IAC
        type: absolute
        value: -10
        delay: 1
      - target: IPP
        type: absolute
        value: 8
        delay: 2
        probability: 0.70  # Amélioration profil risque (70%)
    meta:
      benefit: "Meilleur profil risque (sélection positive)"

delay: 1
```

**Variables et bornes**

| Variable | Unité | Borne min | Borne max | Description |
|----------|-------|-----------|-----------|-------------|
| `delta_prix` | % | -30 | +30 | Écart vs prix marché |
| `effet_iac` | points | -20 | +20 | Impact sur IAC |
| `effet_ipp` | points | -20 | +20 | Impact sur IPP |

**Exemple chiffré**

```
Situation: Compagnie avec IAC=55, IPP=50
Action: Tarification Agressive (-15%)

t=0: Décision prise
t=1: IAC = 55 + 15 = 70 ✓
t=2: Observation anti-sélection (S/P se dégrade)
t=3: IPP = 50 - 12 = 38 (sinistralité augmentée)
```

---

#### LEV-GAR-01 — Niveau franchise

```yaml
id: LEV-GAR-01
name: Niveau de franchise
category: PRODUIT_TARIFICATION
availability: Novice
type: Persistent
scope: PerProduct

cost:
  budget_units: 0
  recurring: false

options:
  - id: low
    label: "Franchise basse"
    effects:
      - target: IAC
        type: absolute
        value: 8
      - target: sinistres_cost
        type: relative
        value: 10
        delay: 1
  
  - id: standard
    label: "Franchise standard"
    effects: []
  
  - id: high
    label: "Franchise élevée"
    effects:
      - target: IAC
        type: absolute
        value: -5
      - target: sinistres_cost
        type: relative
        value: -15
        delay: 1
      - target: satisfaction_sinistres
        type: absolute
        value: -10
        delay: 1

delay: 1
```

---

### 2.2 DISTRIBUTION

#### LEV-DIS-01 — Mix canaux

```yaml
id: LEV-DIS-01
name: Mix de distribution
category: DISTRIBUTION
availability: Novice
type: Persistent
scope: Global

cost:
  budget_units: 2
  recurring: true

parameters:
  - id: digital_pct
    type: percentage
    min: 0
    max: 100
    label: "Direct/Digital %"
    
  - id: agents_pct
    type: percentage
    min: 0
    max: 100
    label: "Agents %"
    
  - id: courtiers_pct
    type: percentage
    min: 0
    max: 100
    label: "Courtiers %"
    
  - id: affinitaires_pct
    type: percentage
    min: 0
    max: 100
    label: "Affinitaires %"

constraints:
  - "SUM(all_pct) = 100"

effects_by_channel:
  digital:
    cout_acquisition: Low
    effet_iac: "Variable (cible jeune)"
    effet_ipqo: 0
  agents:
    cout_acquisition: Medium
    effet_iac: "+5 (conseil)"
    effet_ipqo: "+5 (qualité souscription)"
  courtiers:
    cout_acquisition: High
    effet_iac: "+10 (multi-compagnies)"
    effet_ipqo: 0
  affinitaires:
    cout_acquisition: Medium
    effet_iac: "+3 (ciblé)"
    effet_ipqo: "Variable"

delay: 2
```

**Invariant**

```
INV-L5: Σ mix_canaux = 100%
```

**Exemple chiffré**

```
Configuration actuelle: Digital 20%, Agents 50%, Courtiers 30%, Affinitaires 0%
Nouvelle configuration: Digital 40%, Agents 30%, Courtiers 20%, Affinitaires 10%

Coût acquisition pondéré:
  Avant: 0.20×100 + 0.50×200 + 0.30×350 = 20 + 100 + 105 = 225 €/contrat
  Après: 0.40×100 + 0.30×200 + 0.20×350 + 0.10×200 = 40 + 60 + 70 + 20 = 190 €/contrat

Économie: 35 €/contrat → sur 10,000 nouveaux contrats = 350,000 €
Mais: Perte de conseil agents → qualité portefeuille à surveiller
```

---

### 2.3 MARKETING

#### LEV-MKT-01 — Publicité marque

```yaml
id: LEV-MKT-01
name: Campagne publicité marque
category: MARKETING
availability: Novice
type: Punctual
scope: Global

cost:
  budget_units: 3
  recurring: false

effects:
  - target: notoriete
    type: absolute
    value: 8
    delay: 0
    duration: 1
    decay:
      type: linear
      value_per_turn: -2
      min_residual: 2
  
  - target: IAC
    type: absolute
    value: 5
    delay: 0
    duration: 3

delay: 0
duration: 3
```

**Courbe de décroissance**

```
t=0: notoriete +8, IAC +5
t=1: notoriete +6 (décroissance -2), IAC +5
t=2: notoriete +4, IAC +5
t=3: notoriete +2 (résiduel), IAC +0 (fin effet)
t=4: notoriete +2 (stabilisé)
```

---

### 2.4 RESSOURCES HUMAINES

#### LEV-RH-01 — Recrutement sinistres

```yaml
id: LEV-RH-01
name: Recrutement gestionnaires sinistres
category: RH
availability: Novice
type: Persistent
scope: Global

cost:
  budget_units: 2
  recurring: false
  scaling: per_unit
  unit_description: "10 ETP recrutés"

effects:
  - target: effectif_sinistres
    type: absolute
    value: 10
    delay: 2
  
  - target: capacite_sinistres
    type: relative
    value: 7
    delay: 2
    formula: "effectif × productivite_etp"
  
  - target: IPQO
    type: absolute
    value: 5
    delay: 2
    condition: "if stock_sinistres > capacite"
  
  - target: IERH
    type: absolute
    value: 3
    delay: 0

delay: 2

constraints:
  - id: marche_tendu
    condition: "IERH < 40"
    effect: "cost × 1.5"
    description: "Marché RH tendu → coût +50%"
```

**Variables et bornes**

| Variable | Unité | Borne min | Borne max | Description |
|----------|-------|-----------|-----------|-------------|
| `effectif_ajoute` | ETP | 5 | 50 | Recrutement par action |
| `cout_par_etp` | € | 5000 | 15000 | Coût recrutement |
| `productivite_etp` | dossiers/T | 10 | 20 | Dossiers/ETP/trimestre |

**Exemple chiffré**

```
Action: Recrutement sinistres (2 unités = 10 ETP)
État initial:
  effectif_sinistres = 140 ETP
  capacite = 140 × 15 = 2100 dossiers/T
  stock = 12000 dossiers
  IERH = 55
  IPQO = 60

t=0: Décision + coût 2 unités
     IERH = 55 + 3 = 58 (signal positif immédiat)

t=2: Application effet retard
     effectif_sinistres = 150 ETP
     capacite = 150 × 15 = 2250 dossiers/T
     IPQO = 60 + 5 = 65 (surcharge diminue)
```

---

#### LEV-RH-04 — Formation

```yaml
id: LEV-RH-04
name: Programme de formation
category: RH
availability: Intermediate
type: Persistent
scope: Global

cost:
  budget_units: 1
  recurring: true

effects:
  - target: competences
    type: absolute
    value: 10
    delay: 2
  
  - target: productivite
    type: relative
    value: 5
    delay: 2
  
  - target: IERH
    type: absolute
    value: 5
    delay: 1

delay: 2
```

---

### 2.5 IT & DATA

#### LEV-IT-01 — Stabilité SI

```yaml
id: LEV-IT-01
name: Investissement stabilité SI
category: IT_DATA
availability: Novice
type: Persistent
scope: Global

cost:
  budget_units: 2
  recurring: true

effects:
  - target: dette_technique
    type: absolute
    value: -10
    delay: 2

  - target: vulnerabilite_cyber
    type: relative
    value: -15
    delay: 2

  - target: stabilite_si
    type: absolute
    value: 10
    delay: 3

delay: 2
```

---

#### LEV-IT-05a — IA Fraude (Progressive)

```yaml
id: LEV-IT-05a
name: IA Fraude (cas d'usage)
category: IT_DATA
availability: Expert
type: Progressive
scope: Global

prerequisites:
  - type: index_min
    target: IMD
    value: 60

levels:
  N1:
    available_at: Expert
    cost:
      budget_units: 1
    effects:
      - target: fraude_detectee
        type: relative
        value: 10
        delay: 1
    description: "Règles simples, scoring basique"
  
  N2:
    available_at: Expert
    cost:
      budget_units: 3
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-IT-05a
        value: N1
    effects:
      - target: fraude_detectee
        type: relative
        value: 25
        delay: 3
    description: "Outillage, formation, process"
  
  N3:
    available_at: Expert
    cost:
      budget_units: 5
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-IT-05a
        value: N2
      - type: index_min
        target: IMD
        value: 70
    effects:
      - target: fraude_detectee
        type: relative
        value: 40
        delay: 6
      - target: IPP
        type: absolute
        value: 5
        delay: 6
    description: "MLOps, modèles prédictifs, temps réel"
```

**Invariant**

```
INV-L3: Niveau_Progressif(t) ≥ Niveau_Progressif(t-1)
        (pas de régression de niveau)
```

---

### 2.6 SINISTRES & FRAUDE

#### LEV-SIN-02 — Lutte anti-fraude (Progressive)

```yaml
id: LEV-SIN-02
name: Lutte anti-fraude
category: SINISTRES
availability: Novice  # pour N1
type: Progressive
scope: Global

levels:
  N1:
    available_at: Novice
    cost:
      budget_units: 1
    effects:
      - target: fraude_evitee
        type: relative
        value: 5
        delay: 1
    description: "Contrôles basiques, règles simples"
  
  N2:
    available_at: Intermediate
    cost:
      budget_units: 2
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-SIN-02
        value: N1
      - type: index_min
        target: IMD
        value: 40
    effects:
      - target: fraude_evitee
        type: relative
        value: 15
        delay: 2
    description: "Process outillés, formation équipes"
  
  N3:
    available_at: Expert
    cost:
      budget_units: 4
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-SIN-02
        value: N2
      - type: index_min
        target: IMD
        value: 60
      - type: lever_active
        target: LEV-IT-05a
    effects:
      - target: fraude_evitee
        type: relative
        value: 30
        delay: 4
    description: "IA prédictive intégrée"
```

**Exemple chiffré**

```
Fraude baseline: 7% des sinistres = 1,050,000 €

Niveau N1 (t=0):
  fraude_evitee(t+1) = 1,050,000 × 5% = 52,500 €

Passage N2 (t=3):
  fraude_evitee(t+5) = 1,050,000 × 15% = 157,500 €

Passage N3 (t=8):
  fraude_evitee(t+12) = 1,050,000 × 30% = 315,000 €

Économie totale N3: 315,000 €/trimestre → 1.26 M€/an
```

---

### 2.7 RÉASSURANCE

#### LEV-REA-01 — Niveau de protection

```yaml
id: LEV-REA-01
name: Niveau de protection réassurance
category: REASSURANCE
availability: Novice
type: Persistent
scope: Global

cost:
  budget_units: 0
  recurring: false
  note: "Coût intégré dans le P&L (primes cédées)"

# Note métier: Les taux de cession sont simplifiés pour le jeu.
# En réalité, la réassurance combine proportionnelle (QP) et non-proportionnelle (XS).

options:
  - id: minimal
    label: "Minimal (2% cédés)"
    effects:
      - target: IRF
        type: absolute
        value: 5
        delay: 0
      - target: primes_cedees_rate
        type: absolute
        value: 0.02
    meta:
      protection_cat: Low
      description: "Couverture minimale, exposition forte aux cat nat"
  
  - id: standard
    label: "Standard (5% cédés)"
    effects:
      - target: IRF
        type: absolute
        value: 15
        delay: 0
      - target: primes_cedees_rate
        type: absolute
        value: 0.05
    meta:
      protection_cat: Medium
      description: "Couverture standard marché"
  
  - id: strong
    label: "Fort (10% cédés)"
    effects:
      - target: IRF
        type: absolute
        value: 25
        delay: 0
      - target: primes_cedees_rate
        type: absolute
        value: 0.10
    meta:
      protection_cat: High
      description: "Bonne protection, coût modéré"
  
  - id: maximum
    label: "Maximum (18% cédés)"
    effects:
      - target: IRF
        type: absolute
        value: 35
        delay: 0
      - target: primes_cedees_rate
        type: absolute
        value: 0.18
    meta:
      protection_cat: VeryHigh
      description: "Protection maximale, coût élevé"

delay: 0
```

**Invariant**

```
INV-L7: Coût_Réassurance = Primes × Taux_Cession(niveau)
```

---

### 2.8 PRÉVENTION

#### LEV-PREV-01 — Prévention habitat (Progressive)

```yaml
id: LEV-PREV-01
name: Programme prévention habitat
category: PREVENTION
availability: Intermediate
type: Progressive
scope: PerProduct
product: MRH

levels:
  N1:
    available_at: Intermediate
    cost:
      budget_units: 1
    effects:
      - target: frequence_mrh
        type: relative
        value: -3
        delay: 4
      - target: IAC
        type: absolute
        value: 3
        delay: 0
    description: "Sensibilisation clients"
  
  N2:
    available_at: Intermediate
    cost:
      budget_units: 2
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-PREV-01
        value: N1
    effects:
      - target: frequence_mrh
        type: relative
        value: -8
        delay: 6
      - target: severite_mrh
        type: relative
        value: -5
        delay: 6
    description: "Équipements (détecteurs, etc.)"
  
  N3:
    available_at: Expert
    cost:
      budget_units: 4
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-PREV-01
        value: N2
      - type: index_min
        target: IMD
        value: 50
    effects:
      - target: frequence_mrh
        type: relative
        value: -15
        delay: 8
      - target: severite_mrh
        type: relative
        value: -10
        delay: 8
    description: "Smart home, prédictif"
```

---

### 2.9 PROVISIONS & PLACEMENTS

#### LEV-PROV-01 — Politique de provisionnement

```yaml
id: LEV-PROV-01
name: Politique de provisionnement
category: PROVISIONS
availability: Novice
type: Persistent
scope: Global

cost:
  budget_units: 0
  recurring: false

options:
  - id: aggressive
    label: "Agressive"
    effects:
      - target: IS
        type: absolute
        value: -15
        delay: 0
      - target: IPP
        type: absolute
        value: 5
        delay: 0
        note: "Apparence"
      - target: IRF
        type: absolute
        value: -10
        delay: 0
    consequences:
      - type: mali_probable
        probability: 0.7
        delay_range: [2, 4]
        impact_ipp: -10
        impact_irf: -15
  
  - id: standard
    label: "Standard"
    effects: []
  
  - id: prudent
    label: "Prudente"
    effects:
      - target: IS
        type: absolute
        value: 5
        delay: 0
      - target: IPP
        type: absolute
        value: -3
        delay: 0
      - target: IRF
        type: absolute
        value: 5
        delay: 0
    consequences:
      - type: boni_probable
        probability: 0.6
        delay_range: [2, 4]
        impact_ipp: 5

delay: 0
```

---

### 2.11 SOUSCRIPTION & APPÉTIT AU RISQUE (NOUVEAU)

#### LEV-UND-01 — Posture de souscription

```yaml
id: LEV-UND-01
name: Posture de souscription
category: SOUSCRIPTION
availability: Novice
type: Persistent
scope: Global

cost:
  budget_units: 0
  recurring: false

options:
  - id: permissive
    label: "Permissive (tout accepter)"
    effects:
      - target: IAC
        type: absolute
        value: 10
        delay: 0
      - target: ADVERSE_SEL_RISK
        type: absolute
        value: 25
        delay: 0
      - target: IPP
        type: absolute
        value: -8
        delay: 3
        probability: 0.70
    meta:
      risk: "Anti-sélection probable - mauvais risques attirés"
  
  - id: equilibree
    label: "Équilibrée"
    effects:
      - target: UND_STRICTNESS
        type: absolute
        value: 50
        delay: 0
  
  - id: selective
    label: "Sélective"
    effects:
      - target: IAC
        type: absolute
        value: -5
        delay: 0
      - target: ADVERSE_SEL_RISK
        type: absolute
        value: -15
        delay: 0
      - target: IPP
        type: absolute
        value: 5
        delay: 3
  
  - id: tres_selective
    label: "Très sélective"
    effects:
      - target: IAC
        type: absolute
        value: -12
        delay: 0
      - target: ADVERSE_SEL_RISK
        type: absolute
        value: -25
        delay: 0
      - target: IPP
        type: absolute
        value: 10
        delay: 3
    meta:
      note: "Risque de perte de parts de marché"

delay: 0
```

---

#### LEV-UND-02 — Règles de sélection avancées

```yaml
id: LEV-UND-02
name: Règles de sélection avancées
category: SOUSCRIPTION
availability: Intermediate
type: Persistent
scope: Global

prerequisites:
  - type: lever_active
    target: LEV-UND-01

cost:
  budget_units: 1
  recurring: true

options:
  - id: regles_simples
    label: "Règles métier simples"
    effects:
      - target: UND_STRICTNESS
        type: absolute
        value: 10
        delay: 1
  
  - id: scoring_metier
    label: "Scoring métier"
    prerequisites:
      - type: index_min
        target: IMD
        value: 40
    effects:
      - target: UND_STRICTNESS
        type: absolute
        value: 20
        delay: 2
      - target: ADVERSE_SEL_RISK
        type: absolute
        value: -10
        delay: 2
  
  - id: scoring_data_driven
    label: "Scoring data-driven"
    prerequisites:
      - type: index_min
        target: IMD
        value: 60
    effects:
      - target: UND_STRICTNESS
        type: absolute
        value: 30
        delay: 3
      - target: ADVERSE_SEL_RISK
        type: absolute
        value: -20
        delay: 3

delay: 2
```

---

### 2.12 GESTION DE CRISE (NOUVEAU)

#### LEV-CRISE-01 — Plan de crise & Surge capacity

```yaml
id: LEV-CRISE-01
name: Plan de crise & Surge capacity
category: GESTION_CRISE
availability: Intermediate
type: Progressive
scope: Global

cost:
  budget_units: 2
  recurring: true

levels:
  N0:
    label: "Pas de plan"
    effects: []
  
  N1:
    label: "Plan basique"
    available_at: Intermediate
    cost:
      budget_units: 1
    effects:
      - target: OPS_SURGE_CAP
        type: absolute
        value: 20
        delay: 1
      - target: REP_TEMP
        type: absolute
        value: -5
        delay: 0
        condition: "if evenement_catnat_actif"
    description: "Procédures documentées, liste de contacts"
  
  N2:
    label: "Plan industrialisé"
    available_at: Intermediate
    cost:
      budget_units: 2
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-CRISE-01
        value: N1
    effects:
      - target: OPS_SURGE_CAP
        type: absolute
        value: 40
        delay: 2
      - target: BACKLOG_DAYS
        type: relative
        value: -20
        delay: 0
        condition: "if evenement_catnat_actif"
      - target: REP_TEMP
        type: absolute
        value: -10
        delay: 0
        condition: "if evenement_catnat_actif"
    description: "Cellule de crise, effectifs réserve, process rodés"
  
  N3:
    label: "Plan avec partenaires de crise"
    available_at: Expert
    cost:
      budget_units: 3
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-CRISE-01
        value: N2
    effects:
      - target: OPS_SURGE_CAP
        type: absolute
        value: 70
        delay: 3
      - target: BACKLOG_DAYS
        type: relative
        value: -40
        delay: 0
        condition: "if evenement_catnat_actif"
      - target: REG_HEAT
        type: absolute
        value: -10
        delay: 0
        condition: "if evenement_catnat_actif"
    description: "Accords prestataires, renfort externe immédiat"

delay: 2
```

---

### 2.13 EXPÉRIENCE CLIENT (NOUVEAU)

#### LEV-CLI-01 — Politique d'indemnisation

```yaml
id: LEV-CLI-01
name: Politique d'indemnisation
category: EXPERIENCE_CLIENT
availability: Novice
type: Persistent
scope: Global

cost:
  budget_units: 0
  recurring: false

options:
  - id: genereuse
    label: "Généreuse"
    effects:
      - target: severite
        type: relative
        value: 8
        delay: 0
        note: "Coûts sinistres +8%"
      - target: COMPLAINTS_RATE
        type: relative
        value: -40
        delay: 1
      - target: LITIGATION_RISK
        type: absolute
        value: -15
        delay: 1
      - target: satisfaction_nps
        type: absolute
        value: 10
        delay: 1
  
  - id: standard
    label: "Standard"
    effects: []
  
  - id: restrictive
    label: "Restrictive"
    effects:
      - target: severite
        type: relative
        value: -8
        delay: 0
        note: "Coûts sinistres -8%"
      - target: COMPLAINTS_RATE
        type: relative
        value: 50
        delay: 1
      - target: LITIGATION_RISK
        type: absolute
        value: 20
        delay: 1
      - target: satisfaction_nps
        type: absolute
        value: -10
        delay: 1

delay: 0
```

---

#### LEV-CLI-02 — Service client & Médiation

```yaml
id: LEV-CLI-02
name: Service client & Médiation
category: EXPERIENCE_CLIENT
availability: Intermediate
type: Persistent
scope: Global

cost:
  budget_units: 1
  recurring: true

options:
  - id: minimum_legal
    label: "Minimum légal"
    effects: []
  
  - id: renforce
    label: "Renforcé"
    effects:
      - target: COMPLAINTS_RATE
        type: relative
        value: -20
        delay: 1
      - target: LITIGATION_RISK
        type: absolute
        value: -10
        delay: 1
      - target: IAC
        type: absolute
        value: 3
        delay: 2
  
  - id: proactif_mediation
    label: "Proactif avec médiation interne"
    cost:
      budget_units: 2
    effects:
      - target: COMPLAINTS_RATE
        type: relative
        value: -40
        delay: 1
      - target: LITIGATION_RISK
        type: absolute
        value: -25
        delay: 1
      - target: LEGAL_COST_RATIO
        type: relative
        value: -30
        delay: 2
      - target: IAC
        type: absolute
        value: 5
        delay: 2

delay: 1
```

---

### 2.14 GOUVERNANCE & CONFORMITÉ (NOUVEAU)

#### LEV-CONF-02 — Dispositif de contrôle interne

```yaml
id: LEV-CONF-02
name: Dispositif de contrôle interne
category: CONFORMITE
availability: Intermediate
type: Persistent
scope: Global

cost:
  budget_units: 1
  recurring: true

options:
  - id: minimal
    label: "Minimal"
    effects:
      - target: CTRL_MATURITY
        type: absolute
        value: 20
        delay: 0
  
  - id: standard
    label: "Standard"
    effects:
      - target: CTRL_MATURITY
        type: absolute
        value: 50
        delay: 1
      - target: IS
        type: absolute
        value: 5
        delay: 2
  
  - id: renforce
    label: "Renforcé"
    cost:
      budget_units: 2
    effects:
      - target: CTRL_MATURITY
        type: absolute
        value: 80
        delay: 2
      - target: IS
        type: absolute
        value: 10
        delay: 2
      - target: REG_HEAT
        type: absolute
        value: -10
        delay: 2

delay: 1
```

---

#### LEV-CONF-03 — Audit délégataires & affinitaires

```yaml
id: LEV-CONF-03
name: Audit délégataires & affinitaires
category: CONFORMITE
availability: Expert
type: Persistent
scope: Global

prerequisites:
  - type: condition
    description: "Utilisation de canaux délégataires/affinitaires"

cost:
  budget_units: 1
  recurring: true

options:
  - id: pas_audit
    label: "Pas d'audit"
    effects: []
  
  - id: audit_annuel
    label: "Audit annuel"
    effects:
      - target: FRAUD_PROC_ROB
        type: absolute
        value: 15
        delay: 4  # effet annuel
      - target: CHAN_QUALITY
        type: absolute
        value: 5
        delay: 4
  
  - id: audit_continu
    label: "Audit continu + reporting"
    cost:
      budget_units: 2
    effects:
      - target: FRAUD_PROC_ROB
        type: absolute
        value: 30
        delay: 2
      - target: CHAN_QUALITY
        type: absolute
        value: 10
        delay: 2
      - target: CTRL_MATURITY
        type: absolute
        value: 10
        delay: 2

delay: 2
```

---

#### LEV-FRAUD-PROC-01 — Anti-fraude procédurale

```yaml
id: LEV-FRAUD-PROC-01
name: Anti-fraude procédurale
category: CONFORMITE
availability: Intermediate
type: Progressive
scope: Global

cost:
  budget_units: 1
  recurring: true

levels:
  N1:
    label: "Contrôles basiques"
    available_at: Intermediate
    cost:
      budget_units: 1
    effects:
      - target: FRAUD_PROC_ROB
        type: absolute
        value: 20
        delay: 1
    description: "Séparation des tâches, contrôles aléatoires"
  
  N2:
    label: "Process outillés"
    available_at: Intermediate
    cost:
      budget_units: 2
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-FRAUD-PROC-01
        value: N1
      - type: index_min
        target: IMD
        value: 40
    effects:
      - target: FRAUD_PROC_ROB
        type: absolute
        value: 50
        delay: 2
      - target: fraude_interne_evitee
        type: relative
        value: 15
        delay: 2
    description: "Workflows sécurisés, alertes automatiques"
  
  N3:
    label: "IA + audit continu"
    available_at: Expert
    cost:
      budget_units: 3
      cumulative: true
    prerequisites:
      - type: lever_level
        target: LEV-FRAUD-PROC-01
        value: N2
      - type: index_min
        target: IMD
        value: 60
    effects:
      - target: FRAUD_PROC_ROB
        type: absolute
        value: 85
        delay: 4
      - target: fraude_interne_evitee
        type: relative
        value: 30
        delay: 4
    description: "Détection anomalies temps réel, supervision continue"

delay: 2
```

---

### 2.15 DISTRIBUTION : QUALITÉ & CONCENTRATION (NOUVEAU)

#### LEV-DIS-02-QUALITY — Exigences qualité canal

```yaml
id: LEV-DIS-02-QUALITY
name: Exigences qualité canal
category: DISTRIBUTION
availability: Intermediate
type: Persistent
scope: Global

cost:
  budget_units: 1
  recurring: true

options:
  - id: pas_exigence
    label: "Pas d'exigence"
    effects: []
  
  - id: suivi_sp
    label: "Suivi S/P par canal"
    effects:
      - target: CHAN_QUALITY
        type: absolute
        value: 5
        delay: 2
        note: "Visibilité sans action"
  
  - id: bonus_malus
    label: "Bonus-malus qualité"
    effects:
      - target: CHAN_QUALITY
        type: absolute
        value: 15
        delay: 3
      - target: ADVERSE_SEL_RISK
        type: absolute
        value: -10
        delay: 3
      - target: IAC
        type: absolute
        value: -3
        delay: 1
        note: "Tension avec certains distributeurs"
  
  - id: selection_active
    label: "Sélection active"
    cost:
      budget_units: 2
    effects:
      - target: CHAN_QUALITY
        type: absolute
        value: 25
        delay: 4
      - target: ADVERSE_SEL_RISK
        type: absolute
        value: -20
        delay: 4
      - target: IAC
        type: absolute
        value: -8
        delay: 1
        note: "Perte de volume court terme"
      - target: IPP
        type: absolute
        value: 8
        delay: 4
        note: "Amélioration S/P différée"

delay: 2
```

---

#### LEV-DIS-03-CONCENTRATION — Gestion concentration apporteurs

```yaml
id: LEV-DIS-03-CONCENTRATION
name: Gestion concentration apporteurs
category: DISTRIBUTION
availability: Expert
type: Persistent
scope: Global

cost:
  budget_units: 1
  recurring: true

options:
  - id: pas_suivi
    label: "Pas de suivi"
    effects: []
  
  - id: monitoring
    label: "Monitoring"
    effects:
      - target: DISTRIB_CONC_RISK
        type: absolute
        value: -5
        delay: 1
        note: "Visibilité, pas d'action"
  
  - id: diversification
    label: "Diversification active"
    cost:
      budget_units: 2
    effects:
      - target: DISTRIB_CONC_RISK
        type: absolute
        value: -20
        delay: 4
      - target: IAC
        type: absolute
        value: -5
        delay: 1
        note: "Coût développement nouveaux canaux"
  
  - id: plafond
    label: "Plafond par apporteur"
    cost:
      budget_units: 2
    effects:
      - target: DISTRIB_CONC_RISK
        type: absolute
        value: -30
        delay: 2
      - target: IAC
        type: absolute
        value: -10
        delay: 1
        note: "Risque tension avec gros apporteur"
    meta:
      risk: "Peut déclencher événement 'Rupture apporteur'"

delay: 2
```

---

## 3) Matrice Récapitulative Disponibilité

| ID | Levier | Novice | Intermédiaire | Expert |
|----|--------|--------|---------------|--------|
| LEV-TAR-01 | Niveau prime | ✅ | ✅ | ✅ |
| LEV-TAR-02 | Segmentation | ❌ | ✅ | ✅ |
| LEV-GAR-01 | Franchise | ✅ | ✅ | ✅ |
| LEV-GAR-02 | Garanties | ✅ | ✅ | ✅ |
| LEV-DIS-01 | Mix canaux | ✅ | ✅ | ✅ |
| LEV-DIS-02 | Commissions | ❌ | ✅ | ✅ |
| LEV-MKT-01 | Publicité | ✅ | ✅ | ✅ |
| LEV-MKT-02 | Marketing direct | ❌ | ✅ | ✅ |
| LEV-RH-01 | Recrutement sin. | ✅ | ✅ | ✅ |
| LEV-RH-02 | Recrutement IT | ❌ | ✅ | ✅ |
| LEV-RH-04 | Formation | ❌ | ✅ | ✅ |
| LEV-IT-01 | Stabilité SI | ✅ | ✅ | ✅ |
| LEV-IT-03 | Qualité données | ❌ | ✅ | ✅ |
| LEV-IT-05a | IA Fraude | ❌ | ❌ | ✅ |
| LEV-SIN-02-N1 | Fraude N1 | ✅ | ✅ | ✅ |
| LEV-SIN-02-N2 | Fraude N2 | ❌ | ✅ | ✅ |
| LEV-SIN-02-N3 | Fraude N3 | ❌ | ❌ | ✅ |
| LEV-REA-01 | Réassurance | ✅ | ✅ | ✅ |
| LEV-PREV-01 | Prévention MRH | ❌ | ✅ | ✅ |
| LEV-PROV-01 | Provisions | ✅ | ✅ | ✅ |
| LEV-PLAC-01 | Placements | ❌ | ✅ | ✅ |

**Comptage** : ~12 leviers (Novice) → ~22 leviers (Intermédiaire) → ~30+ leviers (Expert)

---

## 4) Invariants du Catalogue

```
INV-L1  Σ(Coût_Leviers_Actifs) ≤ Budget_Tour

INV-L2  Si Prérequis(Levier) non satisfait → Levier non activable
        (UI doit griser le levier + afficher prérequis manquants)

INV-L3  Levier_Progressif.Niveau(t) ≥ Levier_Progressif.Niveau(t-1)
        (pas de régression)

INV-L4  Disponibilité(Levier) ≤ Difficulté_Session
        (levier Expert non visible en Novice)

INV-L5  Σ Mix_Canaux = 100%

INV-L6  Options mutuellement exclusives:
        - LEV-PROV-01:Aggressive ⊕ LEV-PROV-01:Prudent
        - LEV-SIN-01:Centralisé ⊕ LEV-SIN-01:Délégué

INV-L7  Coût_Réassurance = Primes × Taux_Cession(niveau)

INV-L8  ∀ Levier activé: Effet enregistré avec (tour_creation, delai, tour_application)
```

---

## 5) Checklist Implémentation

- [ ] Tous les leviers ont un ID unique
- [ ] Contraintes de prérequis vérifiées avant activation
- [ ] Coûts correctement débités du budget
- [ ] Effets retard ajoutés à la file
- [ ] Leviers progressifs ne régressent pas
- [ ] Mix canaux somme à 100%
- [ ] Options mutuellement exclusives respectées
- [ ] Disponibilité filtrée par difficulté
- [ ] UI affiche prérequis manquants
- [ ] Leviers scope "PerProduct" s'appliquent au bon produit
