# events_catalogue.md — Catalogue des Événements

**Version** : 1.1  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-26  
**Auteur** : Simulation Engineer

> **CHANGELOG**
> - **2025-12-26** : Ajout de 5 nouveaux événements IARD (CatNat triple impact, Audit régulateur, Rupture apporteur, Crise médiatique, Fraude opportuniste).

---

## 1) Classification des Événements

### 1.1 Types d'événements

| Type | Scope | Description | Exemples |
|------|-------|-------------|----------|
| **Marché (Systémique)** | Tous les acteurs | Affecte l'ensemble du marché | Climat, inflation, réglementation |
| **Compagnie (Idiosyncratique)** | Une compagnie | Cible une compagnie spécifique | Cyberattaque, crise RH |

### 1.2 Structure de données

```typescript
interface Event {
  id: string;                    // Identifiant unique
  name: string;                  // Nom affiché
  type: "market" | "company";    // Type
  category: EventCategory;       // Catégorie
  
  // Déclenchement
  probability_base: number;      // Probabilité de base/tour [0, 1]
  vulnerability_factors?: VulnerabilityFactor[];  // Facteurs augmentant la proba
  exclusion_conditions?: string[];  // Conditions empêchant l'événement
  
  // Intensité
  intensity: IntensityConfig;
  
  // Effets
  effects: EventEffect[];
  
  // Durée
  duration: number;              // Nb tours d'effet
  
  // Mitigation
  mitigation_factors?: MitigationFactor[];
  
  // Affichage
  news_flash: NewsFlashConfig;
}

type EventCategory = 
  | "CLIMAT"
  | "ECONOMIQUE"
  | "REGLEMENTAIRE"
  | "TECHNOLOGIQUE"
  | "RH"
  | "OPERATIONNEL"
  | "CYBER";

interface IntensityConfig {
  distribution: "uniform" | "gaussian";
  min: number;
  max: number;
  mean?: number;
  std?: number;
}

interface EventEffect {
  target: string;               // Indice ou variable
  type: "absolute" | "relative";
  base_value: number;
  intensity_multiplier: number; // Effet = base × intensité × mult
  delay: number;
}

interface VulnerabilityFactor {
  source: string;               // Indice ou variable
  threshold: number;            // Seuil déclencheur
  operator: "<" | ">" | "<=";
  probability_modifier: number; // Multiplicateur proba
}

interface MitigationFactor {
  source: string;               // Levier ou stratégie
  reduction: number;            // % de réduction d'impact
}
```

---

## 2) Événements Marché (MVP)

### 2.1 EVT-MKT-01 — Épisode climatique

```yaml
id: EVT-MKT-01
name: Épisode climatique majeur
type: market
category: CLIMAT

probability_base: 0.15  # 15% par tour (trimestre)

# Saisonnalité ajustée marché français (source: CCR, FFA)
seasonality:
  Q1: 1.3   # Hiver - tempêtes (Klaus, Xynthia, Ciaran)
  Q2: 0.7   # Printemps - faible
  Q3: 0.6   # Été - grêle ponctuelle
  Q4: 1.2   # Automne - inondations (cévenoles, Rhône)

intensity:
  distribution: gaussian
  min: 0.5
  max: 2.0
  mean: 1.0
  std: 0.3

# Effets ajustés (modérés pour réalisme)
effects:
  - target: frequence_mrh
    type: relative
    base_value: 0.15          # +15% fréquence (réduit de 20%)
    intensity_multiplier: 1.0
    delay: 0
    note: "+15% base, jusqu'à +30% si intensité max"
  
  - target: frequence_auto
    type: relative
    base_value: 0.05          # +5% fréquence (grêle, verglas)
    intensity_multiplier: 0.5
    delay: 0
  
  - target: severite_mrh
    type: relative
    base_value: 0.10          # +10% sévérité (réduit de 15%)
    intensity_multiplier: 1.0
    delay: 0
    note: "Impact sévérité modéré sauf cat nat majeure"
  
  - target: stock_sinistres
    type: relative
    base_value: 0.25          # +25% stock (réduit de 30%)
    intensity_multiplier: 1.2
    delay: 0

duration: 2

mitigation_factors:
  - source: LEV-REA-01:strong
    reduction: 0.30           # -30% impact si réass forte
  - source: LEV-REA-01:maximum
    reduction: 0.50
  - source: LEV-PREV-01
    reduction: 0.10           # -10% par niveau prévention

news_flash:
  title: "🌊 Épisode climatique majeur"
  severity_levels:
    low: "Des intempéries localisées ont causé des dégâts modérés."
    medium: "Une série d'événements climatiques frappe plusieurs régions."
    high: "Catastrophe naturelle majeure : le marché sous tension."
```

