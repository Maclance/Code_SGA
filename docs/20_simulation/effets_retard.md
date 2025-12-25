# effets_retard.md — Documentation des Effets Retard

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Auteur** : Simulation Engineer

---

## 1) Concept et Philosophie

### 1.1 Définition

Un **effet retard** (ou effet différé) est un impact d'une décision qui ne se manifeste pas immédiatement mais après un certain nombre de tours.

### 1.2 Objectifs pédagogiques

| Objectif | Description |
|----------|-------------|
| **Réalisme** | Les décisions stratégiques (RH, IT, prévention) mettent du temps à produire des effets |
| **Anticipation** | Le joueur doit anticiper et planifier, pas juste réagir |
| **Complexité systémique** | Les effets s'accumulent et se combinent dans le temps |
| **Inertie** | Certaines situations sont difficiles à corriger rapidement |

### 1.3 Principes de design

```
1. DÉLAI RÉALISTE
   → Le délai reflète la réalité métier (recrutement, formation, déploiement SI)

2. TRANSPARENCE
   → Le joueur est informé des effets retard en cours et de leur date d'application

3. PERSISTANCE
   → Une fois appliqué, l'effet reste actif (avec atténuation possible)

4. NON-ANNULATION
   → Un effet planifié ne peut pas être annulé, seulement compensé
```

---

## 2) Catalogue des Effets Retard par Domaine

### 2.1 RH — Ressources Humaines

| Levier | Effet | Délai (vitesse Moyenne) | Détail |
|--------|-------|-------------------------|--------|
| LEV-RH-01 Recrutement sinistres | IPQO ↑, Capacité ↑ | 2T | Recrutement + montée en compétence |
| LEV-RH-02 Recrutement IT/Data | IMD ↑ | 3T | Profils rares, intégration longue |
| LEV-RH-03 Recrutement distribution | IAC ↑ | 2T | Constitution réseau |
| LEV-RH-04 Formation | IERH ↑, Productivité ↑ | 1-2T | Selon type de formation |
| LEV-RH-05 Rémunération | Turnover ↓ → IERH ↑ | 1T | Effet rapide sur rétention |
| LEV-RH-06 QVT | Climat ↑ → IERH ↑ | 2-3T | Changement culturel lent |

#### Cascade RH → IPQO

```
Décision RH (t=0)
    │
    └─→ [t+2] IERH change
            │
            └─→ [t+4] IPQO change (cascade +2T)
                    │
                    └─→ [t+5] Satisfaction client change (+1T)
```

#### Exemple chiffré

```
Action: LEV-RH-01 Recrutement sinistres (2 unités budget → 10 ETP)
Tour: t = 3

Effets planifiés:
  - t+2 (tour 5): Effectif +10 ETP
  - t+2 (tour 5): Capacité +150 dossiers/trimestre
  - t+2 (tour 5): IPQO +5 (si sous-capacité actuelle)
  - t+2 (tour 5): IERH +3 (signal investissement)

État à t=3:
  effectifs = 140 ETP, capacité = 2_100
  
État à t=5:
  effectifs = 150 ETP, capacité = 2_250
  IPQO = IPQO_prev + 5
  IERH = IERH_prev + 3
```

---

### 2.2 IT & Data

| Levier | Effet | Délai (vitesse Moyenne) | Détail |
|--------|-------|-------------------------|--------|
| LEV-IT-01 Stabilité SI | Dette tech ↓ | 2-4T | Refactoring progressif |
| LEV-IT-02 Automatisation | IPQO ↑, Capacité ↑ | 3T | Déploiement + adoption |
| LEV-IT-03 Qualité données | IMD ↑ | 3T | Nettoyage + gouvernance |
| LEV-IT-04 Gouvernance data | IMD ↑, Prérequis IA | 4T | Changement organisationnel |
| LEV-IT-05 Cas d'usage IA | Variable selon use case | 4-6T | Développement + déploiement + tuning |
| LEV-IT-06 Sécurité SI | Vulnérabilité ↓ | 2T | Implémentation mesures |

#### Cascade IT → Fraude → IPP

