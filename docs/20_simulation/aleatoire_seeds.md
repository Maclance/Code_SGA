# aleatoire_seeds.md — Gestion de l'Aléatoire et des Seeds

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Auteur** : Simulation Engineer

---

## 1) Principes

### 1.1 Objectifs

| Objectif | Description |
|----------|-------------|
| **Reproductibilité** | Même seed + mêmes décisions = mêmes résultats |
| **Équité** | Tous les joueurs d'une session partagent le même seed |
| **Variété** | Chaque session offre une expérience différente |
| **Débugage** | Pouvoir rejouer exactement une situation pour investigation |

### 1.2 Contrainte fondamentale

```
INV-SEED-01: ∀ (seed, decisions, engine_version) → résultat déterministe

Si seed_A = seed_B et decisions_A = decisions_B et engine_A = engine_B
Alors state_final_A = state_final_B
```

---

## 2) Architecture du Générateur

### 2.1 PRNG (Pseudo-Random Number Generator)

**Algorithme recommandé** : Mersenne Twister (MT19937) ou Xorshift128+

```typescript
interface RandomGenerator {
  seed: number;                 // Seed initial 32-bit ou 64-bit
  state: number[];              // État interne
  
  // Méthodes
  next(): number;               // [0, 1)
  nextInt(min: number, max: number): number;
  nextGaussian(mean: number, std: number): number;
  shuffle<T>(array: T[]): T[];
  choice<T>(array: T[]): T;
  weightedChoice<T>(items: T[], weights: number[]): T;
}
```

### 2.2 Hiérarchie des seeds

```
Session Seed (master)
    │
    ├── Events Seed
    │     ├── Market Events Sub-seed
    │     └── Company Events Sub-seed
    │
    ├── AI Seed
    │     └── Competitor Decisions Sub-seed
    │
    ├── Claims Seed
    │     ├── Frequency Sub-seed
    │     └── Severity Sub-seed
    │
    └── Misc Seed
          ├── Initial Company Traits
          └── Minor Variations
```

### 2.3 Dérivation des sub-seeds

```typescript
function deriveSubSeed(masterSeed: number, domain: string): number {
  // Hash déterministe du master seed + domain
  const combined = `${masterSeed}:${domain}`;
  return hashToSeed(combined);  // Ex: MurmurHash3
}

// Usage
const sessionSeed = 12345;
const eventsSeed = deriveSubSeed(sessionSeed, "events");
const aiSeed = deriveSubSeed(sessionSeed, "ai");
const claimsSeed = deriveSubSeed(sessionSeed, "claims");
```

---

## 3) Sources d'Aléatoire

### 3.1 Événements

| Élément | Méthode | Distribution |
|---------|---------|--------------|
| Occurrence événement | `next() < probability` | Bernoulli |
| Intensité événement | `nextGaussian(mean, std)` | Normale bornée |
| Sélection événement | `weightedChoice()` | Catégorielle |

**Formule**

```
# Tirage occurrence
event_occurs = random.next() < probability_adjusted

# Tirage intensité (si occurrence)
intensity = clamp(
  random.nextGaussian(config.intensity.mean, config.intensity.std),
  config.intensity.min,
  config.intensity.max
)

# Sélection événement si plusieurs candidats
selected_event = random.weightedChoice(candidates, probabilities)
```

**Exemple chiffré**

```
Seed session: 42
Events seed dérivé: 28764

Tour 3, tirage événement climatique:
  probability = 0.15
  random_value = 0.12 (< 0.15) → événement déclenché
  
  intensity_mean = 1.0, std = 0.3
  random_intensity = 1.23 → dans [0.5, 2.0] → accepté
  
Résultat: Épisode climatique intensité 1.23
```

---

### 3.2 Sinistralité

| Élément | Méthode | Distribution |
|---------|---------|--------------|
| Variation fréquence | `nextGaussian(0, variance)` | Normale |
| Variation sévérité | `nextGaussian(0, variance)` | Normale |
| Pic de sinistres | `nextInt(range)` | Uniforme |

**Formule**

```
# Fréquence observée
frequence_observee = frequence_base × (1 + random.nextGaussian(0, variance_freq))

# Contrainte: pas de fréquence négative
frequence_observee = max(0, frequence_observee)

# Sévérité observée
severite_observee = severite_base × (1 + random.nextGaussian(0, variance_sev))
severite_observee = max(500, severite_observee)  # Plancher réaliste
```

**Paramètres par difficulté**

| Difficulté | variance_freq | variance_sev |
|------------|---------------|--------------|
| Novice | 0.02 | 0.03 |
| Intermédiaire | 0.05 | 0.08 |
| Expert | 0.10 | 0.12 |