**Variables et bornes**

| Variable | Unité | Borne min | Borne max | Description |
|----------|-------|-----------|-----------|-------------|
| `intensity` | ratio | 0.5 | 2.0 | Multiplicateur d'intensité |
| `impact_frequence` | % | +5% | +40% | Augmentation fréquence |
| `impact_severite` | % | +5% | +30% | Augmentation sévérité |

**Exemple chiffré**

```
Situation: Épisode climatique intensité 1.5, protection réassurance "Standard"

frequence_mrh_base = 0.06
severite_mrh_base = 4000 €
stock_sinistres = 10000

# Sans mitigation (réassurance Standard = pas de mitigation significative)
impact_freq = 0.06 × (1 + 0.15 × 1.5) = 0.06 × 1.225 = 0.0735
impact_sev = 4000 × (1 + 0.10 × 1.5) = 4000 × 1.15 = 4600 €
impact_stock = 10000 × (1 + 0.25 × 1.5 × 1.2) = 10000 × 1.45 = 14500

# Avec réassurance Fort (-30% mitigation)
impact_freq_mitige = 0.0735 × (1 - 0.30) = 0.051 (proche de base)
impact_stock_mitige = 14500 × (1 - 0.30) = 10150

# Résultat: fréquence +22.5%, sévérité +15%, stock +45%
```

---

### 2.2 EVT-MKT-02 — Inflation sinistres

```yaml
id: EVT-MKT-02
name: Poussée inflationniste
type: market
category: ECONOMIQUE

probability_base: 0.10  # 10% par tour

intensity:
  distribution: uniform
  min: 0.5
  max: 1.5

effects:
  - target: severite_auto
    type: relative
    base_value: 0.08          # +8% coût réparations
    intensity_multiplier: 1.0
    delay: 0
  
  - target: severite_mrh
    type: relative
    base_value: 0.06          # +6% coût réparations
    intensity_multiplier: 1.0
    delay: 0
  
  - target: frais_gestion
    type: relative
    base_value: 0.03          # +3% frais
    intensity_multiplier: 0.5
    delay: 0
  
  - target: commissions
    type: relative
    base_value: 0.02          # +2% commissions
    intensity_multiplier: 0.5
    delay: 1

duration: 3

mitigation_factors:
  - source: LEV-PRES-03          # Réseau agréé
    reduction: 0.20
  - source: LEV-TAR-01:premium   # Tarifs premium
    reduction: 0.15

news_flash:
  title: "📈 Inflation : coûts en hausse"
  severity_levels:
    low: "Une légère hausse des prix des réparations est observée."
    medium: "L'inflation impacte significativement les coûts de sinistres."
    high: "Forte poussée inflationniste : les marges sous pression."
```

---

### 2.3 EVT-MKT-03 — Choc réglementaire

```yaml
id: EVT-MKT-03
name: Nouvelle contrainte réglementaire
type: market
category: REGLEMENTAIRE

probability_base: 0.08  # 8% par tour

intensity:
  distribution: uniform
  min: 0.7
  max: 1.3

effects:
  - target: frais_conformite
    type: absolute
    base_value: 500000        # +500k€ coûts conformité
    intensity_multiplier: 1.0
    delay: 0
  
  - target: capacite_sinistres
    type: relative
    base_value: -0.05         # -5% capacité (mobilisation)
    intensity_multiplier: 0.5
    delay: 0
  
  - target: croissance_max
    type: absolute
    base_value: -0.03         # -3% croissance autorisée
    intensity_multiplier: 1.0
    delay: 0
    duration: 4

duration: 4

mitigation_factors:
  - source: LEV-CONF-01:reinforced
    reduction: 0.40
  - source: IS
    condition: "> 60"
    reduction: 0.20

news_flash:
  title: "⚖️ Nouvelle réglementation"
  severity_levels:
    low: "De nouvelles obligations de reporting entrent en vigueur."
    medium: "Le régulateur renforce les contraintes de croissance."
    high: "Directive majeure : restructuration obligatoire des pratiques."
```

---

### 2.4 EVT-MKT-04 — Disrupteur digital