```
Investissement IT/Data (t=0)
    │
    └─→ [t+3] IMD ↑ (+10)
            │
            └─→ [t+3] Prérequis IA satisfait (si IMD ≥ 60)
                    │
                    └─→ [t+4] Activation Fraude N3 possible
                            │
                            └─→ [t+8] Fraude évitée +30%
                                    │
                                    └─→ [t+8] IPP ↑
```

#### Exemple chiffré

```
Action: LEV-IT-03 Qualité données (2 unités)
Tour: t = 2
IMD actuel: 45

Effet planifié:
  - t+3 (tour 5): qualite_donnees +15
  - t+3 (tour 5): IMD recalculé

Calcul à t=5:
  qualite_donnees = 55 + 15 = 70
  
  IMD = 0.30×70 + 0.25×45 + 0.25×50 + 0 - 12
      = 21 + 11.25 + 12.5 - 12 = 32.75
  
  → Avant: IMD = 38, Après: IMD = 45 (gain de 7 points)
```

---

### 2.3 Prévention

| Levier | Effet | Délai (vitesse Moyenne) | Détail |
|--------|-------|-------------------------|--------|
| LEV-PREV-01 Prévention habitat N1 | Fréquence MRH ↓3% | 4T | Sensibilisation clients |
| LEV-PREV-01 Prévention habitat N2 | Fréquence MRH ↓8%, Sévérité ↓5% | 6T | Équipements distribués |
| LEV-PREV-01 Prévention habitat N3 | Fréquence MRH ↓15%, Sévérité ↓10% | 8T | Smart home, prédictif |
| LEV-PREV-02 Prévention auto N1 | Fréquence Auto ↓3% | 4T | Sensibilisation |
| LEV-PREV-02 Prévention auto N2 | Fréquence Auto ↓8%, Sévérité ↓5% | 6T | Équipements véhicules |

#### Évolution progressive

```
Activation Prévention N1 (t=0)
    │
    ├─→ [t+4] Fréquence ↓3%
    │
    Activation N2 (t=2, prérequis N1 actif)
    │
    └─→ [t+8] Fréquence cumulative ↓8% (remplace N1)
              Sévérité ↓5%
```

#### Exemple chiffré

```
Action: LEV-PREV-01 Prévention habitat N1 → N2
Tours: N1 activé à t=2, N2 activé à t=4

Timeline:
  t=2: Activation N1, coût 1 unité
  t=4: Activation N2, coût 2 unités (additionnel)
  t=6: Effet N1 appliqué → fréquence MRH -3%
  t=10: Effet N2 appliqué → fréquence MRH -8%, sévérité -5%

Avant (t=5):
  frequence_mrh = 0.06 (6%)
  severite_mrh = 4_000 €

Après effet N1 (t=6):
  frequence_mrh = 0.06 × 0.97 = 0.0582 (5.82%)

Après effet N2 (t=10):
  frequence_mrh = 0.06 × 0.92 = 0.0552 (5.52%)
  severite_mrh = 4_000 × 0.95 = 3_800 €

Impact économique annuel (100k contrats MRH):
  Avant: 100_000 × 0.06 × 4_000 = 24_000_000 €
  Après N2: 100_000 × 0.0552 × 3_800 = 20_976_000 €
  Économie: 3_024_000 € / an
```

---

### 2.4 Marketing & Distribution

| Levier | Effet | Délai (vitesse Moyenne) | Détail |
|--------|-------|-------------------------|--------|
| LEV-MKT-01 Publicité marque | Notoriété ↑ | 0T (immédiat) | Pic puis décroissance |
| LEV-MKT-02 Marketing direct | Acquisition ↑ | 1T | Campagne → leads → conversion |
| LEV-DIS-01 Mix canaux | IAC adapté | 2T | Restructuration réseau |
| LEV-DIS-02 Commissions | Animation ↑ | 1T | Réaction rapide réseau |
| LEV-DIS-03 Formation réseau | Qualité vente ↑ | 2T | Montée en compétence |

#### Pattern décroissance marketing

```
Campagne marketing (t=0)
    │
    ├─→ [t+0] Notoriété +8 (pic)
    ├─→ [t+1] Notoriété -2 (décroissance)
    ├─→ [t+2] Notoriété -2
    └─→ [t+3] Notoriété -2 (effet résiduel +2)
```

---

### 2.5 Sinistres & Fraude