---

### 3.3 Comportement IA (Concurrents)

| Élément | Méthode | Distribution |
|---------|---------|--------------|
| Décision stratégique | `weightedChoice()` | Catégorielle |
| Amplitude décision | `nextGaussian(profile.mean)` | Normale |
| Réactivité | `next() < reactivity` | Bernoulli |

**Formule**

```
# Décision d'un concurrent IA
function aiDecision(competitor, market_state, random):
  profile = competitor.strategy_profile  # aggressive, balanced, defensive
  
  # Réactivité: l'IA réagit-elle ce tour ?
  reacts = random.next() < profile.reactivity
  
  if not reacts:
    return MAINTAIN_CURRENT
  
  # Analyse situation
  situation = analyzeMarket(competitor, market_state)
  
  # Choix stratégique pondéré
  options = [LOWER_PRICE, MAINTAIN, RAISE_PRICE, INVEST_QUALITY]
  weights = profile.getWeights(situation)
  
  choice = random.weightedChoice(options, weights)
  
  # Amplitude
  amplitude = random.nextGaussian(profile.amplitude_mean, profile.amplitude_std)
  
  return { action: choice, amplitude: clamp(amplitude, 0.5, 1.5) }
```

---

### 3.4 Initialisation compagnie

| Élément | Méthode | Distribution |
|---------|---------|--------------|
| Indices initiaux | Déterministe (profil) | - |
| Variation initiale | `nextGaussian(0, 3)` | Normale |
| Traits mineurs | `shuffle()` | Permutation |

**Formule**

```
# Indices initiaux avec légère variation
for indice in indices:
  base_value = company_profile[indice]
  variation = random.nextGaussian(0, 3)  # ±3 points typiquement
  initial_value = clamp(base_value + variation, 0, 100)
```

---

## 4) Gestion par Tour

### 4.1 Séquence de tirage

```
Tour N commence
    │
    ├── 1. Avancer état PRNG (déterministe)
    │
    ├── 2. Tirage événements marché
    │     └── Pour chaque événement possible: tirage occurrence + intensité
    │
    ├── 3. Tirage événements compagnie (pour chaque compagnie)
    │     └── Calcul probabilités ajustées → tirage
    │
    ├── 4. Tirage variations sinistralité
    │     └── Fréquence et sévérité par produit
    │
    ├── 5. Décisions IA
    │     └── Pour chaque concurrent: tirage comportement
    │
    └── 6. Variations mineures
          └── Fluctuations diverses
```

### 4.2 Consommation reproductible

**Principe** : L'ordre de consommation du PRNG doit être identique pour garantir la reproductibilité.

```typescript
function processTurn(state: SimulationState, random: RandomGenerator): void {
  // TOUJOURS dans le même ordre
  
  // 1. Événements marché (ordre fixe)
  const marketEvents = MARKET_EVENTS.map(evt => 
    tryTriggerEvent(evt, state, random)
  );
  
  // 2. Événements compagnie (ordre fixe par ID)
  const sortedCompanies = state.companies.sort((a, b) => a.id.localeCompare(b.id));
  const companyEvents = sortedCompanies.map(company =>
    COMPANY_EVENTS.map(evt =>
      tryTriggerEventForCompany(evt, company, state, random)
    )
  );
  
  // 3. Sinistralité (ordre: produits triés, puis fréquence, puis sévérité)
  // ...etc
}
```

---

## 5) API et Stockage

### 5.1 Structure de données

```typescript
interface SessionRandomState {
  master_seed: number;           // Seed principal
  current_turn: number;          // Tour courant
  prng_state: number[];          // État interne PRNG
  
  // Audit trail
  consumption_log: {
    turn: number;
    operation: string;
    values_consumed: number;
  }[];
}
```

### 5.2 Persistance

```json
{
  "session_id": "abc123",
  "master_seed": 42,
  "engine_version": "1.0.0",
  "random_state": {
    "current_turn": 5,
    "prng_internal_state": [1234567890, 987654321, ...],
    "consumption_count": 47
  }
}
```

### 5.3 API

```typescript
// Initialisation
function initializeRandom(seed?: number): SessionRandomState {
  const masterSeed = seed ?? Date.now();  // Seed fourni ou aléatoire
  const prng = new MersenneTwister(masterSeed);
  
  return {
    master_seed: masterSeed,
    current_turn: 0,
    prng_state: prng.getState()
  };
}

// Restauration (pour rejeu)
function restoreRandom(savedState: SessionRandomState): RandomGenerator {
  const prng = new MersenneTwister(savedState.master_seed);
  prng.setState(savedState.prng_state);
  return prng;
}

// Avance rapide au tour N
function fastForwardTo(masterSeed: number, turn: number, decisions: Decision[]): SimulationState {
  const prng = new MersenneTwister(masterSeed);
  let state = initializeState(prng);
  
  for (let t = 1; t <= turn; t++) {
    state = processTurn(state, decisions[t], prng);
  }
  
  return state;
}
```