```yaml
id: EVT-MKT-04
name: Arrivée d'un disrupteur
type: market
category: TECHNOLOGIQUE

probability_base: 0.05  # 5% par tour

intensity:
  distribution: uniform
  min: 0.8
  max: 1.2

effects:
  - target: prix_marche
    type: relative
    base_value: -0.05         # -5% prix marché (guerre)
    intensity_multiplier: 1.0
    delay: 0
  
  - target: parts_marche
    type: relative
    base_value: -0.02         # -2% parts marché
    intensity_multiplier: 1.0
    delay: 1
    condition: "if IAC < 60"
  
  - target: IAC
    type: relative
    base_value: -0.05         # Pression sur attractivité
    intensity_multiplier: 0.5
    delay: 0

duration: 4

mitigation_factors:
  - source: IMD
    condition: "> 60"
    reduction: 0.30
  - source: LEV-DIS-01:digital_high
    reduction: 0.25

news_flash:
  title: "🚀 Nouveau concurrent digital"
  severity_levels:
    low: "Une nouvelle insurtech fait son entrée sur le marché."
    medium: "Un acteur digital agressif bouscule les prix."
    high: "Révolution du marché : le nouvel entrant casse les codes."
```

---

### 2.5 EVT-MKT-05 — Mutation parc auto

```yaml
id: EVT-MKT-05
name: Accélération électrification
type: market
category: TECHNOLOGIQUE

probability_base: 0.06  # 6% par tour

intensity:
  distribution: uniform
  min: 0.7
  max: 1.3

effects:
  - target: severite_auto
    type: relative
    base_value: 0.12          # +12% coût réparations (pièces)
    intensity_multiplier: 1.0
    delay: 0
  
  - target: expertise_auto
    type: relative
    base_value: -0.10         # -10% compétence expertise
    intensity_multiplier: 0.8
    delay: 0
  
  - target: IPQO
    type: absolute
    base_value: -5            # Impact qualité
    intensity_multiplier: 0.5
    delay: 1
    condition: "if expertise_auto < threshold"

duration: 3

mitigation_factors:
  - source: LEV-RH-04          # Formation
    reduction: 0.25
  - source: LEV-PRES-03        # Réseau agréé spécialisé
    reduction: 0.30

news_flash:
  title: "🔋 Électrification accélérée"
  severity_levels:
    low: "La part de véhicules électriques augmente progressivement."
    medium: "Le parc automobile évolue rapidement vers l'électrique."
    high: "Révolution du parc auto : adaptation urgente nécessaire."
```

---

## 3) Événements Compagnie (MVP)

### 3.1 EVT-CIE-01 — Cyberattaque

```yaml
id: EVT-CIE-01
name: Cyberattaque
type: company
category: CYBER

probability_base: 0.03  # 3% par tour

vulnerability_factors:
  - source: IMD
    threshold: 40
    operator: "<"
    probability_modifier: 2.0    # ×2 si IMD < 40
  
  - source: LEV-IT-06
    condition: "inactive"
    probability_modifier: 1.5    # ×1.5 si pas de sécurité SI
  
  - source: dette_technique
    threshold: 60
    operator: ">"
    probability_modifier: 1.3    # ×1.3 si dette tech élevée

intensity:
  distribution: gaussian
  min: 0.5
  max: 2.0
  mean: 1.0
  std: 0.4

effects:
  - target: IPQO
    type: absolute
    base_value: -20
    intensity_multiplier: 1.0
    delay: 0
  
  - target: capacite_sinistres
    type: relative
    base_value: -0.40         # -40% capacité (SI down)
    intensity_multiplier: 1.0
    delay: 0
  
  - target: IAC
    type: absolute
    base_value: -10           # Réputation
    intensity_multiplier: 0.5
    delay: 0
  
  - target: frais_exceptionnels
    type: absolute
    base_value: 2000000       # 2M€ coûts réponse
    intensity_multiplier: 1.0
    delay: 0

duration: 2

recovery_rate: 0.50  # 50% récupération/tour

mitigation_factors:
  - source: LEV-IT-06:active
    reduction: 0.40
  - source: IMD
    condition: "> 60"
    reduction: 0.25
  - source: LEV-REA-01:strong
    financial_coverage: 0.30   # Couverture cyber via réass

news_flash:
  title: "🔓 Cyberattaque détectée"
  severity_levels:
    low: "Une tentative d'intrusion a été contenue."
    medium: "Incident cyber : plusieurs systèmes impactés."
    high: "Attaque majeure : systèmes critiques compromis."
```

**Exemple chiffré**