| Levier | Effet | Délai (vitesse Moyenne) | Détail |
|--------|-------|-------------------------|--------|
| LEV-SIN-01 Organisation | IPQO ↑/↓ | 1T | Réorganisation opérationnelle |
| LEV-SIN-02 Fraude N1 | Fraude évitée +5% | 1T | Règles simples |
| LEV-SIN-02 Fraude N2 | Fraude évitée +15% | 2T | Process outillés |
| LEV-SIN-02 Fraude N3 | Fraude évitée +30% | 4T | IA prédictive |
| LEV-SIN-03 Recours | IPP ↑ (récupérations) | 2T | Mise en place processus |
| LEV-SIN-04 Expertise | Coût moyen ↓ | 2T | Formation + réseau experts |

---

### 2.6 Réassurance & Provisions

| Levier | Effet | Délai (vitesse Moyenne) | Détail |
|--------|-------|-------------------------|--------|
| LEV-REA-01 Niveau protection | IRF ↑/↓ | 0T | Effet immédiat |
| LEV-PROV-01 Politique provisions | IS ↑/↓ | 0T | Effet immédiat |
| LEV-PROV-01 (conséquences) | Boni/Mali | 2-4T | Dénouement provisions |

#### Pattern provisions

```
Provisions agressives (t=0)
    │
    ├─→ [t+0] IS ↓ (-10), IPP_apparent ↑ (+5)
    │
    └─→ [t+2 à t+4] Mali potentiel
            │
            ├─→ IPP_réel ↓ (coût sous-provisionnement)
            └─→ IRF ↓ (consommation capital)
```

---

## 3) Ajustement par Vitesse de Jeu

### 3.1 Facteurs d'ajustement

| Vitesse | Période/tour | Facteur délai | Exemple (RH 2T → ?) |
|---------|--------------|---------------|---------------------|
| Rapide | 1 an | ÷2 | 1T |
| Moyenne | 1 trimestre | ×1 | 2T |
| Lente | 1 mois | ×3 | 6T |

### 3.2 Application

```
delai_ajuste = ceil(delai_base × facteur_vitesse)

# Contrainte: minimum 1 tour
delai_final = max(1, delai_ajuste)
```

---

## 4) Ajustement par Difficulté

### 4.1 Facteurs d'ajustement

| Difficulté | Facteur délai | Amplitude effets |
|------------|---------------|------------------|
| Novice | ×0.5 | ±5/tour |
| Intermédiaire | ×1.0 | ±10/tour |
| Expert | ×1.5 | ±15/tour |

### 4.2 Implications

```
# Novice: effets arrivent plus vite, moins intenses
delai_novice = ceil(delai_base × 0.5)
amplitude_novice = amplitude_base × 0.5

# Expert: effets arrivent plus tard, plus intenses
delai_expert = ceil(delai_base × 1.5)
amplitude_expert = amplitude_base × 1.5
```

---

## 5) Structure de Données

### 5.1 File des effets retard

```typescript
interface DelayedEffect {
  id: string;                    // Identifiant unique
  source_lever: string;          // ID du levier déclencheur
  source_turn: number;           // Tour de création
  target_turn: number;           // Tour d'application
  type: EffectType;              // Type d'effet
  target: string;                // Cible (indice, variable)
  value: number;                 // Valeur de l'effet
  is_applied: boolean;           // Déjà appliqué ?
  description: string;           // Description pour UI
}

type EffectType = 
  | "delta_indice"      // Modification d'un indice
  | "delta_frequence"   // Modification fréquence sinistres
  | "delta_severite"    // Modification sévérité
  | "delta_capacite"    // Modification capacité traitement
  | "delta_effectifs"   // Modification effectifs
  | "unlock_lever"      // Déverrouillage d'un levier
  | "event_modifier"    // Modification probabilité événement
```

### 5.2 Exemple de file