---

## 6) Modes de Seed

### 6.1 Mode Standard

```
Seed = Généré automatiquement (timestamp + random)
Usage = Session normale, chaque partie est unique
```

### 6.2 Mode Seed Manuel

```
Seed = Fourni par l'admin/formateur
Usage = Reproductibilité pour formation, démo, évaluation
Interface = Champ optionnel dans paramétrage session
```

### 6.3 Mode Seed Partagé (Multijoueur)

```
Seed = Généré par le serveur, partagé à tous les participants
Usage = Équité en multijoueur
Contrainte = Tous les joueurs voient les mêmes événements marché
```

### 6.4 Mode Rejeu (Replay)

```
Seed = Récupéré depuis une session archivée
Usage = Debug, analyse post-partie, formation
Contrainte = Décisions doivent être identiques pour résultat identique
```

---

## 7) Considérations de Sécurité

### 7.1 Non-prédictibilité côté client

```
Le seed NE DOIT PAS être exposé au client pendant la partie.
→ Les tirages sont effectués côté serveur
→ Le client reçoit uniquement les résultats
```

### 7.2 Anti-triche

```
# Ordre de calcul serveur-side
1. Joueur soumet décisions
2. Serveur tire les événements (seed)
3. Serveur calcule état suivant
4. Serveur envoie résultat

Le joueur ne peut pas connaître les événements avant de décider.
```

### 7.3 Audit

```
# Log pour vérification post-hoc
{
  "session_id": "abc",
  "turn": 5,
  "seed_state_before": "...",
  "random_values_consumed": [0.234, 0.891, 0.456],
  "events_triggered": ["EVT-MKT-01"],
  "seed_state_after": "..."
}
```

---

## 8) Exemples Complets

### 8.1 Initialisation session

```typescript
// Nouvelle session avec seed aléatoire
const session = createSession({
  difficulty: "Intermediate",
  speed: "Medium",
  products: ["AUTO", "MRH"]
});

// Seed généré: 1703520000 (ex: timestamp)
console.log(session.random_state.master_seed);  // 1703520000

// État initial reproductible
const state = initializeCompany(session, session.random_state);
```

### 8.2 Rejeu exact

```typescript
// Session originale terminée, seed = 1703520000
const originalSeed = 1703520000;
const originalDecisions = loadDecisions("session_abc");

// Rejeu
const replayState = fastForwardTo(originalSeed, 10, originalDecisions);

// Vérification
assert(replayState.indices.IAC === originalFinalState.indices.IAC);
assert(replayState.pnl.total === originalFinalState.pnl.total);
```

### 8.3 Simulation Monte Carlo (admin)

```typescript
// Tester 1000 seeds différents pour évaluer la difficulté
const results = [];
for (let i = 0; i < 1000; i++) {
  const seed = baseTimestamp + i;
  const finalState = simulateAIOnly(seed, config);
  results.push({
    seed,
    final_score: finalState.score,
    survived: finalState.turn >= targetTurn
  });
}

// Analyse
const avgScore = results.reduce((s, r) => s + r.final_score, 0) / 1000;
const survivalRate = results.filter(r => r.survived).length / 1000;
```

---

## 9) Invariants

```
INV-SEED-01  Même (seed, decisions, engine_version) → même résultat

INV-SEED-02  Consommation PRNG dans un ordre fixe et déterministe

INV-SEED-03  Seed non exposé au client pendant la partie

INV-SEED-04  État PRNG persisté pour permettre restauration

INV-SEED-05  Sub-seeds dérivés de manière déterministe

INV-SEED-06  Intensité ∈ [min, max] configuré (bornes respectées)

INV-SEED-07  Probabilités ajustées plafonnées (≤ 0.50 typiquement)
```

---

## 10) Checklist Implémentation

- [ ] PRNG initialisé avec seed au démarrage
- [ ] Sub-seeds dérivés pour chaque domaine
- [ ] Ordre de consommation fixe et documenté
- [ ] État PRNG persisté à chaque tour
- [ ] Restauration depuis état sauvegardé fonctionne
- [ ] Mode rejeu produit résultats identiques
- [ ] Seed non exposé côté client
- [ ] Log d'audit des valeurs consommées
- [ ] Bornes (min/max) respectées sur tous les tirages
- [ ] Tests automatisés de reproductibilité