```
Situation: Cyberattaque intensité 1.2, IMD=35, pas de sécurité SI

# Probabilité
proba_base = 0.03
modifier_imd = 2.0 (IMD < 40)
modifier_secu = 1.5 (LEV-IT-06 inactif)
proba_finale = 0.03 × 2.0 × 1.5 = 0.09 (9% par tour)

# Impact
IPQO = IPQO - 20 × 1.2 = IPQO - 24
capacite = capacite × (1 - 0.40 × 1.2) = capacite × 0.52
IAC = IAC - 10 × 1.2 × 0.5 = IAC - 6
frais = +2M€ × 1.2 = +2.4M€

# Récupération tour suivant
IPQO_t+1 = IPQO_t + 24 × 0.50 = IPQO_t + 12
capacite_t+1 = capacite × 0.52 + capacite × 0.48 × 0.50 = capacite × 0.76
```

---

### 3.2 EVT-CIE-02 — Panne SI majeure

```yaml
id: EVT-CIE-02
name: Panne système majeure
type: company
category: OPERATIONNEL

probability_base: 0.04  # 4% par tour

vulnerability_factors:
  - source: dette_technique
    threshold: 50
    operator: ">"
    probability_modifier: 1.8
  
  - source: stabilite_si
    threshold: 40
    operator: "<"
    probability_modifier: 2.0
  
  - source: LEV-IT-01
    condition: "inactive"
    probability_modifier: 1.4

intensity:
  distribution: uniform
  min: 0.6
  max: 1.4

effects:
  - target: IPQO
    type: absolute
    base_value: -15
    intensity_multiplier: 1.0
    delay: 0
  
  - target: capacite_sinistres
    type: relative
    base_value: -0.25
    intensity_multiplier: 1.0
    delay: 0
  
  - target: satisfaction
    type: absolute
    base_value: -8
    intensity_multiplier: 0.8
    delay: 0

duration: 1

recovery_rate: 0.80  # Récupération rapide

mitigation_factors:
  - source: LEV-IT-01:active
    reduction: 0.35
  - source: IMD
    condition: "> 50"
    reduction: 0.20

news_flash:
  title: "⚠️ Panne système"
  severity_levels:
    low: "Un incident technique perturbe temporairement les opérations."
    medium: "Panne majeure : plusieurs processus à l'arrêt."
    high: "Défaillance critique : l'activité est paralysée."
```

---

### 3.3 EVT-CIE-03 — Crise RH

```yaml
id: EVT-CIE-03
name: Crise RH / Mouvement social
type: company
category: RH

probability_base: 0.02  # 2% par tour

# Déclenchement automatique si condition remplie
auto_trigger:
  condition: "IERH < 30 pendant 3 tours consécutifs"
  probability: 1.0  # Certain si condition remplie

vulnerability_factors:
  - source: IERH
    threshold: 40
    operator: "<"
    probability_modifier: 3.0
  
  - source: turnover
    threshold: 0.20
    operator: ">"
    probability_modifier: 1.5
  
  - source: climat_social
    threshold: 40
    operator: "<"
    probability_modifier: 2.0

intensity:
  distribution: uniform
  min: 0.7
  max: 1.5

effects:
  - target: IERH
    type: absolute
    base_value: -20
    intensity_multiplier: 1.0
    delay: 0
  
  - target: IPQO
    type: absolute
    base_value: -15
    intensity_multiplier: 0.8
    delay: 0
  
  - target: capacite_sinistres
    type: relative
    base_value: -0.20
    intensity_multiplier: 1.0
    delay: 0
  
  - target: IAC
    type: absolute
    base_value: -5
    intensity_multiplier: 0.5
    delay: 1

duration: 3

recovery_rate: 0.25  # Récupération lente

mitigation_factors:
  - source: LEV-RH-05:high       # Rémunération élevée
    reduction: 0.25
  - source: LEV-RH-06           # QVT
    reduction: 0.30
  - source: IERH
    condition: "> 70"
    reduction: 0.40              # Résilience RH

news_flash:
  title: "👥 Tensions sociales"
  severity_levels:
    low: "Des signaux faibles de mécontentement apparaissent."
    medium: "Mouvement social : négociations en cours."
    high: "Crise RH majeure : grève et départs massifs."
```

---

### 3.4 EVT-CIE-04 — Incident prestataire

```yaml
id: EVT-CIE-04
name: Défaillance prestataire critique
type: company
category: OPERATIONNEL

probability_base: 0.03  # 3% par tour

vulnerability_factors:
  - source: LEV-PRES-01:high_outsourcing
    probability_modifier: 2.0
  
  - source: qualite_presta
    threshold: 50
    operator: "<"
    probability_modifier: 1.5

intensity:
  distribution: uniform
  min: 0.6
  max: 1.4

effects:
  - target: IPQO
    type: absolute
    base_value: -12
    intensity_multiplier: 1.0
    delay: 0
  
  - target: capacite_sinistres
    type: relative
    base_value: -0.15
    intensity_multiplier: 1.0
    delay: 0
  
  - target: severite
    type: relative
    base_value: 0.10
    intensity_multiplier: 0.8
    delay: 0

duration: 2

mitigation_factors:
  - source: LEV-PRES-02:strict_sla
    reduction: 0.35
  - source: LEV-PRES-01:low_outsourcing
    reduction: 0.50

news_flash:
  title: "🔧 Problème prestataire"
  severity_levels:
    low: "Un partenaire rencontre des difficultés temporaires."
    medium: "Défaillance prestataire : plan B activé."
    high: "Rupture de service : prestataire critique en faillite."
```