```json
{
  "delayed_effects_queue": [
    {
      "id": "eff_001",
      "source_lever": "LEV-RH-01",
      "source_turn": 3,
      "target_turn": 5,
      "type": "delta_indice",
      "target": "IPQO",
      "value": 8,
      "is_applied": false,
      "description": "Recrutement 10 ETP sinistres → +8 IPQO"
    },
    {
      "id": "eff_002",
      "source_lever": "LEV-IT-03",
      "source_turn": 2,
      "target_turn": 5,
      "type": "delta_indice",
      "target": "IMD",
      "value": 7,
      "is_applied": false,
      "description": "Qualité données → +7 IMD"
    },
    {
      "id": "eff_003",
      "source_lever": "LEV-PREV-01-N1",
      "source_turn": 1,
      "target_turn": 5,
      "type": "delta_frequence",
      "target": "MRH",
      "value": -0.03,
      "is_applied": false,
      "description": "Prévention habitat N1 → -3% fréquence MRH"
    }
  ]
}
```

---

## 6) Affichage UI

### 6.1 Dashboard effets retard

| Élément | Contenu |
|---------|---------|
| **Effets à venir** | Liste des effets planifiés avec tour d'application |
| **Indicateur temporel** | "Dans 2 tours: IPQO +8 (recrutement)" |
| **Alerte expiration** | "Tour prochain: 3 effets s'appliquent" |
| **Historique** | Effets déjà appliqués (pour explainability) |

### 6.2 Format d'affichage

```
📅 Effets planifiés (tour 5 → tour 7)
─────────────────────────────────────
Tour 5:
  ✓ IPQO +8 (Recrutement sinistres)
  ✓ IMD +7 (Qualité données)
  ✓ Fréquence MRH -3% (Prévention N1)

Tour 6:
  → Capacité +250 dossiers (Automatisation)

Tour 7:
  → Fraude évitée +15% (Process outillés)
```

---

## 7) Invariants Effets Retard

```
INV-DELAY-01  effet.target_turn = effet.source_turn + delai

INV-DELAY-02  effet.target_turn > tour_courant
              (pas d'effet rétroactif)

INV-DELAY-03  Une fois appliqué, is_applied = true (irréversible)

INV-DELAY-04  Niveau_Levier_Progressif(t) ≥ Niveau(t-1)
              (les effets ne peuvent pas faire régresser un levier progressif)

INV-DELAY-05  delai_final = max(1, ceil(delai_base × facteur_vitesse × facteur_difficulte))

INV-DELAY-06  ∀ effet appliqué: log dans historique pour explainability
```

---

## 8) Scénarios de Test

### Scénario 1: Cascade RH → IPQO → Satisfaction

```yaml
given:
  tour: 1
  IERH: 50
  IPQO: 60
  satisfaction: 55
  action: LEV-RH-01 (Recrutement sinistres)

when:
  - tour 3: effet RH appliqué

then:
  - tour 3: IERH = 50 + 3 = 53
  - tour 5: IPQO = 60 + 5 = 65 (cascade +2T)
  - tour 6: satisfaction = 55 + 3 = 58 (cascade +1T)
```

### Scénario 2: Prévention multi-niveaux

```yaml
given:
  tour: 0
  frequence_mrh: 0.06
  severite_mrh: 4000

when:
  - tour 0: activation PREV-01-N1
  - tour 2: activation PREV-01-N2

then:
  - tour 4: frequence_mrh = 0.06 × 0.97 = 0.0582
  - tour 8: frequence_mrh = 0.06 × 0.92 = 0.0552
            severite_mrh = 4000 × 0.95 = 3800
```

### Scénario 3: Provisions agressives → Mali

```yaml
given:
  tour: 1
  IS: 70
  IPP: 55
  provisions_adequation: 0 (standard)

when:
  - tour 1: politique provisions = Agressive
  - adequation devient -0.15

then:
  - tour 1: IS = 70 - 15 = 55
            IPP_apparent = 55 + 5 = 60
  - tour 3-4: Mali probable
            IPP_réel = 60 - 10 = 50
            IRF = IRF - 8
```

---

## 9) Checklist Implémentation

- [ ] File d'effets retard initialisée à chaque session
- [ ] Application automatique au tour prévu
- [ ] Ajustement par vitesse appliqué
- [ ] Ajustement par difficulté appliqué
- [ ] Cascades correctement chronologiquement ordonnées
- [ ] UI affiche les effets à venir
- [ ] Historique des effets appliqués pour explainability
- [ ] Invariants vérifiés à chaque tour
- [ ] Tests automatisés pour les scénarios clés