---

### 3.5 EVT-CIE-05 — Litige / Sanction

```yaml
id: EVT-CIE-05
name: Litige majeur ou sanction
type: company
category: REGLEMENTAIRE

probability_base: 0.02  # 2% par tour

vulnerability_factors:
  - source: IS
    threshold: 40
    operator: "<"
    probability_modifier: 3.0
  
  - source: LEV-CONF-01
    condition: "inactive"
    probability_modifier: 2.0
  
  - source: taux_reclamation
    threshold: 0.05
    operator: ">"
    probability_modifier: 1.5

intensity:
  distribution: uniform
  min: 0.5
  max: 2.0

effects:
  - target: frais_exceptionnels
    type: absolute
    base_value: 1500000       # 1.5M€ amende/provision
    intensity_multiplier: 1.5
    delay: 0
  
  - target: IAC
    type: absolute
    base_value: -8
    intensity_multiplier: 1.0
    delay: 0
  
  - target: IS
    type: absolute
    base_value: -10
    intensity_multiplier: 1.0
    delay: 0

duration: 2

mitigation_factors:
  - source: LEV-CONF-01:reinforced
    reduction: 0.50
  - source: IS
    condition: "> 70"
    reduction: 0.40

news_flash:
  title: "⚖️ Mise en cause"
  severity_levels:
    low: "Une réclamation client fait l'objet d'une médiation."
    medium: "L'ACPR lance une inspection sur les pratiques."
    high: "Sanction majeure : amende et obligations de remédiation."
```

---

## 3.6-3.10 NOUVEAUX ÉVÉNEMENTS IARD

### 3.6 EVT-CATNAT-01 — CatNat Triple Impact

```yaml
id: EVT-CATNAT-01
name: CatNat Triple Impact (technique + ops + régulateur)
type: market
category: CLIMAT

probability_base: 0.08  # 8% par tour (moins fréquent mais plus sévère que EVT-MKT-01)

seasonality:
  Q1: 1.5   # Tempêtes hivernales
  Q2: 0.5
  Q3: 0.8   # Orages grêle
  Q4: 1.2   # Inondations

intensity:
  distribution: gaussian
  min: 1.0
  max: 3.0
  mean: 1.5
  std: 0.5

# TRIPLE IMPACT - caractéristique distinctive
effects:
  # 1) IMPACT TECHNIQUE
  - target: frequence_mrh
    type: relative
    base_value: 0.40          # +40% fréquence MRH
    intensity_multiplier: 1.0
    delay: 0
  
  - target: severite_mrh
    type: relative
    base_value: 0.25          # +25% sévérité MRH
    intensity_multiplier: 1.0
    delay: 0
  
  - target: stock_sinistres
    type: relative
    base_value: 0.60          # +60% stock sinistres
    intensity_multiplier: 1.2
    delay: 0
  
  # 2) IMPACT OPÉRATIONNEL
  - target: BACKLOG_DAYS
    type: absolute
    base_value: 30            # +30 jours de backlog
    intensity_multiplier: 1.5
    delay: 0
  
  - target: IPQO
    type: absolute
    base_value: -15           # Dégradation qualité opérationnelle
    intensity_multiplier: 1.0
    delay: 0
  
  - target: capacite_sinistres
    type: relative
    base_value: -0.20         # -20% capacité (saturation)
    intensity_multiplier: 0.8
    delay: 0
  
  # 3) IMPACT RÉPUTATION / RÉGULATEUR
  - target: REP_TEMP
    type: absolute
    base_value: 25            # +25 pression médiatique
    intensity_multiplier: 1.2
    delay: 0
  
  - target: REG_HEAT
    type: absolute
    base_value: 15            # +15 attention régulateur
    intensity_multiplier: 1.0
    delay: 1
    condition: "if BACKLOG_DAYS > 30"
  
  - target: satisfaction_nps
    type: absolute
    base_value: -12
    intensity_multiplier: 1.0
    delay: 1

duration: 3

mitigation_factors:
  # Mitigation technique
  - source: LEV-REA-01:strong
    reduction: 0.35
  - source: LEV-REA-01:maximum
    reduction: 0.55
  - source: LEV-PREV-01
    reduction: 0.10
  
  # Mitigation opérationnelle
  - source: LEV-CRISE-01:N2
    reduction: 0.25
  - source: LEV-CRISE-01:N3
    reduction: 0.45
  - source: OPS_SURGE_CAP
    condition: "> 50"
    reduction: 0.20
  
  # Mitigation réputation
  - source: communication_crise
    condition: "> 60"
    reduction: 0.15

news_flash:
  title: "🌊⚠️ CATASTROPHE NATURELLE MAJEURE"
  severity_levels:
    low: "Événement climatique significatif : plusieurs régions touchées. Les équipes sont mobilisées."
    medium: "Catastrophe naturelle déclarée. Afflux massif de sinistres. La pression médiatique monte."
    high: "CRISE MAJEURE : les délais explosent, le régulateur interpelle les assureurs. L'État anticipe une intervention."
```

---

### 3.7 EVT-AUDIT-01 — Audit régulateur / Injonction

```yaml
id: EVT-AUDIT-01
name: Audit régulateur / Injonction de remédiation
type: company
category: REGLEMENTAIRE

probability_base: 0.03  # 3% par tour

# Déclenchement automatique si condition remplie
auto_trigger:
  condition: "REG_HEAT > 70 pendant 2 tours consécutifs"
  probability: 0.80

vulnerability_factors:
  - source: CTRL_MATURITY
    threshold: 40
    operator: "<"
    probability_modifier: 2.5
  
  - source: IS
    threshold: 40
    operator: "<"
    probability_modifier: 2.0
  
  - source: REG_HEAT
    threshold: 50
    operator: ">"
    probability_modifier: 1.8
  
  - source: COMPLAINTS_RATE
    threshold: 15
    operator: ">"
    probability_modifier: 1.5

intensity:
  distribution: uniform
  min: 0.7
  max: 1.5

effects:
  - target: frais_exceptionnels
    type: absolute
    base_value: 1000000       # 1M€ coûts remédiation minimum
    intensity_multiplier: 2.0
    delay: 0
  
  - target: capacite_sinistres
    type: relative
    base_value: -0.15         # -15% capacité (mobilisation équipes)
    intensity_multiplier: 0.8
    delay: 0
    duration: 2
  
  - target: IS
    type: absolute
    base_value: -15
    intensity_multiplier: 1.0
    delay: 0
  
  - target: REG_HEAT
    type: absolute
    base_value: 20            # Attention maintenue
    intensity_multiplier: 1.0
    delay: 0
  
  - target: croissance_max
    type: absolute
    base_value: -0.05         # -5% croissance autorisée
    intensity_multiplier: 1.0
    delay: 0
    duration: 4               # 4 tours de contrainte

duration: 4

recovery_rate: 0.20  # Récupération lente

mitigation_factors:
  - source: LEV-CONF-02:renforce
    reduction: 0.40
  - source: CTRL_MATURITY
    condition: "> 70"
    reduction: 0.35
  - source: IS
    condition: "> 70"
    reduction: 0.25

news_flash:
  title: "🔍 CONTRÔLE ACPR"
  severity_levels:
    low: "L'ACPR annonce un contrôle de routine sur les pratiques."
    medium: "Contrôle approfondi : des observations sont émises, remédiation attendue."
    high: "INJONCTION : le régulateur exige un plan de remédiation sous 6 mois. Sanction possible."
```

---

### 3.8 EVT-APPORTEUR-01 — Rupture/Renégociation apporteur majeur

```yaml
id: EVT-APPORTEUR-01
name: Rupture ou renégociation d'un apporteur majeur
type: company
category: OPERATIONNEL

probability_base: 0.02  # 2% par tour

vulnerability_factors:
  - source: DISTRIB_CONC_RISK
    threshold: 60
    operator: ">"
    probability_modifier: 3.0
  
  - source: DISTRIB_CONC_RISK
    threshold: 80
    operator: ">"
    probability_modifier: 5.0
  
  - source: LEV-DIS-03-CONCENTRATION:plafond
    condition: "active"
    probability_modifier: 2.0  # Tension créée par le plafond
  
  - source: commissions
    threshold: "below_market"
    probability_modifier: 1.5

intensity:
  distribution: uniform
  min: 0.6
  max: 1.4

effects:
  # Impact business
  - target: portefeuille
    type: relative
    base_value: -0.10         # Perte 10% portefeuille de base
    intensity_multiplier: 1.5
    delay: 2
    note: "Perte proportionnelle à la part de l'apporteur"
  
  - target: IAC
    type: absolute
    base_value: -8
    intensity_multiplier: 1.0
    delay: 1
  
  - target: primes
    type: relative
    base_value: -0.08         # -8% primes
    intensity_multiplier: 1.5
    delay: 2
  
  # Coûts de remplacement
  - target: frais_acquisition
    type: relative
    base_value: 0.20          # +20% coût acquisition (nouveaux canaux)
    intensity_multiplier: 1.0
    delay: 0
    duration: 4
  
  # Impact moral interne
  - target: IERH
    type: absolute
    base_value: -5
    intensity_multiplier: 0.5
    delay: 1

duration: 4

recovery_rate: 0.25

mitigation_factors:
  - source: LEV-DIS-03-CONCENTRATION:diversification
    reduction: 0.50
  - source: DISTRIB_CONC_RISK
    condition: "< 40"
    reduction: 0.60
  - source: nb_apporteurs
    condition: "> 15"
    reduction: 0.30

news_flash:
  title: "🤝❌ RUPTURE PARTENARIAT"
  severity_levels:
    low: "Un apporteur significatif demande à renégocier les conditions."
    medium: "Rupture de contrat : un partenaire majeur annonce son départ. Recherche de solutions."
    high: "CRISE DISTRIBUTION : votre principal apporteur part à la concurrence. Impact immédiat sur le portefeuille."
```

---

### 3.9 EVT-MEDIACRISE-01 — Crise médiatique sur délais/qualité indemnisation

```yaml
id: EVT-MEDIACRISE-01
name: Crise médiatique sur délais/qualité d'indemnisation
type: company
category: OPERATIONNEL

probability_base: 0.02  # 2% par tour

vulnerability_factors:
  - source: BACKLOG_DAYS
    threshold: 45
    operator: ">"
    probability_modifier: 3.0
  
  - source: COMPLAINTS_RATE
    threshold: 12
    operator: ">"
    probability_modifier: 2.5
  
  - source: REP_TEMP
    threshold: 50
    operator: ">"
    probability_modifier: 2.0
  
  - source: LEV-CLI-01:restrictive
    condition: "active"
    probability_modifier: 1.8

intensity:
  distribution: gaussian
  min: 0.5
  max: 2.0
  mean: 1.0
  std: 0.4

effects:
  - target: REP_TEMP
    type: absolute
    base_value: 35            # Forte hausse pression médiatique
    intensity_multiplier: 1.2
    delay: 0
  
  - target: IAC
    type: absolute
    base_value: -15
    intensity_multiplier: 1.0
    delay: 0
  
  - target: acquisition
    type: relative
    base_value: -0.25         # -25% acquisition
    intensity_multiplier: 1.0
    delay: 1
    duration: 3
  
  - target: resiliation
    type: relative
    base_value: 0.15          # +15% résiliations
    intensity_multiplier: 1.0
    delay: 1
    duration: 3
  
  - target: REG_HEAT
    type: absolute
    base_value: 15
    intensity_multiplier: 0.8
    delay: 1

duration: 3

recovery_rate: 0.40  # Récupération si réaction rapide

mitigation_factors:
  - source: LEV-CLI-02:proactif_mediation
    reduction: 0.35
  - source: communication_crise
    condition: "> 70"
    reduction: 0.30
  - source: BACKLOG_DAYS
    condition: "< 20"
    reduction: 0.50
  - source: COMPLAINTS_RATE
    condition: "< 5"
    reduction: 0.40

news_flash:
  title: "📺 CRISE MÉDIATIQUE"
  severity_levels:
    low: "Des témoignages de clients mécontents circulent sur les réseaux sociaux."
    medium: "Un reportage TV met en cause vos délais d'indemnisation. La presse s'empare du sujet."
    high: "TEMPÊTE MÉDIATIQUE : associations de consommateurs, politiques et régulateur vous interpellent publiquement."
```

---

### 3.10 EVT-FRAUD-OPP-01 — Pic fraude opportuniste post-événement

```yaml
id: EVT-FRAUD-OPP-01
name: Pic de fraude opportuniste post-événement
type: market
category: OPERATIONNEL

probability_base: 0.00  # Événement conditionnel uniquement

# Déclenchement conditionnel
trigger_condition:
  - "EVT-MKT-01 déclenché au tour précédent"
  - "OU EVT-CATNAT-01 déclenché au tour précédent"
triggered_probability: 0.60  # 60% si condition remplie

intensity:
  distribution: uniform
  min: 0.8
  max: 1.5

effects:
  - target: fraude_subie
    type: relative
    base_value: 0.40          # +40% fraude (sur baseline 5-7%)
    intensity_multiplier: 1.0
    delay: 0
    note: "Fraude opportuniste : fausses déclarations, majoration dommages"
  
  - target: severite
    type: relative
    base_value: 0.08          # +8% sévérité (fraude non détectée)
    intensity_multiplier: 1.0
    delay: 0
  
  - target: IPQO
    type: absolute
    base_value: -5            # Temps passé sur contrôles supplémentaires
    intensity_multiplier: 0.5
    delay: 0

duration: 2

mitigation_factors:
  - source: LEV-SIN-02:N2
    reduction: 0.30
  - source: LEV-SIN-02:N3
    reduction: 0.50
  - source: LEV-FRAUD-PROC-01:N2
    reduction: 0.25
  - source: LEV-FRAUD-PROC-01:N3
    reduction: 0.45
  - source: FRAUD_PROC_ROB
    condition: "> 60"
    reduction: 0.35

news_flash:
  title: "🎭 ALERTE FRAUDE"
  severity_levels:
    low: "Une légère hausse des déclarations suspectes est observée après l'événement climatique."
    medium: "Pic de fraude détecté : des réseaux opportunistes exploitent la situation. Vigilance renforcée."
    high: "FRAUDE ORGANISÉE : multiplication des fausses déclarations, montages avec prestataires suspects. Investigation en cours."
```

---

## 4) Matrice Récapitulative

### 4.1 Événements Marché

| ID | Nom | Proba base | Impact principal | Mitigation clé |
|----|-----|------------|------------------|----------------|
| EVT-MKT-01 | Épisode climatique | 15% | Fréq/Sév MRH ↑↑ | Réassurance, Prévention |
| EVT-MKT-02 | Inflation | 10% | Sévérité ↑ | Réseau agréé, Tarifs |
| EVT-MKT-03 | Choc réglementaire | 8% | Croissance ↓, Coûts ↑ | Conformité, IS |
| EVT-MKT-04 | Disrupteur digital | 5% | Parts marché ↓, Prix ↓ | IMD, Digital |
| EVT-MKT-05 | Mutation parc auto | 6% | Sévérité Auto ↑ | Formation, Réseau |

### 4.2 Événements Compagnie

| ID | Nom | Proba base | Vulnérabilité | Impact principal |
|----|-----|------------|---------------|------------------|
| EVT-CIE-01 | Cyberattaque | 3% | IMD faible, Dette tech | IPQO ↓↓, Capacité ↓↓ |
| EVT-CIE-02 | Panne SI | 4% | Dette tech, Stabilité SI | IPQO ↓, Capacité ↓ |
| EVT-CIE-03 | Crise RH | 2% (+auto) | IERH faible, Turnover | IERH ↓↓, Capacité ↓ |
| EVT-CIE-04 | Incident presta | 3% | Externalisation élevée | IPQO ↓, Sévérité ↑ |
| EVT-CIE-05 | Litige/Sanction | 2% | IS faible, Réclamations | Coûts ↑, IAC ↓ |

---

## 5) Invariants des Événements

```
INV-EVT-01  Probabilité_finale = Proba_base × Π(Vulnerability_modifiers)
            avec Probabilité_finale ≤ 0.50 (plafond)

INV-EVT-02  Impact_net = Impact_brut × Intensité × (1 - Σ(Mitigations))
            avec Impact_net ≥ 0.10 × Impact_brut (plancher 10%)

INV-EVT-03  Un événement compagnie ne peut toucher qu'une seule compagnie/tour

INV-EVT-04  Les événements marché affectent tous les acteurs simultanément

INV-EVT-05  Intensité ∈ [Intensity.min, Intensity.max]

INV-EVT-06  Un même événement ne peut se produire 2 tours consécutifs
            (cooldown = 1 tour minimum)

INV-EVT-07  auto_trigger = true → événement certain si condition remplie

INV-EVT-08  recovery_rate ∈ [0, 1], effets diminuent de recovery_rate/tour
```

---

## 6) Checklist Implémentation

- [ ] 20-30 événements au total (marché + compagnie)
- [ ] Minimum 2 événements compagnie (cyber + panne ou crise RH)
- [ ] Probabilités et vulnérabilités correctement calculées
- [ ] Intensité générée selon la distribution configurée
- [ ] Mitigations appliquées avec plancher 10%
- [ ] News flash adapté à la sévérité
- [ ] Cooldown respecté (pas de répétition)
- [ ] Auto-trigger vérifié chaque tour
- [ ] Effets retard ajoutés à la file
- [ ] Durée des effets correctement gérée
